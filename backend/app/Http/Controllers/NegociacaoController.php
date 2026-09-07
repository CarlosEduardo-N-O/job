<?php

namespace App\Http\Controllers;

use App\Models\Interacao;
use App\Models\Negociacao;
use App\Models\Publicacao;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class NegociacaoController extends Controller
{
    /**
     * Lista as negociações do usuário autenticado.
     */
    #[OA\Get(
        path: '/api/negociacoes',
        summary: 'Lista as negociações do usuário autenticado',
        description: 'Retorna as negociações em que o usuário participa como interessado ou contratante.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de negociações'
            ),
            new OA\Response(
                response: 401,
                description: 'Usuário não autenticado'
            )
        ]
    )]
    public function index(Request $request)
    {
        $usuario = $request->user();

        $negociacoes = Negociacao::with([
            'publicacao.categoria',
            'interessado',
            'contratante',
            'interacoes.interacao.tipo',
            'interacoes.interacao.remetente',
        ])
            ->where(function ($query) use ($usuario) {
                $query
                    ->where('id_interessado', $usuario->id)
                    ->orWhere('id_contratante', $usuario->id);
            })
            ->orderByDesc('id_negociacao')
            ->get();

        return response()->json([
            'data' => $negociacoes,
        ]);
    }


    /**
     * Exibe uma negociação completa.
     */
    #[OA\Get(
        path: '/api/negociacoes/{negociacao}',
        summary: 'Exibe uma negociação',
        description: 'Retorna a negociação e todo o histórico de interações entre os participantes.',
        tags: ['Negociações'],
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
                description: 'Negociação encontrada'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa desta negociação'
            ),
            new OA\Response(
                response: 404,
                description: 'Negociação não encontrada'
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

        $negociacao->load([
            'publicacao.categoria',
            'interessado',
            'contratante',
            'interacoes' => function ($query) {
                $query->orderBy(
                    'id_negociacao_interacao'
                );
            },
            'interacoes.interacao.tipo',
            'interacoes.interacao.remetente',
        ]);

        return response()->json([
            'data' => $negociacao,
        ]);
    }


    /**
     * Cria a primeira interação e a negociação.
     */
    #[OA\Post(
        path: '/api/publicacoes/{publicacao}/interacoes',
        summary: 'Inicia uma negociação com uma publicação',
        description: 'Cria a primeira interação do usuário com uma publicação e cria automaticamente uma negociação.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'publicacao',
                description: 'ID da publicação',
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
                required: ['tipo'],
                properties: [
                    new OA\Property(
                        property: 'tipo',
                        description: 'Tipo da primeira interação',
                        type: 'string',
                        enum: [
                            'INTERESSE',
                            'PROPOSTA',
                            'DUVIDA'
                        ],
                        example: 'PROPOSTA'
                    ),
                    new OA\Property(
                        property: 'mensagem',
                        description: 'Mensagem da interação',
                        type: 'string',
                        nullable: true,
                        example: 'Consigo realizar o serviço por este valor.'
                    ),
                    new OA\Property(
                        property: 'valor_proposto',
                        description: 'Valor da proposta. Obrigatório quando o tipo for PROPOSTA.',
                        type: 'number',
                        format: 'float',
                        nullable: true,
                        example: 320.00
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Negociação criada com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Usuário não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não pode interagir com esta publicação'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos ou negociação já existente'
            )
        ]
    )]
    public function store(
        Request $request,
        Publicacao $publicacao
    ) {
        $usuario = $request->user();

        /*
         * O contratante não pode negociar
         * com a própria publicação.
         */
        if ($publicacao->contratante_id == $usuario->id) {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'O contratante não pode interagir com a própria publicação.',
                ],
            ]);
        }

        /*
         * Somente publicações ativas
         * podem receber novas negociações.
         */
        if ($publicacao->status !== 'ATIVO') {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'Esta publicação não está disponível para negociação.',
                ],
            ]);
        }

        /*
         * O usuário precisa possuir
         * a categoria da publicação.
         */
        $usuario->loadMissing('categorias');

        $possuiCategoria = $usuario->categorias
            ->contains(
                'id',
                $publicacao->categoria_id
            );

        if (!$possuiCategoria) {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'Você não pode interagir com uma publicação desta categoria.',
                ],
            ]);
        }

        $dados = $request->validate([
            'tipo' => [
                'required',
                'string',
                'in:INTERESSE,PROPOSTA,DUVIDA',
            ],
            'mensagem' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'valor_proposto' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        /*
         * PROPOSTA precisa obrigatoriamente
         * possuir um valor.
         */
        if (
            $dados['tipo'] === 'PROPOSTA' &&
            (
                !isset($dados['valor_proposto']) ||
                $dados['valor_proposto'] === ''
            )
        ) {
            throw ValidationException::withMessages([
                'valor_proposto' => [
                    'O valor da proposta é obrigatório.',
                ],
            ]);
        }

        /*
         * Não permite duas negociações
         * do mesmo interessado para a mesma publicação.
         */
        $negociacaoExistente = Negociacao::where(
            'id_interessado',
            $usuario->id
        )
            ->where(
                'id_publicacao',
                $publicacao->id
            )
            ->first();

        if ($negociacaoExistente) {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'Você já possui uma negociação para esta publicação.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $dados,
            $usuario,
            $publicacao
        ) {

            $tipo = DB::table('interacao_tipos')
                ->where(
                    'tipo',
                    $dados['tipo']
                )
                ->first();

            if (!$tipo) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Tipo de interação não encontrado.',
                    ],
                ]);
            }

            /*
             * Cria a primeira interação.
             */
            $interacao = Interacao::create([
                'id_interacao_tipo' =>
                    $tipo->id_interacao_tipo,

                'remetente_id' =>
                    $usuario->id,

                'mensagem' =>
                    $dados['mensagem'] ?? null,

                'valor_proposto' =>
                    $dados['valor_proposto'] ?? null,
            ]);

            /*
             * A primeira interação é enviada
             * pelo interessado.
             *
             * Portanto, agora aguardamos
             * a resposta do contratante.
             */
            $status = 'AGUARDANDO_CONTRATANTE';

            $valorTrabalho =
                $dados['tipo'] === 'PROPOSTA'
                    ? $dados['valor_proposto']
                    : null;

            /*
             * Cria a negociação.
             */
            $negociacao = Negociacao::create([
                'id_interessado' =>
                    $usuario->id,

                'id_contratante' =>
                    $publicacao->contratante_id,

                'id_publicacao' =>
                    $publicacao->id,

                'status' =>
                    $status,

                'valor_trabalho' =>
                    $valorTrabalho,
            ]);

            /*
             * Relaciona a primeira interação
             * com a negociação.
             */
            $negociacao->interacoes()->create([
                'id_interacao' =>
                    $interacao->id_interacao,

                'id_interessado' =>
                    $usuario->id,

                'id_contratante' =>
                    $publicacao->contratante_id,

                'id_publicacao' =>
                    $publicacao->id,
            ]);

            $negociacao->load([
                'publicacao.categoria',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]);

            return response()->json([
                'message' =>
                    'Interação enviada e negociação criada com sucesso.',

                'data' =>
                    $negociacao,
            ], 201);
        });
    }


    /**
     * Adiciona uma nova interação a uma negociação existente.
     */
    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/interacoes',
        summary: 'Envia uma nova interação na negociação',
        description: 'Permite que o participante que ainda não respondeu envie INTERESSE, PROPOSTA ou DUVIDA.',
        tags: ['Negociações'],
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
            required: true,
            content: new OA\JsonContent(
                required: ['tipo'],
                properties: [
                    new OA\Property(
                        property: 'tipo',
                        description: 'Tipo da nova interação',
                        type: 'string',
                        enum: [
                            'INTERESSE',
                            'PROPOSTA',
                            'DUVIDA'
                        ],
                        example: 'PROPOSTA'
                    ),
                    new OA\Property(
                        property: 'mensagem',
                        description: 'Mensagem da interação',
                        type: 'string',
                        nullable: true,
                        example: 'Consigo fazer por R$ 340.'
                    ),
                    new OA\Property(
                        property: 'valor_proposto',
                        description: 'Valor da nova proposta',
                        type: 'number',
                        format: 'float',
                        nullable: true,
                        example: 340.00
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Interação enviada com sucesso'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa da negociação'
            ),
            new OA\Response(
                response: 422,
                description: 'Não é a vez do usuário ou dados inválidos'
            )
        ]
    )]
    public function interagir(
        Request $request,
        Negociacao $negociacao
    ) {
        $usuario = $request->user();

        $this->autorizarParticipacao(
            $usuario,
            $negociacao
        );

        /*
         * Somente negociações abertas
         * podem receber novas interações.
         */
        if (
            !in_array(
                $negociacao->status,
                [
                    'AGUARDANDO_INTERESSADO',
                    'AGUARDANDO_CONTRATANTE',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação não está disponível para novas interações.',
                ],
            ]);
        }

        /*
         * Busca a última interação.
         */
        $ultimaInteracao =
            $negociacao
                ->interacoes()
                ->with('interacao')
                ->latest('id_negociacao_interacao')
                ->first();

        if (!$ultimaInteracao) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'A negociação não possui interações.',
                ],
            ]);
        }

        $ultimoRemetente =
            $ultimaInteracao
                ->interacao
                ->remetente_id;

        /*
         * Impede o mesmo usuário de responder
         * duas vezes seguidas.
         */
        if ($ultimoRemetente == $usuario->id) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Aguarde o outro participante responder antes de enviar uma nova interação.',
                ],
            ]);
        }

        $dados = $request->validate([
            'tipo' => [
                'required',
                'string',
                'in:INTERESSE,PROPOSTA,DUVIDA',
            ],
            'mensagem' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'valor_proposto' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        /*
         * PROPOSTA precisa possuir valor.
         */
        if (
            $dados['tipo'] === 'PROPOSTA' &&
            (
                !isset($dados['valor_proposto']) ||
                $dados['valor_proposto'] === ''
            )
        ) {
            throw ValidationException::withMessages([
                'valor_proposto' => [
                    'O valor da proposta é obrigatório.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $dados,
            $usuario,
            $negociacao
        ) {

            $tipo = DB::table('interacao_tipos')
                ->where(
                    'tipo',
                    $dados['tipo']
                )
                ->first();

            if (!$tipo) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Tipo de interação não encontrado.',
                    ],
                ]);
            }

            $interacao = Interacao::create([
                'id_interacao_tipo' =>
                    $tipo->id_interacao_tipo,

                'remetente_id' =>
                    $usuario->id,

                'mensagem' =>
                    $dados['mensagem'] ?? null,

                'valor_proposto' =>
                    $dados['valor_proposto'] ?? null,
            ]);

            /*
             * Atualiza o valor da negociação
             * caso seja uma nova proposta.
             */
            $valorTrabalho =
                $dados['tipo'] === 'PROPOSTA'
                    ? $dados['valor_proposto']
                    : $negociacao->valor_trabalho;

            /*
             * Descobre quem deve responder agora.
             *
             * Se o interessado acabou de responder,
             * aguardamos o contratante.
             *
             * Se o contratante acabou de responder,
             * aguardamos o interessado.
             */
            if ($usuario->id == $negociacao->id_interessado) {
                $novoStatus = 'AGUARDANDO_CONTRATANTE';
            } else {
                $novoStatus = 'AGUARDANDO_INTERESSADO';
            }

            $negociacao->update([
                'status' =>
                    $novoStatus,

                'valor_trabalho' =>
                    $valorTrabalho,
            ]);

            /*
             * Relaciona a interação.
             */
            $negociacao->interacoes()->create([
                'id_interacao' =>
                    $interacao->id_interacao,

                'id_interessado' =>
                    $negociacao->id_interessado,

                'id_contratante' =>
                    $negociacao->id_contratante,

                'id_publicacao' =>
                    $negociacao->id_publicacao,
            ]);

            $negociacao->load([
                'publicacao.categoria',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]);

            return response()->json([
                'message' =>
                    'Interação enviada com sucesso.',

                'data' =>
                    $negociacao,
            ]);
        });
    }


    /**
     * Aceita a última interação.
     */
    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/aceitar',
        summary: 'Aceita a última interação',
        description: 'O contratante aceita a negociação e ela passa para FECHADA. As demais negociações da mesma publicação serão encerradas.',
        tags: ['Negociações'],
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
                description: 'Negociação fechada com sucesso'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa da negociação'
            ),
            new OA\Response(
                response: 422,
                description: 'Negociação não pode ser aceita'
            )
        ]
    )]
    public function aceitar(
        Request $request,
        Negociacao $negociacao
    ) {
        $usuario = $request->user();

        $this->autorizarParticipacao(
            $usuario,
            $negociacao
        );

        /*
         * Somente o CONTRATANTE pode aceitar.
         */
        if ($negociacao->id_contratante != $usuario->id) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Somente o contratante pode aceitar uma negociação.',
                ],
            ]);
        }

        /*
         * Somente negociações abertas
         * podem ser fechadas.
         */
        if (
            !in_array(
                $negociacao->status,
                [
                    'AGUARDANDO_CONTRATANTE',
                    'AGUARDANDO_INTERESSADO',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação não pode mais ser fechada.',
                ],
            ]);
        }

        /*
         * Busca a última interação.
         */
        $ultimaInteracao =
            $negociacao
                ->interacoes()
                ->with('interacao.tipo')
                ->latest('id_negociacao_interacao')
                ->first();

        if (!$ultimaInteracao) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Não existe interação para aceitar.',
                ],
            ]);
        }

        $interacao =
            $ultimaInteracao->interacao;

        /*
         * O contratante só pode aceitar
         * uma interação enviada pelo interessado.
         */
        if (
            $interacao->remetente_id ==
            $usuario->id
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Você não pode aceitar a própria interação.',
                ],
            ]);
        }

        /*
         * Dúvida não pode ser aceita diretamente.
         */
        if (
            $interacao->tipo->tipo ===
            'DUVIDA'
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Uma dúvida deve ser respondida com uma nova interação.',
                ],
            ]);
        }

        /*
         * Determina o valor final.
         */
        $valorTrabalho =
            $interacao->valor_proposto
            ?? $negociacao->valor_trabalho
            ?? $negociacao->publicacao->valor_estimado;

        return DB::transaction(function () use (
            $negociacao,
            $valorTrabalho
        ) {

            /*
             * Fecha a negociação escolhida.
             */
            $negociacao->update([
                'status' =>
                    'FECHADA',

                'valor_trabalho' =>
                    $valorTrabalho,
            ]);

            /*
             * Todas as outras negociações
             * da mesma publicação são encerradas.
             *
             * Não altera a negociação que acabou
             * de ser fechada.
             */
            Negociacao::where(
                'id_publicacao',
                $negociacao->id_publicacao
            )
                ->where(
                    'id_negociacao',
                    '!=',
                    $negociacao->id_negociacao
                )
                ->whereIn(
                    'status',
                    [
                        'AGUARDANDO_INTERESSADO',
                        'AGUARDANDO_CONTRATANTE',
                    ]
                )
                ->update([
                    'status' =>
                        'ENCERRADA',
                ]);

            return response()->json([
                'message' =>
                    'Negociação fechada com sucesso. As demais negociações desta publicação foram encerradas.',

                'data' =>
                    $negociacao->fresh([
                        'publicacao',
                        'interessado',
                        'contratante',
                        'interacoes.interacao.tipo',
                        'interacoes.interacao.remetente',
                    ]),
            ]);
        });
    }


    /**
     * Recusa a última interação.
     */
    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/recusar',
        summary: 'Recusa a última interação',
        description: 'Recusa uma interação e encerra definitivamente a negociação.',
        tags: ['Negociações'],
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
                description: 'Negociação encerrada com sucesso'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa da negociação'
            ),
            new OA\Response(
                response: 422,
                description: 'Interação não pode ser recusada'
            )
        ]
    )]
    public function recusar(
        Request $request,
        Negociacao $negociacao
    ) {
        $usuario = $request->user();

        $this->autorizarParticipacao(
            $usuario,
            $negociacao
        );

        /*
         * Somente negociações abertas
         * podem ser encerradas por recusa.
         */
        if (
            !in_array(
                $negociacao->status,
                [
                    'AGUARDANDO_INTERESSADO',
                    'AGUARDANDO_CONTRATANTE',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação já foi encerrada.',
                ],
            ]);
        }

        /*
         * Busca a última interação.
         */
        $ultimaInteracao =
            $negociacao
                ->interacoes()
                ->with('interacao.tipo')
                ->latest('id_negociacao_interacao')
                ->first();

        if (!$ultimaInteracao) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Não existe interação para recusar.',
                ],
            ]);
        }

        $interacao =
            $ultimaInteracao->interacao;

        /*
         * Não pode recusar a própria interação.
         */
        if (
            $interacao->remetente_id ==
            $usuario->id
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Você não pode recusar a própria interação.',
                ],
            ]);
        }

        /*
         * Dúvida não pode ser recusada.
         * Deve ser respondida.
         */
        if (
            $interacao->tipo->tipo ===
            'DUVIDA'
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Uma dúvida deve ser respondida com uma nova interação.',
                ],
            ]);
        }

        /*
         * Qualquer recusa encerra a negociação.
         */
        $negociacao->update([
            'status' =>
                'ENCERRADA',
        ]);

        return response()->json([
            'message' =>
                'Negociação encerrada.',

            'data' =>
                $negociacao->fresh([
                    'publicacao',
                    'interessado',
                    'contratante',
                    'interacoes.interacao.tipo',
                    'interacoes.interacao.remetente',
                ]),
        ]);
    }


    /**
     * Verifica se o usuário participa da negociação.
     */
    private function autorizarParticipacao(
        User $usuario,
        Negociacao $negociacao
    ): void {
        if (
            $negociacao->id_interessado !=
                $usuario->id
            &&
            $negociacao->id_contratante !=
                $usuario->id
        ) {
            abort(
                403,
                'Você não participa desta negociação.'
            );
        }
    }
}