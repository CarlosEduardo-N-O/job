<?php

namespace App\Http\Controllers;

use App\Models\Interacao;
use App\Models\InteracaoTipo;
use App\Models\Trabalho;
use App\Models\TrabalhoInteracao;
use App\Models\TrabalhoStatus;
use App\Models\TrabalhoPagamento;
use App\Models\TrabalhoPagamentoStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class TrabalhoController extends Controller
{
    /**
     * Lista os trabalhos que o usuário contratou.
     */
    #[OA\Get(
        path: '/api/trabalhos/contratacoes',
        summary: 'Lista trabalhos contratados pelo usuário',
        description: 'Retorna os trabalhos em que o usuário autenticado é o contratante.',
        tags: ['Trabalhos'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de trabalhos contratados'
            ),
            new OA\Response(
                response: 401,
                description: 'Usuário não autenticado'
            )
        ]
    )]
    public function contratacoes(Request $request)
    {
        $usuario = $request->user();

        $trabalhos = Trabalho::with([
            'status',
            'publicacao.categoria',
            'negociacao.status',
            'contratante',
            'contratado',
            'pagamentos.status',
        ])
            ->where(
                'id_contratante',
                $usuario->id
            )
            ->orderByDesc('id_trabalho')
            ->get();

        return response()->json([
            'data' => $trabalhos,
        ]);
    }

    /**
     * Lista os trabalhos em que o usuário foi contratado.
     */
    #[OA\Get(
        path: '/api/trabalhos/meus',
        summary: 'Lista trabalhos em que o usuário foi contratado',
        description: 'Retorna os trabalhos em que o usuário autenticado é o contratado.',
        tags: ['Trabalhos'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de trabalhos do contratado'
            ),
            new OA\Response(
                response: 401,
                description: 'Usuário não autenticado'
            )
        ]
    )]
    public function meus(Request $request)
    {
        $usuario = $request->user();

        $trabalhos = Trabalho::with([
            'status',
            'publicacao.categoria',
            'negociacao.status',
            'contratante',
            'contratado',
            'pagamentos.status',
        ])
            ->where(
                'id_contratado',
                $usuario->id
            )
            ->orderByDesc('id_trabalho')
            ->get();

        return response()->json([
            'data' => $trabalhos,
        ]);
    }

    /**
     * Registra uma interação no trabalho.
     *
     * O tipo da interação é informado pelo ID.
     *
     * O controller aceita somente tipos cujo contexto
     * seja TRABALHO.
     */
    #[OA\Post(
        path: '/api/trabalhos/{trabalho}/interacoes',
        summary: 'Interage com um trabalho',
        description: 'Permite ao contratado concluir ou desistir e ao contratante confirmar, contestar ou desistir conforme o status atual do trabalho.',
        tags: ['Trabalhos'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'trabalho',
                description: 'ID do trabalho',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer',
                    example: 1
                )
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'id_interacao_tipo',
                ],
                properties: [
                    new OA\Property(
                        property: 'id_interacao_tipo',
                        type: 'integer',
                        enum: [
                            6,
                            7,
                            8,
                            9,
                            10,
                        ],
                        description: 'ID do tipo de interação. O tipo precisa pertencer ao contexto TRABALHO.',
                        example: 6
                    ),
                    new OA\Property(
                        property: 'mensagem',
                        type: 'string',
                        nullable: true,
                        example: 'Serviço concluído conforme combinado.'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Interação registrada'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não autorizado'
            ),
            new OA\Response(
                response: 422,
                description: 'Interação não permitida'
            )
        ]
    )]
    public function interagir(
        Request $request,
        Trabalho $trabalho
    ) {
        $usuario = $request->user();

        /*
         * Verifica se o usuário participa
         * do trabalho.
         */
        $this->validarParticipante(
            $usuario->id,
            $trabalho
        );

        /*
         * Recebe somente o ID do tipo.
         */
        $dados = $request->validate([
            'id_interacao_tipo' => [
                'required',
                'integer',
            ],
            'mensagem' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $idInteracaoTipo =
            (int) $dados['id_interacao_tipo'];

        /*
         * Busca o tipo pelo ID E verifica
         * se ele pertence ao contexto TRABALHO.
         */
        $interacaoTipo =
            InteracaoTipo::where(
                'id_interacao_tipo',
                $idInteracaoTipo
            )
            ->where(
                'contexto',
                'TRABALHO'
            )
            ->first();

        if (!$interacaoTipo) {
            throw ValidationException::withMessages([
                'id_interacao_tipo' => [
                    'O tipo de interação informado não pertence ao contexto de trabalho.',
                ],
            ]);
        }

        /*
         * Verifica o papel do usuário.
         */
        $isContratante =
            (int) $trabalho->id_contratante ===
            (int) $usuario->id;

        $isContratado =
            (int) $trabalho->id_contratado ===
            (int) $usuario->id;

        /*
         * Busca o status atual do trabalho.
         */
        $codigoStatus =
            $trabalho
            ->status()
            ->value('codigo');

        /*
        |--------------------------------------------------------------------------
        | CONTRATADO
        |--------------------------------------------------------------------------
        |
        | ID 6 = SERVICO_CONCLUIDO
        | ID 9 = DESISTENCIA_CONTRATADO
        |
        */

        if ($isContratado) {

            /*
             * Serviço concluído.
             */
            if ($idInteracaoTipo === 6) {

                if ($codigoStatus !== 'PENDENTE') {
                    throw ValidationException::withMessages([
                        'trabalho' => [
                            'O trabalho não está pendente para conclusão pelo contratado.',
                        ],
                    ]);
                }

                $novoStatus =
                    'AGUARDANDO_CONFIRMACAO';
            }

            /*
             * Desistência do contratado.
             */
            elseif ($idInteracaoTipo === 9) {

                if ($codigoStatus !== 'PENDENTE') {
                    throw ValidationException::withMessages([
                        'trabalho' => [
                            'O contratado só pode desistir enquanto o trabalho estiver pendente.',
                        ],
                    ]);
                }

                $novoStatus =
                    'DESISTENCIA';
            }

            /*
             * Tipo de trabalho existente,
             * mas não permitido para o contratado.
             */
            else {
                throw ValidationException::withMessages([
                    'id_interacao_tipo' => [
                        'Esta interação não está disponível para o contratado.',
                    ],
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CONTRATANTE
        |--------------------------------------------------------------------------
        |
        | ID 7 = SERVICO_CONFIRMADO
        | ID 8 = SERVICO_CONTESTADO
        | ID 10 = DESISTENCIA_CONTRATANTE
        |
        */
        elseif ($isContratante) {

            /*
             * Confirma a conclusão.
             */
            if ($idInteracaoTipo === 7) {

                if ($codigoStatus !== 'AGUARDANDO_CONFIRMACAO') {
                    throw ValidationException::withMessages([
                        'trabalho' => [
                            'Não existe uma conclusão pendente para confirmação.',
                        ],
                    ]);
                }

                $novoStatus =
                    'CONCLUIDO';
            }

            /*
             * Contesta a conclusão.
             */
            elseif ($idInteracaoTipo === 8) {

                if ($codigoStatus !== 'AGUARDANDO_CONFIRMACAO') {
                    throw ValidationException::withMessages([
                        'trabalho' => [
                            'Não existe uma conclusão pendente para contestação.',
                        ],
                    ]);
                }

                $novoStatus =
                    'EM_AVALIACAO';
            }

            /*
             * Desistência do contratante.
             */
            elseif ($idInteracaoTipo === 10) {

                if ($codigoStatus !== 'PENDENTE') {
                    throw ValidationException::withMessages([
                        'trabalho' => [
                            'O contratante não pode mais desistir após o contratado informar a conclusão do serviço.',
                        ],
                    ]);
                }

                $novoStatus =
                    'DESISTENCIA';
            }

            /*
             * Tipo de trabalho existente,
             * mas não permitido para o contratante.
             */
            else {
                throw ValidationException::withMessages([
                    'id_interacao_tipo' => [
                        'Esta interação não está disponível para o contratante.',
                    ],
                ]);
            }
        }

        /*
         * Usuário não participa do trabalho.
         */
        else {
            abort(
                403,
                'Você não participa deste trabalho.'
            );
        }

        return DB::transaction(function () use (
            $dados,
            $usuario,
            $trabalho,
            $interacaoTipo,
            $novoStatus
        ) {

            /*
             * Cria a interação usando o ID
             * encontrado na tabela interacao_tipos.
             */
            $interacao =
                Interacao::create([
                    'id_interacao_tipo' =>
                    $interacaoTipo->id_interacao_tipo,

                    'remetente_id' =>
                    $usuario->id,

                    'mensagem' =>
                    $dados['mensagem'] ?? null,

                    'valor_proposto' =>
                    null,
                ]);

            /*
             * Vincula a interação ao trabalho.
             */
            TrabalhoInteracao::create([
                'id_trabalho' =>
                $trabalho->id_trabalho,

                'id_interacao' =>
                $interacao->id_interacao,
            ]);

            /*
             * Busca o novo status.
             */
            $status =
                TrabalhoStatus::where(
                    'codigo',
                    $novoStatus
                )
                ->where(
                    'ativo',
                    true
                )
                ->first();

            if (!$status) {
                throw ValidationException::withMessages([
                    'trabalho' => [
                        'Status do trabalho não encontrado.',
                    ],
                ]);
            }

            /*
             * Atualiza o status do trabalho.
             */
            $trabalho->update([
                'status_id' => $status->id,
            ]);

            /*
             * =========================================================
             * PAGAMENTO DO TRABALHO
             * =========================================================
             *
             * Quando o contratante confirma que o serviço foi realizado,
             * o trabalho passa para CONCLUIDO e a plataforma cria
             * automaticamente o registro de pagamento ao contratado.
             *
             * O pagamento começa como AGUARDANDO_PROCESSAMENTO.
             *
             * Os valores financeiros são copiados do trabalho:
             *
             * valor_trabalho = valor que o contratado recebe
             * valor_taxa     = taxa de intermediação da JOB
             * valor_total    = total da operação
             */
            if ($novoStatus === 'CONCLUIDO') {

                $trabalho->update([
                    'data_conclusao' => now(),
                ]);

                /*
                 * Busca o status inicial do pagamento.
                 */
                $statusPagamento =
                    TrabalhoPagamentoStatus::where(
                        'codigo',
                        'AGUARDANDO_PROCESSAMENTO'
                    )
                    ->where(
                        'ativo',
                        true
                    )
                    ->first();

                if (!$statusPagamento) {
                    throw ValidationException::withMessages([
                        'pagamento' => [
                            'O status AGUARDANDO_PROCESSAMENTO não foi encontrado.',
                        ],
                    ]);
                }

                /*
                 * Garante que não seja criado mais de um
                 * pagamento do tipo PAGAMENTO_CONTRATADO
                 * para o mesmo trabalho.
                 */
                TrabalhoPagamento::firstOrCreate(
                    [
                        'id_trabalho' =>
                        $trabalho->id_trabalho,

                        'tipo' =>
                        'PAGAMENTO_CONTRATADO',
                    ],
                    [
                        'status_id' =>
                        $statusPagamento
                            ->id_trabalho_pagamento_status,

                        /*
                         * Valor do serviço que será recebido
                         * pelo contratado.
                         */
                        'valor_trabalho' =>
                        $trabalho->valor_trabalho,

                        /*
                         * Taxa de intermediação da JOB.
                         */
                        'valor_taxa' =>
                        $trabalho->valor_taxa,

                        /*
                         * Valor total da operação.
                         */
                        'valor_total' =>
                        $trabalho->valor_total,

                        'data_processamento' =>
                        null,

                        'observacao' =>
                        'Pagamento aguardando processamento pela plataforma.',
                    ]
                );
            }

            /*
             * Recarrega os relacionamentos.
             */
            $trabalho->load([
                'status',
                'publicacao.categoria',
                'contratante',
                'contratado',
                'negociacao.status',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
                'pagamentos.status',
            ]);

            return response()->json([
                'message' =>
                'Interação registrada e status do trabalho atualizado.',

                'data' => [
                    'trabalho' =>
                    $trabalho,

                    'interacao' =>
                    $interacao->load([
                        'tipo',
                        'remetente',
                    ]),
                ],
            ]);
        });
    }

    /**
     * Verifica se o usuário participa do trabalho.
     */
    private function validarParticipante(
        int $usuarioId,
        Trabalho $trabalho
    ): void {
        if (
            (int) $trabalho->id_contratante !== $usuarioId
            &&
            (int) $trabalho->id_contratado !== $usuarioId
        ) {
            abort(
                403,
                'Você não participa deste trabalho.'
            );
        }
    }
}