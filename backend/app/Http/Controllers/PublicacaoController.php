<?php

namespace App\Http\Controllers;

use App\Models\Publicacao;
use App\Models\PublicacaoStatus;
use App\Models\Negociacao;
use App\Models\NegociacaoStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class PublicacaoController extends Controller
{
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

        /*
         * Garante que negociações de publicações
         * já canceladas também estejam CANCELADA.
         */
        $this->sincronizarNegociacoesCanceladas();

        $publicacoes = Publicacao::with([
            'categoria:id,nome,descricao',
            'contratante:id,name,email,telefone,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ])
            ->whereHas(
                'status',
                function ($query) {
                    $query->where('codigo', 'ATIVO')
                        ->where('ativo', true);
                }
            )

            ->whereHas(
                'categoria',
                function ($categoriaQuery) use ($usuario) {

                    $categoriaQuery->whereHas(
                        'usuarios',
                        function ($usuarioQuery) use ($usuario) {

                            $usuarioQuery->where(
                                'users.id',
                                $usuario->id
                            );
                        }
                    );
                }
            )

            ->where(
                'contratante_id',
                '!=',
                $usuario->id
            )

            ->whereDoesntHave(
                'negociacoes',
                function ($negociacaoQuery) use ($usuario) {

                    $negociacaoQuery->where(
                        'id_interessado',
                        $usuario->id
                    );
                }
            )

            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $publicacoes
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
        description: 'Retorna todas as publicações criadas pelo usuário autenticado, independentemente do status, incluindo a quantidade de negociações vinculadas a cada publicação.',
        tags: ['Publicações'],
        security: [['sanctum' => []]],
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

        /*
         * Garante que negociações de publicações
         * canceladas estejam como CANCELADA.
         */
        $this->sincronizarNegociacoesCanceladas();

        $publicacoes = Publicacao::with([
            'categoria:id,nome,descricao',
            'contratante:id,name,email,telefone,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ])
            ->withCount('negociacoes')
            ->where(
                'contratante_id',
                $usuario->id
            )
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $publicacoes
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
        tags: ['Publicações'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
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
                    )
                ]
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
        ]);

        /*
         * O contratante é sempre o usuário autenticado.
         */
        $dados['contratante_id'] = $usuario->id;

        /*
         * Toda nova publicação começa como ATIVO.
         *
         * O status agora é controlado pela tabela
         * publicacao_status.
         */
        $statusAtivo = PublicacaoStatus::where(
            'codigo',
            'ATIVO'
        )
            ->where('ativo', true)
            ->firstOrFail();

        $dados['status_id'] = $statusAtivo->id;

        $publicacao = Publicacao::create($dados);

        $publicacao->load([
            'categoria:id,nome,descricao',
            'contratante:id,name,email,telefone,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ]);

        return response()->json([
            'message' => 'Publicação criada com sucesso.',
            'data' => $publicacao
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

        $publicacao->loadMissing('status');

        /*
         * Se a publicação foi cancelada,
         * garante o cancelamento das negociações.
         */
        if ($publicacao->status?->codigo === 'CANCELADO') {
            $this->cancelarNegociacoes($publicacao->id);
        }

        /*
         * O dono pode visualizar a publicação
         * independentemente do status.
         */
        if (
            (int) $publicacao->contratante_id ===
            (int) $usuario->id
        ) {

            $publicacao->load([
                'categoria:id,nome,descricao',
                'contratante:id,name,email,telefone,foto_url,cidade,estado',
                'status:id,codigo,nome,descricao',
            ]);

            return response()->json([
                'data' => $publicacao
            ]);
        }

        /*
         * Usuários que não são donos:
         * somente publicações ATIVAS.
         */
        if ($publicacao->status?->codigo !== 'ATIVO') {
            return response()->json([
                'message' => 'Publicação não encontrada.'
            ], 404);
        }

        /*
         * Verifica se o usuário possui a categoria.
         */
        $possuiCategoria = $usuario
            ->categorias()
            ->where(
                'categorias.id',
                $publicacao->categoria_id
            )
            ->exists();

        if (!$possuiCategoria) {
            return response()->json([
                'message' => 'Publicação não encontrada.'
            ], 404);
        }

        $publicacao->load([
            'categoria:id,nome,descricao',
            'contratante:id,name,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ]);

        return response()->json([
            'data' => $publicacao
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
        description: 'Atualiza os dados da publicação. O status não pode ser alterado através deste endpoint. O cancelamento deve ser realizado exclusivamente pelo endpoint /cancelar.',
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
                description: 'Dados inválidos'
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
         * Não permitimos alterar o contratante
         * nem o status através do PUT.
         *
         * O cancelamento possui endpoint próprio.
         */

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
         * nunca permite alterar o contratante
         * nem o status.
         */
        unset(
            $dados['contratante_id'],
            $dados['status'],
            $dados['status_id']
        );

        /*
         * Atualiza somente os dados permitidos.
         */
        $publicacao->update($dados);

        $publicacao->load([
            'categoria:id,nome,descricao',
            'contratante:id,name,email,telefone,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ]);

        return response()->json([
            'message' =>
            'Publicação atualizada com sucesso.',
            'data' => $publicacao
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
        description: 'Cancela a publicação e altera todas as negociações abertas vinculadas para CANCELADA.',
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

        $publicacao->loadMissing('status');

        /*
         * Somente uma publicação ATIVA
         * pode ser cancelada.
         */
        if ($publicacao->status?->codigo !== 'ATIVO') {
            return response()->json([
                'message' =>
                'Somente uma publicação ativa pode ser cancelada.'
            ], 422);
        }

        $statusCancelado = PublicacaoStatus::where(
            'codigo',
            'CANCELADO'
        )
            ->where('ativo', true)
            ->firstOrFail();

        DB::transaction(function () use (
            $publicacao,
            $statusCancelado
        ) {

            /*
             * Cancela a publicação.
             */
            $publicacao->update([
                'status_id' => $statusCancelado->id
            ]);

            /*
             * Cancela todas as negociações abertas.
             */
            $this->cancelarNegociacoes(
                $publicacao->id
            );
        });

        /*
         * Recarrega os relacionamentos.
         */
        $publicacao->load([
            'categoria:id,nome,descricao',
            'contratante:id,name,email,telefone,foto_url,cidade,estado',
            'status:id,codigo,nome,descricao',
        ]);

        return response()->json([
            'message' =>
            'Publicação cancelada com sucesso. Todas as negociações abertas foram canceladas.',
            'data' => $publicacao
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CANCELAR NEGOCIAÇÕES DA PUBLICAÇÃO
    |--------------------------------------------------------------------------
    */

    private function cancelarNegociacoes(int $publicacaoId): void
    {
        /*
         * Busca o status CANCELADA na tabela
         * negociacao_status.
         */
        $statusCancelada = NegociacaoStatus::where(
            'codigo',
            'CANCELADA'
        )
            ->where('ativo', true)
            ->firstOrFail();

        /*
         * Busca os status que ainda estão abertos.
         */
        $statusAbertos = [
            'AGUARDANDO_INTERESSADO',
            'AGUARDANDO_CONTRATANTE',
        ];

        /*
         * Atualiza somente negociações abertas.
         */
        Negociacao::where(
            'id_publicacao',
            $publicacaoId
        )
            ->whereHas(
                'status',
                function ($query) use ($statusAbertos) {
                    $query->whereIn(
                        'codigo',
                        $statusAbertos
                    );
                }
            )
            ->update([
                'status_id' => $statusCancelada->id
            ]);
    }


    /*
    |--------------------------------------------------------------------------
    | SINCRONIZAR NEGOCIAÇÕES CANCELADAS
    |--------------------------------------------------------------------------
    */

    private function sincronizarNegociacoesCanceladas(): void
    {
        /*
         * Busca o status CANCELADA na tabela
         * negociacao_status.
         */
        $statusCancelada = NegociacaoStatus::where(
            'codigo',
            'CANCELADA'
        )
            ->where('ativo', true)
            ->firstOrFail();

        /*
         * Publicações CANCELADO possuem negociações
         * que não podem mais permanecer abertas.
         */
        Negociacao::whereHas(
            'publicacao',
            function ($query) {
                $query->whereHas(
                    'status',
                    function ($statusQuery) {
                        $statusQuery->where(
                            'codigo',
                            'CANCELADO'
                        );
                    }
                );
            }
        )
            ->whereHas(
                'status',
                function ($query) {
                    $query->whereIn(
                        'codigo',
                        [
                            'AGUARDANDO_INTERESSADO',
                            'AGUARDANDO_CONTRATANTE'
                        ]
                    );
                }
            )
            ->update([
                'status_id' => $statusCancelada->id
            ]);
    }
}