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
                    ->where(
                        'id_interessado',
                        $usuario->id
                    )
                    ->orWhere(
                        'id_contratante',
                        $usuario->id
                    );
            })
            ->orderByDesc('id_negociacao')
            ->get();

        return response()->json([
            'data' => $negociacoes,
        ]);
    }

    /**
     * Lista as negociações em que o usuário
     * participa como interessado.
     */
    #[OA\Get(
        path: '/api/negociacoes/meus',
        summary: 'Lista minhas negociações',
        description: 'Retorna somente as negociações criadas pelo usuário autenticado em publicações de outros usuários.',
        tags: ['Negociações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de negociações do interessado'
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
            ->where(
                'id_interessado',
                $usuario->id
            )
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
        description: 'Retorna a negociação, seu status, pagamento e histórico de interações.',
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

        /*
         * Não permite novas negociações quando
         * já existe uma negociação fechada.
         */
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

        /*
         * PROPOSTA precisa obrigatoriamente
         * possuir um valor.
         */
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

        /*
         * Somente PROPOSTA carrega valor.
         */
        if ($dados['tipo'] !== 'PROPOSTA') {
            $dados['valor_proposto'] = null;
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
             * Toda nova negociação começa
             * aguardando o contratante.
             */
            $status = $this->buscarStatusNegociacao(
                'AGUARDANDO_CONTRATANTE'
            );

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

                'status_id' =>
                $status->id,

                'valor_trabalho' =>
                $valorTrabalho,
            ]);

            /*
             * Relaciona a primeira interação.
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
                'status',
                'pagamento.status',
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
     * Adiciona uma nova interação.
     */
    #[OA\Post(
        path: '/api/negociacoes/{negociacao}/interacoes',
        summary: 'Adiciona uma nova interação à negociação',
        description: 'Permite continuar a negociação respeitando as regras de INTERESSE, PROPOSTA e DUVIDA.',
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
                        description: 'Tipo da nova interação.',
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
                        nullable: true,
                        example: 'Consigo fazer por R$ 340.'
                    ),
                    new OA\Property(
                        property: 'valor_proposto',
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

        $codigoStatus =
            $negociacao->status->codigo;

        /*
         * Somente negociações abertas
         * podem receber interações.
         */
        if (
            !in_array(
                $codigoStatus,
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

        /*
         * Impede o mesmo usuário de responder
         * duas vezes seguidas.
         */
        if (
            $interacaoAnterior->remetente_id ==
            $usuario->id
        ) {
            throw ValidationException::withMessages([
                'negociacao' => [
                    'Aguarde o outro participante responder antes de enviar uma nova interação.',
                ],
            ]);
        }

        $tipoAnterior =
            $interacaoAnterior->tipo->tipo;

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

        $novoTipo =
            $dados['tipo'];

        /*
         * Depois que o contratante aceita
         * um INTERESSE, o interessado pode
         * continuar a negociação.
         *
         * Portanto:
         *
         * INTERESSE + AGUARDANDO_CONTRATANTE
         * = ainda aguardando aceite.
         *
         * INTERESSE + AGUARDANDO_INTERESSADO
         * = contratante já aceitou.
         */
        if ($tipoAnterior === 'INTERESSE') {

            if (
                $codigoStatus ===
                'AGUARDANDO_CONTRATANTE'
            ) {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'A manifestação de interesse deve ser aceita ou recusada pelo contratante.',
                    ],
                ]);
            }

            /*
             * Depois do aceite do interesse,
             * o interessado pode:
             *
             * - enviar PROPOSTA
             * - enviar DUVIDA
             */
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
                        'Após o aceite do interesse, envie uma proposta ou uma dúvida.',
                    ],
                ]);
            }
        }

        /*
         * PROPOSTA pode receber:
         * - nova PROPOSTA
         * - DUVIDA
         */
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
                        'Uma proposta só pode receber uma nova proposta ou uma dúvida.',
                    ],
                ]);
            }
        }

        /*
         * DUVIDA somente pode receber
         * outra interação DUVIDA.
         */
        if ($tipoAnterior === 'DUVIDA') {

            if ($novoTipo !== 'DUVIDA') {
                throw ValidationException::withMessages([
                    'tipo' => [
                        'Uma dúvida deve ser respondida com uma nova interação do tipo DUVIDA.',
                    ],
                ]);
            }
        }

        /*
         * PROPOSTA precisa possuir valor.
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

        /*
         * Somente PROPOSTA carrega valor.
         */
        if ($novoTipo !== 'PROPOSTA') {
            $dados['valor_proposto'] = null;
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

            /*
             * Cria a interação.
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
             * Atualiza o valor somente
             * quando houver nova proposta.
             */
            $valorTrabalho =
                $dados['tipo'] === 'PROPOSTA'
                ? $dados['valor_proposto']
                : $negociacao->valor_trabalho;

            /*
             * Define quem deverá responder.
             */
            if (
                $usuario->id ==
                $negociacao->id_interessado
            ) {
                $novoStatus =
                    'AGUARDANDO_CONTRATANTE';
            } else {
                $novoStatus =
                    'AGUARDANDO_INTERESSADO';
            }

            $status =
                $this->buscarStatusNegociacao(
                    $novoStatus
                );

            $negociacao->update([
                'status_id' =>
                $status->id,

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
                'status',
                'pagamento.status',
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
        summary: 'Aceita a última interação da negociação',
        description: 'O contratante pode aceitar um INTERESSE. Uma PROPOSTA pode ser aceita pelo participante que recebeu a proposta. Em ambos os casos a negociação passa para AGUARDANDO_PAGAMENTO e o pagamento é criado para o contratante.',
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
                description: 'Interação aceita com sucesso'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não pode aceitar esta interação'
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
         * Somente negociações abertas
         * podem ser aceitas.
         */
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
         * Não pode aceitar a própria interação.
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

        $tipoInteracao =
            $interacao->tipo->tipo;

        /*
         * =========================================================
         * ACEITAR INTERESSE
         * =========================================================
         *
         * O interessado enviou INTERESSE.
         *
         * O contratante aceita.
         *
         * Agora já temos uma contratação definida,
         * portanto:
         *
         * negociação = AGUARDANDO_PAGAMENTO
         * pagamento   = AGUARDANDO_PAGAMENTO
         */
        if ($tipoInteracao === 'INTERESSE') {

            if (
                $usuario->id !=
                $negociacao->id_contratante
            ) {
                throw ValidationException::withMessages([
                    'negociacao' => [
                        'Somente o contratante pode aceitar uma manifestação de interesse.',
                    ],
                ]);
            }

            /*
             * O interesse não possui valor.
             *
             * Portanto utiliza o valor estimado
             * da publicação.
             */
            $valorTrabalho =
                $negociacao->valor_trabalho
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
                $valorTrabalho
            );
        }

        /*
         * =========================================================
         * ACEITAR PROPOSTA
         * =========================================================
         *
         * A proposta pode ter sido enviada pelo:
         *
         * - interessado
         * - contratante
         *
         * Quem recebe a proposta é quem pode aceitar.
         *
         * Após o aceite:
         *
         * negociação = AGUARDANDO_PAGAMENTO
         * pagamento   = AGUARDANDO_PAGAMENTO
         */
        if ($tipoInteracao === 'PROPOSTA') {

            /*
             * O usuário não pode aceitar
             * a própria proposta.
             *
             * Essa validação já existe acima,
             * mas mantemos a regra explícita.
             */
            if (
                $interacao->remetente_id ==
                $usuario->id
            ) {
                throw ValidationException::withMessages([
                    'negociacao' => [
                        'Você não pode aceitar sua própria proposta.',
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
                $valorTrabalho
            );
        }

        /*
         * DUVIDA nunca pode ser aceita diretamente.
         */
        throw ValidationException::withMessages([
            'negociacao' => [
                'Uma dúvida deve ser respondida antes de qualquer aceitação.',
            ],
        ]);
    }


    /**
     * Coloca a negociação em AGUARDANDO_PAGAMENTO
     * e cria o registro do pagamento.
     */
    private function fecharNegociacaoParaPagamento(
        Negociacao $negociacao,
        $valorTrabalho
    ) {
        return DB::transaction(function () use (
            $negociacao,
            $valorTrabalho
        ) {
            /*
             * Status da negociação.
             */
            $statusNegociacao =
                $this->buscarStatusNegociacao(
                    'AGUARDANDO_PAGAMENTO'
                );

            /*
             * Status inicial do pagamento.
             */
            $statusPagamento =
                $this->buscarStatusPagamento(
                    'AGUARDANDO_PAGAMENTO'
                );

            /*
             * Atualiza a negociação.
             */
            $negociacao->update([
                'status_id' =>
                $statusNegociacao->id,

                'valor_trabalho' =>
                $valorTrabalho,
            ]);

            /*
             * Cria o pagamento.
             */
            NegociacaoPagamento::create([
                'id_negociacao' =>
                $negociacao->id_negociacao,

                'status_id' =>
                $statusPagamento->id,

                'valor' =>
                $valorTrabalho,
            ]);

            /*
             * Todas as outras negociações abertas
             * da mesma publicação são encerradas.
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

            return response()->json([
                'message' =>
                'Negociação aceita. Aguardando pagamento do contratante.',

                'data' =>
                $negociacao->fresh([
                    'status',
                    'pagamento.status',
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
        summary: 'Recusa uma manifestação de interesse ou proposta',
        description: 'Interações do tipo INTERESSE ou PROPOSTA podem ser recusadas diretamente. DUVIDA deve ser respondida.',
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
                description: 'A interação não pode ser recusada'
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
         * podem ser recusadas.
         */
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
         * Somente INTERESSE e PROPOSTA
         * podem ser recusados.
         */
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
                    'Somente uma manifestação de interesse ou uma proposta pode ser recusada. Dúvidas devem ser respondidas.',
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

        return response()->json([
            'message' =>
            'Negociação encerrada.',

            'data' =>
            $negociacao->fresh([
                'status',
                'pagamento.status',
                'publicacao',
                'interessado',
                'contratante',
                'interacoes.interacao.tipo',
                'interacoes.interacao.remetente',
            ]),
        ]);
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
