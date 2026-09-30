<?php

namespace App\Http\Controllers;

use App\Models\Publicacao;
use App\Models\PublicacaoStatus;
use App\Models\Negociacao;
use App\Models\NegociacaoStatus;
use App\Models\Notificacao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class PublicacaoController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CONFIGURAÇÕES
    |--------------------------------------------------------------------------
    */

    /**
     * Quantidade padrão de publicações retornadas por página.
     */
    private const PUBLICACOES_POR_PAGINA = 20;

    /**
     * Relacionamentos utilizados nas listagens.
     *
     * As colunas são limitadas para evitar carregar dados
     * desnecessários do banco.
     */
    private function relacionamentosPublicacao(
        bool $incluirEmail = true
    ): array {
        return [
            'categoria:id,nome,descricao',

            $incluirEmail
                ? 'contratante:id,name,email,telefone,foto_url,cidade,estado'
                : 'contratante:id,name,foto_url,cidade,estado',

            'status:id,codigo,nome,descricao',

            'anexos:id,publicacao_id,nome_original,nome_arquivo,caminho,mime_type,tipo,tamanho,ordem',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LISTAR PUBLICAÇÕES PARA A HOME
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/publicacoes',
        summary: 'Lista publicações disponíveis para o usuário autenticado',
        description: 'Retorna somente publicações ativas pertencentes às categorias vinculadas ao usuário autenticado, que não foram criadas pelo próprio usuário e que ainda não possuem negociação iniciada pelo usuário.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'page',
                description: 'Número da página',
                in: 'query',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    default: 1
                )
            ),
            new OA\Parameter(
                name: 'per_page',
                description: 'Quantidade de publicações por página. O máximo permitido é 50.',
                in: 'query',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    default: 20
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de publicações disponíveis'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function index(Request $request)
    {
        $usuario = $request->user();

        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    self::PUBLICACOES_POR_PAGINA
                ),
                1
            ),
            50
        );

        $publicacoes = Publicacao::query()
            ->select([
                'id',
                'categoria_id',
                'contratante_id',
                'status_id',
                'titulo',
                'descricao',
                'valor_estimado',
                'cidade',
                'estado',
                'endereco_servico',
                'data_inicio',
                'horario_inicio',
                'data_fim',
                'created_at',
                'updated_at',
            ])

            ->with(
                $this->relacionamentosPublicacao()
            )

            /*
             * Somente publicações ativas.
             */
            ->whereHas(
                'status',
                function ($query) {
                    $query
                        ->where('codigo', 'ATIVO')
                        ->where('ativo', true);
                }
            )

            /*
             * Somente categorias vinculadas ao usuário.
             */
            ->whereHas(
                'categoria.usuarios',
                function ($query) use ($usuario) {
                    $query->where(
                        'users.id',
                        $usuario->id
                    );
                }
            )

            /*
             * Nunca mostrar a própria publicação.
             */
            ->where(
                'contratante_id',
                '!=',
                $usuario->id
            )

            /*
             * Não mostrar publicações onde o usuário
             * já iniciou uma negociação.
             */
            ->whereDoesntHave(
                'negociacoes',
                function ($query) use ($usuario) {
                    $query->where(
                        'id_interessado',
                        $usuario->id
                    );
                }
            )

            ->orderByDesc('id')

            ->paginate($perPage);

        return response()->json([
            'data' => $publicacoes->items(),

            'pagination' => [
                'current_page' =>
                $publicacoes->currentPage(),

                'last_page' =>
                $publicacoes->lastPage(),

                'per_page' =>
                $publicacoes->perPage(),

                'total' =>
                $publicacoes->total(),

                'has_more_pages' =>
                $publicacoes->hasMorePages(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VISUALIZAR MINHAS PUBLICAÇÕES
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/publicacoes/minhas_publicacoes',
        summary: 'Lista minhas publicações',
        description: 'Retorna as publicações criadas pelo usuário autenticado, independentemente do status, incluindo a quantidade de negociações vinculadas a cada publicação.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'page',
                description: 'Número da página',
                in: 'query',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    default: 1
                )
            ),
            new OA\Parameter(
                name: 'per_page',
                description: 'Quantidade de publicações por página. O máximo permitido é 50.',
                in: 'query',
                required: false,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    default: 20
                )
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista das publicações do usuário'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function minhas_publicacoes(Request $request)
    {
        $usuario = $request->user();

        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    self::PUBLICACOES_POR_PAGINA
                ),
                1
            ),
            50
        );

        $publicacoes = Publicacao::query()
            ->select([
                'id',
                'categoria_id',
                'contratante_id',
                'status_id',
                'titulo',
                'descricao',
                'valor_estimado',
                'cidade',
                'estado',
                'endereco_servico',
                'data_inicio',
                'horario_inicio',
                'data_fim',
                'created_at',
                'updated_at',
            ])

            ->with(
                $this->relacionamentosPublicacao()
            )

            ->withCount('negociacoes')

            ->where(
                'contratante_id',
                $usuario->id
            )

            ->orderByDesc('id')

            ->paginate($perPage);

        return response()->json([
            'data' => $publicacoes->items(),

            'pagination' => [
                'current_page' =>
                $publicacoes->currentPage(),

                'last_page' =>
                $publicacoes->lastPage(),

                'per_page' =>
                $publicacoes->perPage(),

                'total' =>
                $publicacoes->total(),

                'has_more_pages' =>
                $publicacoes->hasMorePages(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LISTAR OUTRAS PUBLICAÇÕES
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/publicacoes/outras',
        summary: 'Lista outras publicações disponíveis',
        description: 'Retorna publicações ativas de categorias que não estão vinculadas ao usuário autenticado.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de outras publicações'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function outras_publicacoes(Request $request)
    {
        $usuario = $request->user();

        $temCategorias = $usuario
            ->categorias()
            ->exists();

        $publicacoes = Publicacao::query()
            ->select([
                'id',
                'categoria_id',
                'contratante_id',
                'status_id',
                'titulo',
                'descricao',
                'valor_estimado',
                'cidade',
                'estado',
                'endereco_servico',
                'data_inicio',
                'horario_inicio',
                'data_fim',
                'created_at',
                'updated_at',
            ])

            ->with(
                $this->relacionamentosPublicacao(false)
            )

            /*
             * Somente publicações ativas.
             */
            ->whereHas(
                'status',
                function ($query) {
                    $query
                        ->where('codigo', 'ATIVO')
                        ->where('ativo', true);
                }
            )

            /*
             * Somente categorias que não estão
             * vinculadas ao usuário.
             */
            ->whereDoesntHave(
                'categoria.usuarios',
                function ($query) use ($usuario) {
                    $query->where(
                        'users.id',
                        $usuario->id
                    );
                }
            )

            /*
             * Nunca mostrar a própria publicação.
             */
            ->where(
                'contratante_id',
                '!=',
                $usuario->id
            )

            /*
             * Não mostrar publicações onde o usuário
             * já iniciou uma negociação.
             */
            ->whereDoesntHave(
                'negociacoes',
                function ($query) use ($usuario) {
                    $query->where(
                        'id_interessado',
                        $usuario->id
                    );
                }
            )

            ->orderByDesc('id')

            ->limit(6)

            ->get();

        return response()->json([
            'tem_categorias' =>
            $temCategorias,

            'data' =>
            $publicacoes,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CRIAR PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/publicacoes',
        summary: 'Cria uma nova publicação',
        description: 'Cria uma publicação e permite anexar imagens, vídeos e arquivos PDF.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: [
                        'categoria_id',
                        'titulo',
                        'descricao'
                    ],
                    properties: [
                        new OA\Property(
                            property: 'categoria_id',
                            type: 'integer',
                            example: 1
                        ),
                        new OA\Property(
                            property: 'titulo',
                            type: 'string',
                            example: 'Preciso de um eletricista'
                        ),
                        new OA\Property(
                            property: 'descricao',
                            type: 'string',
                            example: 'Preciso instalar três tomadas em minha residência.'
                        ),
                        new OA\Property(
                            property: 'valor_estimado',
                            type: 'number',
                            format: 'float',
                            example: 250.00
                        ),
                        new OA\Property(
                            property: 'cidade',
                            type: 'string',
                            example: 'Rio do Sul'
                        ),
                        new OA\Property(
                            property: 'estado',
                            type: 'string',
                            example: 'SC'
                        ),
                        new OA\Property(
                            property: 'endereco_servico',
                            type: 'string',
                            example: 'Rua das Flores, 100'
                        ),
                        new OA\Property(
                            property: 'data_inicio',
                            type: 'string',
                            format: 'date',
                            example: '2026-09-15'
                        ),
                        new OA\Property(
                            property: 'horario_inicio',
                            type: 'string',
                            example: '14:00'
                        ),
                        new OA\Property(
                            property: 'data_fim',
                            type: 'string',
                            format: 'date',
                            example: '2026-09-20'
                        ),
                        new OA\Property(
                            property: 'arquivos',
                            type: 'array',
                            description: 'Imagens, vídeos ou arquivos PDF. Máximo de 10 arquivos.',
                            items: new OA\Items(
                                type: 'string',
                                format: 'binary'
                            )
                        )
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Publicação criada'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function store(Request $request)
    {
        $usuario = $request->user();

        $dados = $request->validate([
            'categoria_id' => [
                'required',
                'integer',
                'exists:categorias,id'
            ],

            'titulo' => [
                'required',
                'string',
                'max:200'
            ],

            'descricao' => [
                'required',
                'string'
            ],

            'valor_estimado' => [
                'nullable',
                'numeric',
                'min:0'
            ],

            'cidade' => [
                'nullable',
                'string',
                'max:100'
            ],

            'estado' => [
                'nullable',
                'string',
                'size:2'
            ],

            'endereco_servico' => [
                'nullable',
                'string',
                'max:500'
            ],

            'data_inicio' => [
                'nullable',
                'date'
            ],

            'horario_inicio' => [
                'nullable',
                'string',
                'max:50'
            ],

            'data_fim' => [
                'nullable',
                'date',
                'after_or_equal:data_inicio'
            ],

            'arquivos' => [
                'nullable',
                'array',
                'max:10'
            ],

            'arquivos.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp,mp4,webm,pdf',
                'max:102400'
            ],
        ]);

        /*
         * O contratante é sempre o usuário autenticado.
         */
        $dados['contratante_id'] = $usuario->id;

        /*
         * Toda nova publicação começa como ATIVO.
         */
        $statusAtivo = PublicacaoStatus::query()
            ->where('codigo', 'ATIVO')
            ->where('ativo', true)
            ->firstOrFail();

        $dados['status_id'] = $statusAtivo->id;

        /*
         * Os arquivos são tratados separadamente.
         */
        $arquivos = $request->file('arquivos', []);

        unset($dados['arquivos']);

        $caminhosCriados = [];

        try {
            $publicacao = DB::transaction(
                function () use (
                    $dados,
                    $arquivos,
                    &$caminhosCriados
                ) {
                    /*
                     * Cria a publicação.
                     */
                    $publicacao = Publicacao::create(
                        $dados
                    );

                    /*
                     * Processa os anexos.
                     */
                    foreach (
                        $arquivos as $ordem => $arquivo
                    ) {
                        $mimeType =
                            $arquivo->getMimeType();

                        $tipo = match (true) {
                            str_starts_with(
                                $mimeType,
                                'image/'
                            ) => 'imagem',

                            str_starts_with(
                                $mimeType,
                                'video/'
                            ) => 'video',

                            $mimeType ===
                                'application/pdf'
                            => 'pdf',

                            default => null,
                        };

                        if (!$tipo) {
                            throw new \RuntimeException(
                                'Tipo de arquivo não permitido.'
                            );
                        }

                        $caminho =
                            $arquivo->store(
                                "publicacoes/{$publicacao->id}",
                                'local'
                            );

                        $caminhosCriados[] =
                            $caminho;

                        $publicacao
                            ->anexos()
                            ->create([
                                'nome_original' =>
                                $arquivo
                                    ->getClientOriginalName(),

                                'nome_arquivo' =>
                                basename(
                                    $caminho
                                ),

                                'caminho' =>
                                $caminho,

                                'mime_type' =>
                                $mimeType,

                                'tipo' =>
                                $tipo,

                                'tamanho' =>
                                $arquivo->getSize(),

                                'ordem' =>
                                $ordem,
                            ]);
                    }

                    return $publicacao;
                }
            );
        } catch (\Throwable $e) {

            /*
             * Se o banco falhar depois de algum arquivo
             * ter sido salvo, remove os arquivos físicos.
             */
            foreach (
                $caminhosCriados as $caminho
            ) {
                Storage::disk('local')
                    ->delete($caminho);
            }

            throw $e;
        }

        /*
         * ==============================================================
         * NOTIFICAÇÃO DE NOVA PUBLICAÇÃO
         * ==============================================================
         *
         * Usuários vinculados à categoria recebem a notificação.
         *
         * O próprio autor é ignorado.
         *
         * A falha de notificação não desfaz a publicação.
         */
        try {
            $usuariosNotificacao =
                DB::table('user_categoria')
                ->where(
                    'categoria_id',
                    $publicacao->categoria_id
                )
                ->where(
                    'user_id',
                    '!=',
                    $usuario->id
                )
                ->pluck('user_id');

            if (
                $usuariosNotificacao->isNotEmpty()
            ) {
                $agora = now();

                $notificacoes =
                    $usuariosNotificacao
                    ->map(
                        function ($userId) use (
                            $publicacao,
                            $agora
                        ) {
                            return [
                                'user_id' =>
                                $userId,

                                'tipo' =>
                                'NOVA_PUBLICACAO',

                                'titulo' =>
                                'Nova publicação na sua categoria',

                                'mensagem' =>
                                "Uma nova publicação foi criada na categoria relacionada aos seus interesses: {$publicacao->titulo}.",

                                'lida' =>
                                false,

                                'dados' =>
                                json_encode([
                                    'publicacao_id' =>
                                    $publicacao->id,

                                    'categoria_id' =>
                                    $publicacao->categoria_id,

                                    'contratante_id' =>
                                    $publicacao->contratante_id,

                                    'tipo' =>
                                    'NOVA_PUBLICACAO',
                                ]),

                                'created_at' =>
                                $agora,

                                'updated_at' =>
                                $agora,
                            ];
                        }
                    )
                    ->values()
                    ->all();

                Notificacao::insert(
                    $notificacoes
                );
            }
        } catch (\Throwable $e) {
            Log::error(
                'Erro ao criar notificações de nova publicação.',
                [
                    'publicacao_id' =>
                    $publicacao->id,

                    'categoria_id' =>
                    $publicacao->categoria_id,

                    'usuario_id' =>
                    $usuario->id,

                    'erro' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
         * Carrega os dados necessários para a resposta.
         */
        $publicacao->load(
            $this->relacionamentosPublicacao()
        );

        return response()->json([
            'message' =>
            'Publicação criada com sucesso.',

            'data' =>
            $publicacao
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | VISUALIZAR PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/publicacoes/{publicacao}',
        summary: 'Visualiza uma publicação',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'publicacao',
                description: 'ID da publicação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                ),
                example: 1
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Publicação encontrada'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação não encontrada'
            )
        ]
    )]
    public function show(
        Request $request,
        Publicacao $publicacao
    ) {
        $usuario = $request->user();

        /*
         * Carrega o status.
         *
         * IMPORTANTE:
         * show() não altera mais o banco.
         */
        $publicacao->loadMissing(
            'status'
        );

        /*
         * Dono da publicação:
         * pode visualizar independentemente do status.
         */
        if (
            (int) $publicacao->contratante_id ===
            (int) $usuario->id
        ) {
            $publicacao->load(
                $this->relacionamentosPublicacao()
            );

            return response()->json([
                'data' =>
                $publicacao
            ]);
        }

        /*
         * Usuários externos:
         * somente publicações ATIVAS.
         */
        if (
            $publicacao->status?->codigo !==
            'ATIVO'
        ) {
            return response()->json([
                'message' =>
                'Publicação não encontrada.'
            ], 404);
        }

        /*
         * Verifica se o usuário possui a categoria.
         */
        $possuiCategoria =
            $usuario
            ->categorias()
            ->where(
                'categorias.id',
                $publicacao->categoria_id
            )
            ->exists();

        if (!$possuiCategoria) {
            return response()->json([
                'message' =>
                'Publicação não encontrada.'
            ], 404);
        }

        /*
         * Para usuário externo não carregamos
         * telefone/e-mail do contratante.
         */
        $publicacao->load([
            'categoria:id,nome,descricao',

            'contratante:id,name,foto_url,cidade,estado',

            'status:id,codigo,nome,descricao',
        ]);

        return response()->json([
            'data' =>
            $publicacao
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ATUALIZAR PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Put(
        path: '/api/publicacoes/{publicacao}',
        summary: 'Atualiza uma publicação do usuário autenticado',
        description: 'Atualiza os dados da publicação. Publicações encerradas não podem mais ser alteradas. O status não pode ser alterado através deste endpoint. O cancelamento deve ser realizado exclusivamente pelo endpoint /cancelar.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'publicacao',
                description: 'ID da publicação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                ),
                example: 1
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'categoria_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'titulo',
                        type: 'string',
                        example: 'Preciso de um eletricista'
                    ),
                    new OA\Property(
                        property: 'descricao',
                        type: 'string',
                        example: 'Preciso instalar tomadas.'
                    ),
                    new OA\Property(
                        property: 'valor_estimado',
                        type: 'number',
                        format: 'float',
                        example: 300.00
                    ),
                    new OA\Property(
                        property: 'cidade',
                        type: 'string',
                        example: 'Rio do Sul'
                    ),
                    new OA\Property(
                        property: 'estado',
                        type: 'string',
                        example: 'SC'
                    ),
                    new OA\Property(
                        property: 'endereco_servico',
                        type: 'string',
                        example: 'Rua das Flores, 100'
                    ),
                    new OA\Property(
                        property: 'data_inicio',
                        type: 'string',
                        format: 'date',
                        example: '2026-09-15'
                    ),
                    new OA\Property(
                        property: 'horario_inicio',
                        type: 'string',
                        example: '14:00'
                    ),
                    new OA\Property(
                        property: 'data_fim',
                        type: 'string',
                        format: 'date',
                        example: '2026-09-20'
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Publicação atualizada'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Sem permissão'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação não encontrada'
            ),
            new OA\Response(
                response: 422,
                description: 'Publicação não pode ser alterada'
            )
        ]
    )]
    public function update(
        Request $request,
        Publicacao $publicacao
    ) {
        $usuario = $request->user();

        /*
         * Somente o dono pode alterar.
         */
        if (
            (int) $publicacao->contratante_id !==
            (int) $usuario->id
        ) {
            return response()->json([
                'message' =>
                'Você não pode alterar esta publicação.'
            ], 403);
        }

        /*
         * Carrega o status atual.
         */
        $publicacao->loadMissing(
            'status'
        );

        /*
         * Publicações encerradas não podem ser alteradas.
         */
        if (
            $publicacao->status?->codigo ===
            'ENCERRADO'
        ) {
            return response()->json([
                'message' =>
                'Esta publicação está encerrada e não pode mais ser alterada.'
            ], 422);
        }

        $dados = $request->validate([
            'categoria_id' => [
                'sometimes',
                'integer',
                'exists:categorias,id'
            ],

            'titulo' => [
                'sometimes',
                'string',
                'max:200'
            ],

            'descricao' => [
                'sometimes',
                'string'
            ],

            'valor_estimado' => [
                'nullable',
                'numeric',
                'min:0'
            ],

            'cidade' => [
                'nullable',
                'string',
                'max:100'
            ],

            'estado' => [
                'nullable',
                'string',
                'size:2'
            ],

            'endereco_servico' => [
                'nullable',
                'string',
                'max:500'
            ],

            'data_inicio' => [
                'nullable',
                'date'
            ],

            'horario_inicio' => [
                'nullable',
                'string',
                'max:50'
            ],

            'data_fim' => [
                'nullable',
                'date',
                'after_or_equal:data_inicio'
            ],
        ]);

        /*
         * Segurança:
         * nunca permite alterar contratante/status.
         */
        unset(
            $dados['contratante_id'],
            $dados['status'],
            $dados['status_id']
        );

        /*
         * Guarda os dados anteriores para identificar
         * alterações relevantes.
         */
        $tituloAnterior =
            $publicacao->titulo;

        $categoriaAnterior =
            $publicacao->categoria_id;

        $publicacao->update(
            $dados
        );

        /*
         * ==============================================================
         * NOTIFICAÇÃO DE PUBLICAÇÃO ATUALIZADA
         * ==============================================================
         *
         * Somente usuários que já possuem negociação aberta
         * recebem essa notificação.
         *
         * Isso evita enviar "publicação atualizada" para todos
         * os usuários da categoria sem necessidade.
         */
        try {
            $publicacaoAtualizada =
                $publicacao->fresh();

            $negociacoesAbertas =
                Negociacao::query()
                ->where(
                    'id_publicacao',
                    $publicacao->id
                )
                ->whereHas(
                    'status',
                    function ($query) {
                        $query->whereIn(
                            'codigo',
                            [
                                'AGUARDANDO_INTERESSADO',
                                'AGUARDANDO_CONTRATANTE',
                                'AGUARDANDO_PAGAMENTO',
                                'PROCESSANDO_PAGAMENTO',
                            ]
                        );
                    }
                )
                ->pluck(
                    'id_interessado'
                )
                ->unique()
                ->values();

            if (
                $negociacoesAbertas->isNotEmpty()
            ) {
                $agora = now();

                $notificacoes =
                    $negociacoesAbertas
                    ->map(
                        function ($userId) use (
                            $publicacaoAtualizada,
                            $agora,
                            $tituloAnterior,
                            $categoriaAnterior
                        ) {
                            return [
                                'user_id' =>
                                $userId,

                                'tipo' =>
                                'PUBLICACAO_ATUALIZADA',

                                'titulo' =>
                                'Publicação atualizada',

                                'mensagem' =>
                                "A publicação \"{$publicacaoAtualizada->titulo}\" foi atualizada pelo contratante.",

                                'lida' =>
                                false,

                                'dados' =>
                                json_encode([
                                    'publicacao_id' =>
                                    $publicacaoAtualizada->id,

                                    'categoria_id' =>
                                    $publicacaoAtualizada->categoria_id,

                                    'contratante_id' =>
                                    $publicacaoAtualizada->contratante_id,

                                    'titulo_anterior' =>
                                    $tituloAnterior,

                                    'categoria_anterior_id' =>
                                    $categoriaAnterior,

                                    'tipo' =>
                                    'PUBLICACAO_ATUALIZADA',
                                ]),

                                'created_at' =>
                                $agora,

                                'updated_at' =>
                                $agora,
                            ];
                        }
                    )
                    ->values()
                    ->all();

                Notificacao::insert(
                    $notificacoes
                );
            }
        } catch (\Throwable $e) {
            Log::error(
                'Erro ao criar notificações de publicação atualizada.',
                [
                    'publicacao_id' =>
                    $publicacao->id,

                    'usuario_id' =>
                    $usuario->id,

                    'erro' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
         * Recarrega somente os relacionamentos necessários.
         */
        $publicacao->load(
            $this->relacionamentosPublicacao()
        );

        return response()->json([
            'message' =>
            'Publicação atualizada com sucesso.',

            'data' =>
            $publicacao
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCELAR PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Patch(
        path: '/api/publicacoes/{publicacao}/cancelar',
        summary: 'Cancela uma publicação',
        description: 'Cancela a publicação e altera todas as negociações abertas vinculadas para CANCELADA. Os usuários interessados são notificados.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'publicacao',
                description: 'ID da publicação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer'
                ),
                example: 1
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Publicação cancelada com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Sem permissão'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação não encontrada'
            ),
            new OA\Response(
                response: 422,
                description: 'Publicação não pode ser cancelada'
            )
        ]
    )]
    public function cancelar(
        Request $request,
        Publicacao $publicacao
    ) {
        $usuario = $request->user();

        /*
         * Somente o dono pode cancelar.
         */
        if (
            (int) $publicacao->contratante_id !==
            (int) $usuario->id
        ) {
            return response()->json([
                'message' =>
                'Você não pode cancelar esta publicação.'
            ], 403);
        }

        $publicacao->loadMissing(
            'status'
        );

        /*
         * Somente publicações ATIVAS podem ser canceladas.
         */
        if (
            $publicacao->status?->codigo !==
            'ATIVO'
        ) {
            return response()->json([
                'message' =>
                'Somente uma publicação ativa pode ser cancelada.'
            ], 422);
        }

        $statusCancelado =
            PublicacaoStatus::query()
            ->where(
                'codigo',
                'CANCELADO'
            )
            ->where(
                'ativo',
                true
            )
            ->firstOrFail();

        /*
         * Busca as negociações antes de alterar o status.
         *
         * Precisamos dos interessados para enviar as notificações.
         */
        $negociacoesAbertas =
            Negociacao::query()
            ->where(
                'id_publicacao',
                $publicacao->id
            )
            ->whereHas(
                'status',
                function ($query) {
                    $query->whereIn(
                        'codigo',
                        [
                            'AGUARDANDO_INTERESSADO',
                            'AGUARDANDO_CONTRATANTE',
                        ]
                    );
                }
            )
            ->get([
                'id_negociacao',
                'id_publicacao',
                'id_interessado',
                'id_contratante',
            ]);

        DB::transaction(
            function () use (
                $publicacao,
                $statusCancelado
            ) {
                /*
                 * Cancela a publicação.
                 */
                $publicacao->update([
                    'status_id' =>
                    $statusCancelado->id
                ]);

                /*
                 * Cancela as negociações abertas.
                 */
                $this->cancelarNegociacoes(
                    $publicacao->id
                );
            }
        );

        /*
         * ==============================================================
         * NOTIFICAÇÕES DE CANCELAMENTO
         * ==============================================================
         *
         * A publicação já foi cancelada com sucesso.
         *
         * A notificação é criada depois da transação para que
         * uma eventual falha não impeça o cancelamento.
         */
        try {
            if (
                $negociacoesAbertas->isNotEmpty()
            ) {
                $agora = now();

                $notificacoes =
                    $negociacoesAbertas
                    ->map(
                        function ($negociacao) use (
                            $publicacao,
                            $agora
                        ) {
                            return [
                                'user_id' =>
                                $negociacao
                                    ->id_interessado,

                                'tipo' =>
                                'PUBLICACAO_CANCELADA',

                                'titulo' =>
                                'Publicação cancelada',

                                'mensagem' =>
                                "A publicação \"{$publicacao->titulo}\" foi cancelada pelo contratante. Sua negociação também foi encerrada.",

                                'lida' =>
                                false,

                                'dados' =>
                                json_encode([
                                    'publicacao_id' =>
                                    $publicacao->id,

                                    'negociacao_id' =>
                                    $negociacao
                                        ->id_negociacao,

                                    'contratante_id' =>
                                    $publicacao
                                        ->contratante_id,

                                    'tipo' =>
                                    'PUBLICACAO_CANCELADA',

                                    'status_publicacao' =>
                                    'CANCELADO',

                                    'status_negociacao' =>
                                    'CANCELADA',
                                ]),

                                'created_at' =>
                                $agora,

                                'updated_at' =>
                                $agora,
                            ];
                        }
                    )
                    ->values()
                    ->all();

                Notificacao::insert(
                    $notificacoes
                );
            }
        } catch (\Throwable $e) {
            Log::error(
                'Erro ao criar notificações de publicação cancelada.',
                [
                    'publicacao_id' =>
                    $publicacao->id,

                    'usuario_id' =>
                    $usuario->id,

                    'erro' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
         * Recarrega os dados da publicação.
         */
        $publicacao->load(
            $this->relacionamentosPublicacao()
        );

        return response()->json([
            'message' =>
            'Publicação cancelada com sucesso. Todas as negociações abertas foram canceladas e os interessados foram notificados.',

            'data' =>
            $publicacao
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCELAR NEGOCIAÇÕES DA PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    private function cancelarNegociacoes(
        int $publicacaoId
    ): void {
        /*
         * Busca o status CANCELADA.
         */
        $statusCancelada =
            NegociacaoStatus::query()
            ->where(
                'codigo',
                'CANCELADA'
            )
            ->where(
                'ativo',
                true
            )
            ->firstOrFail();

        /*
         * Status de negociações que ainda estão abertas.
         */
        $statusAbertos = [
            'AGUARDANDO_INTERESSADO',
            'AGUARDANDO_CONTRATANTE',
        ];

        /*
         * Atualiza somente as negociações abertas
         * pertencentes à publicação.
         */
        Negociacao::query()
            ->where(
                'id_publicacao',
                $publicacaoId
            )
            ->whereHas(
                'status',
                function ($query) use (
                    $statusAbertos
                ) {
                    $query->whereIn(
                        'codigo',
                        $statusAbertos
                    );
                }
            )
            ->update([
                'status_id' =>
                $statusCancelada->id
            ]);
    }
}
