<?php

namespace App\Http\Controllers;

use App\Models\Negociacao;
use App\Models\NegociacaoPagamentoStatus;
use App\Models\NegociacaoStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class NegociacaoPagamentoController extends Controller
{
    /**
     * Exibe os dados do pagamento da negociação.
     */
    #[OA\Get(
        path: '/api/negociacoes/{negociacao}/pagamento',
        summary: 'Exibe o pagamento da negociação',
        description: 'Retorna os dados do pagamento vinculado à negociação.',
        tags: ['Pagamentos'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'negociacao',
                description: 'ID da negociação',
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
                description: 'Pagamento encontrado'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa da negociação'
            ),
            new OA\Response(
                response: 404,
                description: 'Pagamento não encontrado'
            )
        ]
    )]
    public function show(
        Request $request,
        Negociacao $negociacao
    ) {
        $usuario = $request->user();

        $this->autorizarParticipacao(
            $usuario,
            $negociacao
        );

        $pagamento = $negociacao
            ->pagamento()
            ->with('status')
            ->first();

        if (!$pagamento) {
            throw ValidationException::withMessages([
                'pagamento' => [
                    'Esta negociação ainda não possui pagamento.',
                ],
            ]);
        }

        return response()->json([
            'data' => $pagamento,
        ]);
    }

    /**
     * Contratante informa que realizou o pagamento.
     */
    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/pagamento/informar',
        summary: 'Informa que o pagamento foi realizado',
        description: 'Permite ao contratante informar que realizou o pagamento. O pagamento passa para AGUARDANDO_PROCESSAMENTO e a negociação para PROCESSANDO_PAGAMENTO.',
        tags: ['Pagamentos'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'negociacao',
                description: 'ID da negociação',
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
                        description: 'Observação opcional sobre o pagamento.',
                        type: 'string',
                        nullable: true,
                        example: 'Pagamento realizado via Pix.'
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Pagamento informado com sucesso'
            ),
            new OA\Response(
                response: 403,
                description: 'Somente o contratante pode informar o pagamento'
            ),
            new OA\Response(
                response: 422,
                description: 'Pagamento não pode ser informado'
            )
        ]
    )]
    public function informar(
        Request $request,
        Negociacao $negociacao
    ) {
        $usuario = $request->user();

        /*
         * Somente o contratante pode informar
         * que realizou o pagamento.
         */
        if ($usuario->id != $negociacao->id_contratante) {
            abort(
                403,
                'Somente o contratante pode informar o pagamento.'
            );
        }

        /*
         * A negociação precisa estar aguardando pagamento.
         */
        if ($negociacao->status->codigo !== 'AGUARDANDO_PAGAMENTO') {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação não está aguardando pagamento.',
                ],
            ]);
        }

        $dados = $request->validate([
            'observacao' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $pagamento = $negociacao
            ->pagamento()
            ->with('status')
            ->first();

        if (!$pagamento) {
            throw ValidationException::withMessages([
                'pagamento' => [
                    'O pagamento desta negociação não foi encontrado.',
                ],
            ]);
        }

        /*
         * O pagamento precisa estar aguardando
         * a informação do contratante.
         */
        if ($pagamento->status->codigo !== 'AGUARDANDO_PAGAMENTO') {
            throw ValidationException::withMessages([
                'pagamento' => [
                    'Este pagamento não está aguardando informação de pagamento.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $dados,
            $negociacao,
            $pagamento
        ) {
            $statusPagamento = $this->buscarStatusPagamento(
                'AGUARDANDO_PROCESSAMENTO'
            );

            $statusNegociacao = $this->buscarStatusNegociacao(
                'PROCESSANDO_PAGAMENTO'
            );

            /*
             * Atualiza pagamento.
             */
            $pagamento->update([
                'status_id' => $statusPagamento->id,
                'data_pagamento_informado' => now(),
                'observacao' => $dados['observacao'] ?? null,
            ]);

            /*
             * Atualiza negociação.
             */
            $negociacao->update([
                'status_id' => $statusNegociacao->id,
            ]);

            return response()->json([
                'message' =>
                    'Pagamento informado. Aguardando processamento da plataforma.',

                'data' =>
                    $pagamento->fresh([
                        'status',
                        'negociacao.status',
                    ]),
            ]);
        });
    }

    /**
     * Busca um status da negociação pelo código.
     */
    private function buscarStatusNegociacao(
        string $codigo
    ): NegociacaoStatus {
        return NegociacaoStatus::where(
            'codigo',
            $codigo
        )
            ->where(
                'ativo',
                true
            )
            ->firstOrFail();
    }

    /**
     * Busca um status do pagamento pelo código.
     */
    private function buscarStatusPagamento(
        string $codigo
    ): NegociacaoPagamentoStatus {
        return NegociacaoPagamentoStatus::where(
            'codigo',
            $codigo
        )
            ->where(
                'ativo',
                true
            )
            ->firstOrFail();
    }

    /**
     * Verifica se o usuário participa da negociação.
     */
    private function autorizarParticipacao(
        $usuario,
        Negociacao $negociacao
    ): void {
        if (
            $negociacao->id_interessado != $usuario->id &&
            $negociacao->id_contratante != $usuario->id
        ) {
            abort(
                403,
                'Você não participa desta negociação.'
            );
        }
    }
}