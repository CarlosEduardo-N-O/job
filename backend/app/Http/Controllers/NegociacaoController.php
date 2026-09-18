<?php

namespace App\Http\Controllers;

use App\Models\Interacao;
use App\Models\Negociacao;
use App\Models\NegociacaoPagamento;
use App\Models\NegociacaoPagamentoStatus;
use App\Models\NegociacaoStatus;
use App\Models\Publicacao;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class NegociacaoController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LISTAGEM
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/negociacoes',
        summary: 'Lista as negociações do usuário autenticado',
        description: 'Retorna as negociações em que o usuário participa como interessado ou contratante, incluindo as ações disponíveis para o usuário.',
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
            'status',
            'pagamento.status',
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

        /*
         * Adiciona ao retorno as informações que o frontend precisa
         * para montar a tela.
         */
        $negociacoes->each(function ($negociacao) use ($usuario) {
            $this->adicionarContextoFrontend(
                $negociacao,
                $usuario
            );
        });

        return response()->json([
            'data' => $negociacoes,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | MINHAS NEGOCIAÇÕES
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/negociacoes/meus',
        summary: 'Lista minhas negociações',
        description: 'Retorna somente as negociações em que o usuário autenticado é interessado.',
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
    public function minhas(Request $request)
    {
        $usuario = $request->user();

        $negociacoes = Negociacao::with([
            'status',
            'pagamento.status',
            'publicacao.categoria',
            'interessado',
            'contratante',
            'interacoes.interacao.tipo',
            'interacoes.interacao.remetente',
        ])
            ->where('id_interessado', $usuario->id)
            ->orderByDesc('id_negociacao')
            ->get();

        $negociacoes->each(function ($negociacao) use ($usuario) {
            $this->adicionarContextoFrontend(
                $negociacao,
                $usuario
            );
        });

        return response()->json([
            'data' => $negociacoes,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/negociacoes/{negociacao}',
        summary: 'Exibe uma negociação',
        description: 'Retorna a negociação completa, histórico e ações disponíveis para o usuário autenticado.',
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
            'status',
            'pagamento.status',
            'publicacao.categoria',
            'interessado',
            'contratante',
            'interacoes' => function ($query) {
                $query->orderBy('id_negociacao_interacao');
            },
            'interacoes.interacao.tipo',
            'interacoes.interacao.remetente',
        ]);

        $this->adicionarContextoFrontend(
            $negociacao,
            $usuario
        );

        return response()->json([
            'data' => $negociacao,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CRIAR NEGOCIAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/publicacoes/{publicacao}/interacoes',
        summary: 'Inicia uma negociação com uma publicação',
        description: 'Cria a primeira interação e cria automaticamente a negociação.',
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
                        type: 'string',
                        nullable: true
                    ),
                    new OA\Property(
                        property: 'valor_proposto',
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
                description: 'Negociação criada'
            ),
            new OA\Response(
                response: 401,
                description: 'Usuário não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não pode interagir'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            )
        ]
    )]
    public function store(
        Request $request,
        Publicacao $publicacao
    ) {
        $usuario = $request->user();

        if ($publicacao->contratante_id == $usuario->id) {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'O contratante não pode interagir com a própria publicação.',
                ],
            ]);
        }

        $publicacao->loadMissing('status');

        if ($publicacao->status?->codigo !== 'ATIVO') {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'Esta publicação não está disponível para negociação.',
                ],
            ]);
        }

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

        $negociacaoFechada = Negociacao::where(
            'id_publicacao',
            $publicacao->id
        )
            ->whereHas('status', function ($query) {
                $query->where(
                    'codigo',
                    'FECHADA'
                );
            })
            ->exists();

        if ($negociacaoFechada) {
            throw ValidationException::withMessages([
                'publicacao' => [
                    'Esta publicação já possui uma negociação fechada.',
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

        if (
            $dados['tipo'] === 'PROPOSTA' &&
            (
                !isset($dados['valor_proposto']) ||
                $dados['valor_proposto'] === '' ||
                $dados['valor_proposto'] <= 0
            )
        ) {
            throw ValidationException::withMessages([
                'valor_proposto' => [
                    'O valor da proposta é obrigatório e deve ser maior que zero.',
                ],
            ]);
        }

        if (
            $dados['tipo'] === 'DUVIDA' &&
            (
                !isset($dados['mensagem']) ||
                trim($dados['mensagem']) === ''
            )
        ) {
            throw ValidationException::withMessages([
                'mensagem' => [
                    'A dúvida deve possuir uma mensagem.',
                ],
            ]);
        }

        if ($dados['tipo'] !== 'PROPOSTA') {
            $dados['valor_proposto'] = null;
        }

        $negociacaoExistente = Negociacao::where(
            'id_interessado',
            $usuario->id
        )
            ->where(
                'id_publicacao',
                $publicacao->id
            )
            ->exists();

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
                ->where('contexto', 'NEGOCIACAO')
                ->where('tipo', $dados['tipo'])
                ->first();

            if (!$tipo) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Tipo de interação não encontrado no contexto de negociação.',
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

            $status = $this->buscarStatusNegociacao(
                'AGUARDANDO_CONTRATANTE'
            );

            $valorTrabalho =
                $dados['tipo'] === 'PROPOSTA'
                ? $dados['valor_proposto']
                : null;

            $negociacao = Negociacao::create([
                'id_interessado' =>
                $usuario->id,

                'id_contratante' =>
                $publicacao->contratante_id,

                'id_publicacao' =>
                $publicacao->id,

                'status_id' =>
                $status->id,

                'valor_trabalho' =>
                $valorTrabalho,
            ]);

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
                'status',
                'pagamento.status',
                'publicacao.categoria',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]);

            $this->adicionarContextoFrontend(
                $negociacao,
                $usuario
            );

            return response()->json([
                'message' =>
                'Interação enviada e negociação criada com sucesso.',

                'data' =>
                $negociacao,
            ], 201);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | INTERAGIR
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/interacoes',
        summary: 'Adiciona uma nova interação',
        description: 'Adiciona uma interação respeitando as regras da negociação.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'negociacao',
                description: 'ID da negociação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
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
                        type: 'string',
                        enum: [
                            'INTERESSE',
                            'PROPOSTA',
                            'DUVIDA',
                            'RESPOSTA'
                        ]
                    ),
                    new OA\Property(
                        property: 'mensagem',
                        type: 'string',
                        nullable: true
                    ),
                    new OA\Property(
                        property: 'valor_proposto',
                        type: 'number',
                        format: 'float',
                        nullable: true
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Interação enviada'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não participa'
            ),
            new OA\Response(
                response: 422,
                description: 'Interação não permitida'
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

        $negociacao->loadMissing('status');

        /*
         * O backend verifica de quem é a vez.
         * O frontend não precisa implementar essa regra.
         */
        $this->autorizarVez(
            $usuario,
            $negociacao
        );

        if (
            !in_array(
                $negociacao->status->codigo,
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

        $ultimaInteracao =
            $negociacao
            ->interacoes()
            ->with('interacao.tipo')
            ->latest('id_negociacao_interacao')
            ->first();

        if (!$ultimaInteracao) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'A negociação não possui interações.',
                ],
            ]);
        }

        $interacaoAnterior =
            $ultimaInteracao->interacao;

        $tipoAnterior =
            $interacaoAnterior->tipo->tipo;

        $dados = $request->validate([
            'tipo' => [
                'required',
                'string',
                'in:INTERESSE,PROPOSTA,DUVIDA,RESPOSTA',
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

        $novoTipo = $dados['tipo'];

        /*
         * ---------------------------------------------------------
         * REGRAS DE TRANSIÇÃO
         * ---------------------------------------------------------
         */

        if ($tipoAnterior === 'INTERESSE') {
            throw ValidationException::withMessages([
                'tipo' => [
                    'Uma manifestação de interesse deve ser aceita ou recusada pelo contratante.',
                ],
            ]);
        }

        if ($tipoAnterior === 'PROPOSTA') {
            if (
                !in_array(
                    $novoTipo,
                    [
                        'PROPOSTA',
                        'DUVIDA',
                    ]
                )
            ) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Uma proposta pode receber uma nova proposta ou uma dúvida.',
                    ],
                ]);
            }
        }

        if ($tipoAnterior === 'DUVIDA') {
            if ($novoTipo !== 'RESPOSTA') {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Uma dúvida deve ser respondida com RESPOSTA.',
                    ],
                ]);
            }
        }

        if ($tipoAnterior === 'RESPOSTA') {
            if (
                !in_array(
                    $novoTipo,
                    [
                        'INTERESSE',
                        'PROPOSTA',
                        'DUVIDA',
                    ]
                )
            ) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Após uma resposta, é possível demonstrar interesse, enviar uma proposta ou fazer uma nova dúvida.',
                    ],
                ]);
            }
        }

        /*
         * ---------------------------------------------------------
         * VALIDAÇÕES ESPECÍFICAS
         * ---------------------------------------------------------
         */

        if (
            $novoTipo === 'PROPOSTA' &&
            (
                !isset($dados['valor_proposto']) ||
                $dados['valor_proposto'] === '' ||
                $dados['valor_proposto'] <= 0
            )
        ) {
            throw ValidationException::withMessages([
                'valor_proposto' => [
                    'O valor da proposta é obrigatório e deve ser maior que zero.',
                ],
            ]);
        }

        if (
            in_array(
                $novoTipo,
                [
                    'DUVIDA',
                    'RESPOSTA',
                ]
            ) &&
            (
                !isset($dados['mensagem']) ||
                trim($dados['mensagem']) === ''
            )
        ) {
            throw ValidationException::withMessages([
                'mensagem' => [
                    'Esta interação precisa possuir uma mensagem.',
                ],
            ]);
        }

        if ($novoTipo !== 'PROPOSTA') {
            $dados['valor_proposto'] = null;
        }

        return DB::transaction(function () use (
            $dados,
            $usuario,
            $negociacao
        ) {
            $tipo = DB::table('interacao_tipos')
                ->where('contexto', 'NEGOCIACAO')
                ->where('tipo', $dados['tipo'])
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

            $valorTrabalho =
                $dados['tipo'] === 'PROPOSTA'
                ? $dados['valor_proposto']
                : $negociacao->valor_trabalho;

            /*
             * Define automaticamente quem deverá agir depois.
             */
            $novoStatus =
                $usuario->id == $negociacao->id_interessado
                ? 'AGUARDANDO_CONTRATANTE'
                : 'AGUARDANDO_INTERESSADO';

            $status = $this->buscarStatusNegociacao(
                $novoStatus
            );

            $negociacao->update([
                'status_id' =>
                $status->id,

                'valor_trabalho' =>
                $valorTrabalho,
            ]);

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
                'status',
                'pagamento.status',
                'publicacao.categoria',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]);

            $this->adicionarContextoFrontend(
                $negociacao,
                $usuario
            );

            return response()->json([
                'message' =>
                'Interação enviada com sucesso.',

                'data' =>
                $negociacao,
            ]);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | ACEITAR
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/aceitar',
        summary: 'Aceita a última interação',
        description: 'Aceita uma manifestação de interesse ou proposta recebida.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'negociacao',
                description: 'ID da negociação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Interação aceita'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não pode aceitar'
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

        $negociacao->loadMissing([
            'status',
            'publicacao',
        ]);

        /*
         * Somente quem recebeu a interação pode aceitá-la.
         */
        $this->autorizarVez(
            $usuario,
            $negociacao
        );

        if (
            !in_array(
                $negociacao->status->codigo,
                [
                    'AGUARDANDO_INTERESSADO',
                    'AGUARDANDO_CONTRATANTE',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação não pode mais ser aceita.',
                ],
            ]);
        }

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

        if (
            $interacao->remetente_id ==
            $usuario->id
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Você não pode aceitar sua própria interação.',
                ],
            ]);
        }

        $tipoInteracao =
            $interacao->tipo->tipo;

        if (
            !in_array(
                $tipoInteracao,
                [
                    'INTERESSE',
                    'PROPOSTA',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Somente INTERESSE ou PROPOSTA podem ser aceitos.',
                ],
            ]);
        }

        $valorTrabalho =
            $interacao->valor_proposto
            ?? $negociacao->valor_trabalho
            ?? $negociacao->publicacao->valor_estimado;

        if (!$valorTrabalho || $valorTrabalho <= 0) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Não foi possível determinar o valor da contratação.',
                ],
            ]);
        }

        return $this->fecharNegociacaoParaPagamento(
            $negociacao,
            $valorTrabalho,
            $usuario
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PAGAMENTO
    |--------------------------------------------------------------------------
    */

    private function fecharNegociacaoParaPagamento(
        Negociacao $negociacao,
        $valorTrabalho,
        User $usuario
    ) {
        return DB::transaction(function () use (
            $negociacao,
            $valorTrabalho,
            $usuario
        ) {
            $statusNegociacao =
                $this->buscarStatusNegociacao(
                    'AGUARDANDO_PAGAMENTO'
                );

            $statusPagamento =
                $this->buscarStatusPagamento(
                    'AGUARDANDO_PAGAMENTO'
                );

            $negociacao->update([
                'status_id' =>
                $statusNegociacao->id,

                'valor_trabalho' =>
                $valorTrabalho,
            ]);

            NegociacaoPagamento::create([
                'id_negociacao' =>
                $negociacao->id_negociacao,

                'status_id' =>
                $statusPagamento->id,

                'valor' =>
                $valorTrabalho,
            ]);

            /*
             * Encerra outras negociações abertas
             * da mesma publicação.
             */
            $statusEncerrada =
                $this->buscarStatusNegociacao(
                    'ENCERRADA'
                );

            Negociacao::where(
                'id_publicacao',
                $negociacao->id_publicacao
            )
                ->where(
                    'id_negociacao',
                    '!=',
                    $negociacao->id_negociacao
                )
                ->whereHas('status', function ($query) {
                    $query->whereIn(
                        'codigo',
                        [
                            'AGUARDANDO_INTERESSADO',
                            'AGUARDANDO_CONTRATANTE',
                        ]
                    );
                })
                ->update([
                    'status_id' =>
                    $statusEncerrada->id,
                ]);

            $negociacao->load([
                'status',
                'pagamento.status',
                'publicacao.categoria',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]);

            $this->adicionarContextoFrontend(
                $negociacao,
                $usuario
            );

            return response()->json([
                'message' =>
                'Negociação aceita. Aguardando pagamento do contratante.',

                'data' =>
                $negociacao,
            ]);
        });
    }


    /*
    |--------------------------------------------------------------------------
    | RECUSAR
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/recusar',
        summary: 'Recusa a última interação',
        description: 'Recusa uma manifestação de interesse ou proposta recebida.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'negociacao',
                description: 'ID da negociação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Negociação encerrada'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não pode recusar'
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

        $negociacao->loadMissing('status');

        /*
         * Somente quem recebeu a interação pode recusá-la.
         */
        $this->autorizarVez(
            $usuario,
            $negociacao
        );

        if (
            !in_array(
                $negociacao->status->codigo,
                [
                    'AGUARDANDO_INTERESSADO',
                    'AGUARDANDO_CONTRATANTE',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Esta negociação já foi encerrada ou está em processo de pagamento.',
                ],
            ]);
        }

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

        if (
            $interacao->remetente_id ==
            $usuario->id
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Você não pode recusar sua própria interação.',
                ],
            ]);
        }

        if (
            !in_array(
                $interacao->tipo->tipo,
                [
                    'INTERESSE',
                    'PROPOSTA',
                ]
            )
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Somente INTERESSE ou PROPOSTA podem ser recusados.',
                ],
            ]);
        }

        $status =
            $this->buscarStatusNegociacao(
                'ENCERRADA'
            );

        $negociacao->update([
            'status_id' =>
            $status->id,
        ]);

        $negociacao->load([
            'status',
            'pagamento.status',
            'publicacao.categoria',
            'interessado',
            'contratante',
            'interacoes.interacao.tipo',
            'interacoes.interacao.remetente',
        ]);

        $this->adicionarContextoFrontend(
            $negociacao,
            $usuario
        );

        return response()->json([
            'message' =>
            'Negociação encerrada.',

            'data' =>
            $negociacao,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CONTEXTO PARA O FRONTEND
    |--------------------------------------------------------------------------
    |
    | Esta é a principal mudança.
    |
    | O backend determina:
    | - quem é o usuário
    | - qual o papel dele
    | - de quem é a vez
    | - quais ações estão disponíveis
    | - quais tipos de interação podem ser enviados
    |
    */

    private function adicionarContextoFrontend(
        Negociacao $negociacao,
        User $usuario
    ): void {
        /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

        $status = $negociacao->status?->codigo;

        /*
    |--------------------------------------------------------------------------
    | PAPEL DO USUÁRIO
    |--------------------------------------------------------------------------
    */

        if ($usuario->id == $negociacao->id_interessado) {
            $papelUsuario = 'INTERESSADO';
        } elseif ($usuario->id == $negociacao->id_contratante) {
            $papelUsuario = 'CONTRATANTE';
        } else {
            $papelUsuario = null;
        }

        /*
    |--------------------------------------------------------------------------
    | DE QUEM É A VEZ
    |--------------------------------------------------------------------------
    */

        $vez = match ($status) {
            'AGUARDANDO_INTERESSADO' => 'INTERESSADO',
            'AGUARDANDO_CONTRATANTE' => 'CONTRATANTE',
            default => null,
        };

        /*
    |--------------------------------------------------------------------------
    | ÚLTIMA INTERAÇÃO
    |--------------------------------------------------------------------------
    |
    | Não dependemos mais da coleção carregada pelo Eloquent.
    | Buscamos diretamente a última interação da negociação.
    |
    */

        $ultimaInteracao = $negociacao
            ->interacoes()
            ->with('interacao.tipo')
            ->orderByDesc('id_negociacao_interacao')
            ->first();

        $tipoUltimaInteracao = null;

        if (
            $ultimaInteracao &&
            $ultimaInteracao->interacao &&
            $ultimaInteracao->interacao->tipo
        ) {
            $tipoUltimaInteracao = strtoupper(
                trim($ultimaInteracao->interacao->tipo->tipo)
            );
        }

        /*
    |--------------------------------------------------------------------------
    | USUÁRIO PODE AGIR?
    |--------------------------------------------------------------------------
    */

        $podeAgir = (
            $vez !== null &&
            $vez === $papelUsuario
        );

        /*
    |--------------------------------------------------------------------------
    | AÇÕES
    |--------------------------------------------------------------------------
    */

        $acoes = [
            'interagir' => false,
            'aceitar' => false,
            'recusar' => false,
            'pagamento' => false,
        ];

        /*
    |--------------------------------------------------------------------------
    | OPÇÕES DE INTERAÇÃO
    |--------------------------------------------------------------------------
    */

        $opcoesInteracao = [];

        /*
    |--------------------------------------------------------------------------
    | NEGOCIAÇÃO EM ANDAMENTO
    |--------------------------------------------------------------------------
    */

        if ($podeAgir) {

            /*
        |--------------------------------------------------------------------------
        | INTERESSE
        |--------------------------------------------------------------------------
        |
        | O interessado enviou interesse.
        | O contratante pode aceitar ou recusar.
        |
        */

            if ($tipoUltimaInteracao === 'INTERESSE') {

                $acoes['aceitar'] = true;
                $acoes['recusar'] = true;
            }

            /*
        |--------------------------------------------------------------------------
        | PROPOSTA
        |--------------------------------------------------------------------------
        |
        | Quem recebeu a proposta pode:
        |
        | - aceitar
        | - recusar
        | - enviar nova proposta
        | - fazer dúvida
        |
        */ elseif ($tipoUltimaInteracao === 'PROPOSTA') {

                $acoes['aceitar'] = true;
                $acoes['recusar'] = true;
                $acoes['interagir'] = true;

                $opcoesInteracao = [
                    $this->opcaoInteracao(
                        'PROPOSTA',
                        false,
                        true
                    ),

                    $this->opcaoInteracao(
                        'DUVIDA',
                        true,
                        false
                    ),
                ];
            }

            /*
        |--------------------------------------------------------------------------
        | DÚVIDA
        |--------------------------------------------------------------------------
        |
        | A dúvida obrigatoriamente deve ser respondida.
        |
        */ elseif ($tipoUltimaInteracao === 'DUVIDA') {

                $acoes['interagir'] = true;

                $opcoesInteracao = [
                    $this->opcaoInteracao(
                        'RESPOSTA',
                        true,
                        false
                    ),
                ];
            }

            /*
        |--------------------------------------------------------------------------
        | RESPOSTA
        |--------------------------------------------------------------------------
        |
        | IMPORTANTE:
        |
        | Se o CONTRATANTE respondeu uma dúvida,
        | o status passa para AGUARDANDO_INTERESSADO.
        |
        | Portanto, quando o INTERESSADO consultar a negociação:
        |
        | $podeAgir = true
        |
        | e estas opções devem aparecer:
        |
        | INTERESSE
        | PROPOSTA
        | DUVIDA
        |
        */ elseif ($tipoUltimaInteracao === 'RESPOSTA') {

                $acoes['interagir'] = true;

                $opcoesInteracao = [
                    $this->opcaoInteracao(
                        'INTERESSE',
                        false,
                        false
                    ),

                    $this->opcaoInteracao(
                        'PROPOSTA',
                        false,
                        true
                    ),

                    $this->opcaoInteracao(
                        'DUVIDA',
                        true,
                        false
                    ),
                ];
            }
        }

        /*
    |--------------------------------------------------------------------------
    | PAGAMENTO
    |--------------------------------------------------------------------------
    |
    | Somente o CONTRATANTE deve pagar.
    |
    */

        if (
            $status === 'AGUARDANDO_PAGAMENTO' &&
            $papelUsuario === 'CONTRATANTE'
        ) {
            $acoes['pagamento'] = true;
        }

        /*
    |--------------------------------------------------------------------------
    | CONTEXTO
    |--------------------------------------------------------------------------
    */

        $negociacao->setAttribute(
            'contexto',
            [
                'papel_usuario' => $papelUsuario,
                'vez' => $vez,
                'pode_agir' => $podeAgir,
                'ultima_interacao' => $tipoUltimaInteracao,
            ]
        );

        /*
    |--------------------------------------------------------------------------
    | AÇÕES
    |--------------------------------------------------------------------------
    */

        $negociacao->setAttribute(
            'acoes',
            $acoes
        );

        /*
    |--------------------------------------------------------------------------
    | OPÇÕES
    |--------------------------------------------------------------------------
    */

        $negociacao->setAttribute(
            'opcoes_interacao',
            $opcoesInteracao
        );
    }


    /*
    |--------------------------------------------------------------------------
    | OPÇÃO DE INTERAÇÃO
    |--------------------------------------------------------------------------
    */

    private function opcaoInteracao(
        string $tipo,
        bool $mensagemObrigatoria,
        bool $valorObrigatorio
    ): array {
        return [
            'tipo' =>
            $tipo,

            'mensagem_obrigatoria' =>
            $mensagemObrigatoria,

            'valor_obrigatorio' =>
            $valorObrigatorio,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | AUTORIZAÇÃO DA VEZ
    |--------------------------------------------------------------------------
    |
    | Essa regra sai completamente do frontend.
    |
    */

    private function autorizarVez(
        User $usuario,
        Negociacao $negociacao
    ): void {
        $status =
            $negociacao->status?->codigo;

        if (
            $status === 'AGUARDANDO_INTERESSADO' &&
            $negociacao->id_interessado != $usuario->id
        ) {
            abort(
                403,
                'Aguarde a ação do interessado.'
            );
        }

        if (
            $status === 'AGUARDANDO_CONTRATANTE' &&
            $negociacao->id_contratante != $usuario->id
        ) {
            abort(
                403,
                'Aguarde a ação do contratante.'
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
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


    /*
    |--------------------------------------------------------------------------
    | PARTICIPAÇÃO
    |--------------------------------------------------------------------------
    */

    private function autorizarParticipacao(
        User $usuario,
        Negociacao $negociacao
    ): void {
        if (
            $negociacao->id_interessado != $usuario->id
            &&
            $negociacao->id_contratante != $usuario->id
        ) {
            abort(
                403,
                'Você não participa desta negociação.'
            );
        }
    }
}
