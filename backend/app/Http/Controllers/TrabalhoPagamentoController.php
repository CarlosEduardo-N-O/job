<?php

namespace App\Http\Controllers;

use App\Models\Trabalho;
use App\Models\TrabalhoPagamento;
use App\Models\TrabalhoPagamentoStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class TrabalhoPagamentoController extends Controller
{
    /**
     * Exibe os pagamentos do trabalho.
     *
     * Retorna o pagamento atual e também o histórico
     * de pagamentos relacionados ao trabalho.
     */
    #[OA\Get(
        path: '/api/trabalhos/{trabalho}/pagamento',
        summary: 'Consulta o pagamento do trabalho',
        description: 'Retorna o pagamento atual e o histórico de pagamentos relacionados ao trabalho.',
        tags: ['Trabalhos - Pagamentos'],
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
        responses: [
            new OA\Response(
                response: 200,
                description: 'Pagamentos encontrados'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa do trabalho'
            )
        ]
    )]
    public function show(
        Request $request,
        Trabalho $trabalho
    ) {
        $usuario = $request->user();

        /*
         * Somente contratante ou contratado podem
         * consultar os pagamentos do trabalho.
         */
        if (
            $trabalho->id_contratante != $usuario->id
            &&
            $trabalho->id_contratado != $usuario->id
        ) {
            abort(
                403,
                'Você não participa deste trabalho.'
            );
        }

        /*
         * Busca todos os pagamentos do trabalho,
         * sempre trazendo o status relacionado.
         */
        $pagamentos = $trabalho
            ->pagamentos()
            ->with('status')
            ->orderByDesc('id_trabalho_pagamento')
            ->get();

        /*
         * O primeiro registro é o pagamento mais recente,
         * pois a consulta está ordenada de forma decrescente.
         */
        $pagamentoAtual = $pagamentos->first();

        return response()->json([
            'data' => [
                'pagamento' => $pagamentoAtual,
                'pagamentos' => $pagamentos,
            ],
        ]);
    }

    /**
     * Confirma o pagamento pela plataforma.
     *
     * Rota pública utilizada para demonstração.
     */
    #[OA\Post(
        path: '/api/trabalhos/{trabalho}/pagamento/confirmar',
        summary: 'Confirma o pagamento do trabalho',
        description: 'Confirma, para fins de demonstração, que a plataforma realizou o pagamento ao contratado.',
        tags: ['Trabalhos - Pagamentos'],
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
        responses: [
            new OA\Response(
                response: 200,
                description: 'Pagamento confirmado'
            ),
            new OA\Response(
                response: 422,
                description: 'Pagamento não pode ser confirmado'
            )
        ]
    )]
    public function confirmar(
        Trabalho $trabalho
    ) {
        return DB::transaction(function () use ($trabalho) {

            /*
             * O trabalho precisa estar concluído
             * antes que a plataforma possa repassar
             * o pagamento ao contratado.
             */
            $codigoStatusTrabalho = $trabalho
                ->status()
                ->value('codigo');

            if ($codigoStatusTrabalho !== 'CONCLUIDO') {
                throw ValidationException::withMessages([
                    'trabalho' => [
                        'O pagamento somente pode ser confirmado após a conclusão do trabalho.',
                    ],
                ]);
            }

            /*
             * Busca o pagamento do contratado que
             * ainda está aguardando processamento.
             */
            $pagamento = $trabalho
                ->pagamentos()
                ->where(
                    'tipo',
                    'PAGAMENTO_CONTRATADO'
                )
                ->whereHas(
                    'status',
                    function ($query) {
                        $query->where(
                            'codigo',
                            'AGUARDANDO_PROCESSAMENTO'
                        );
                    }
                )
                ->latest(
                    'id_trabalho_pagamento'
                )
                ->first();

            if (!$pagamento) {
                throw ValidationException::withMessages([
                    'pagamento' => [
                        'Não existe pagamento aguardando processamento para este trabalho.',
                    ],
                ]);
            }

            /*
             * Busca o status final PAGO.
             */
            $statusPago = $this->buscarStatusPagamento(
                'PAGO'
            );

            /*
             * Atualiza o pagamento.
             */
            $pagamento->update([
                'status_id' =>
                    $statusPago->id_trabalho_pagamento_status,

                'data_processamento' =>
                    now(),

                'observacao' =>
                    'Pagamento repassado ao contratado pela plataforma.',
            ]);

            /*
             * Recarrega todas as relações necessárias
             * para devolver uma resposta completa.
             */
            $pagamento->load([
                'status',
                'trabalho',
                'trabalho.contratante',
                'trabalho.contratado',
            ]);

            return response()->json([
                'message' =>
                    'Pagamento confirmado e repassado ao contratado com sucesso.',

                'data' => [
                    'pagamento' => $pagamento,
                ],
            ]);
        });
    }

    /**
     * Recusa o pagamento pela plataforma.
     *
     * Rota pública utilizada para demonstração.
     */
    #[OA\Post(
        path: '/api/trabalhos/{trabalho}/pagamento/recusar',
        summary: 'Recusa o pagamento do trabalho',
        description: 'Recusa, para fins de demonstração, o processamento do pagamento ao contratado.',
        tags: ['Trabalhos - Pagamentos'],
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
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'observacao',
                        type: 'string',
                        nullable: true,
                        example: 'Pagamento recusado para análise da plataforma.'
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Pagamento recusado'
            ),
            new OA\Response(
                response: 422,
                description: 'Pagamento não pode ser recusado'
            )
        ]
    )]
    public function recusar(
        Request $request,
        Trabalho $trabalho
    ) {
        $dados = $request->validate([
            'observacao' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        return DB::transaction(function () use (
            $trabalho,
            $dados
        ) {

            /*
             * Busca o pagamento que está aguardando
             * processamento.
             */
            $pagamento = $trabalho
                ->pagamentos()
                ->where(
                    'tipo',
                    'PAGAMENTO_CONTRATADO'
                )
                ->whereHas(
                    'status',
                    function ($query) {
                        $query->where(
                            'codigo',
                            'AGUARDANDO_PROCESSAMENTO'
                        );
                    }
                )
                ->latest(
                    'id_trabalho_pagamento'
                )
                ->first();

            if (!$pagamento) {
                throw ValidationException::withMessages([
                    'pagamento' => [
                        'Não existe pagamento aguardando processamento para este trabalho.',
                    ],
                ]);
            }

            /*
             * Busca o status final de pagamento
             * não processado.
             */
            $statusNaoProcessado =
                $this->buscarStatusPagamento(
                    'NAO_PROCESSADO'
                );

            /*
             * Atualiza o pagamento.
             */
            $pagamento->update([
                'status_id' =>
                    $statusNaoProcessado
                        ->id_trabalho_pagamento_status,

                'data_processamento' =>
                    now(),

                'observacao' =>
                    $dados['observacao']
                    ??
                    'Pagamento não processado pela plataforma.',
            ]);

            /*
             * Recarrega as relações para retornar
             * o status atualizado ao frontend.
             */
            $pagamento->load([
                'status',
                'trabalho',
                'trabalho.contratante',
                'trabalho.contratado',
            ]);

            return response()->json([
                'message' =>
                    'Pagamento recusado e marcado como não processado.',

                'data' => [
                    'pagamento' => $pagamento,
                ],
            ]);
        });
    }

    /**
     * Busca um status do pagamento pelo código.
     */
    private function buscarStatusPagamento(
        string $codigo
    ): TrabalhoPagamentoStatus {
        return TrabalhoPagamentoStatus::where(
            'codigo',
            $codigo
        )
            ->where(
                'ativo',
                true
            )
            ->firstOrFail();
    }
}