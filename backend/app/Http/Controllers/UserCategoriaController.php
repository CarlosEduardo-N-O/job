<?php

namespace App\Http\Controllers;

use App\Models\UserCategoria;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class UserCategoriaController extends Controller
{
    #[OA\Get(
        path: '/api/usuario-categorias',
        summary: 'Lista os vínculos entre usuários e categorias',
        tags: ['Usuário-Categorias'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de vínculos'
            )
        ]
    )]
    public function index()
    {
        $vinculos = UserCategoria::with([
            'usuario',
            'categoria'
        ])
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $vinculos
        ]);
    }


    #[OA\Post(
        path: '/api/usuario-categorias',
        summary: 'Vincula um usuário a uma categoria',
        tags: ['Usuário-Categorias'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'user_id',
                    'categoria_id'
                ],
                properties: [
                    new OA\Property(
                        property: 'user_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'categoria_id',
                        type: 'integer',
                        example: 4
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Vínculo criado'
            ),
            new OA\Response(
                response: 409,
                description: 'Vínculo já existe'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            )
        ]
    )]
    public function store(Request $request)
    {
        $dados = $request->validate([
            'user_id' => [
                'required',
                'integer',
                'exists:users,id'
            ],

            'categoria_id' => [
                'required',
                'integer',
                'exists:categorias,id'
            ],
        ]);

        $existe = UserCategoria::where(
            'user_id',
            $dados['user_id']
        )
            ->where(
                'categoria_id',
                $dados['categoria_id']
            )
            ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Este usuário já está vinculado a esta categoria.'
            ], 409);
        }

        $vinculo = UserCategoria::create($dados);

        $vinculo->load([
            'usuario',
            'categoria'
        ]);

        return response()->json([
            'message' => 'Usuário vinculado à categoria com sucesso.',
            'data' => $vinculo
        ], 201);
    }


    #[OA\Get(
        path: '/api/usuario-categorias/{usuarioCategoria}',
        summary: 'Exibe um vínculo entre usuário e categoria',
        tags: ['Usuário-Categorias'],
        parameters: [
            new OA\Parameter(
                name: 'usuarioCategoria',
                description: 'ID do vínculo',
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
                description: 'Vínculo encontrado'
            ),
            new OA\Response(
                response: 404,
                description: 'Vínculo não encontrado'
            )
        ]
    )]
    public function show(UserCategoria $usuarioCategoria)
    {
        $usuarioCategoria->load([
            'usuario',
            'categoria'
        ]);

        return response()->json([
            'data' => $usuarioCategoria
        ]);
    }


    #[OA\Put(
        path: '/api/usuario-categorias/{usuarioCategoria}',
        summary: 'Atualiza um vínculo entre usuário e categoria',
        tags: ['Usuário-Categorias'],
        parameters: [
            new OA\Parameter(
                name: 'usuarioCategoria',
                description: 'ID do vínculo',
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
                        property: 'user_id',
                        type: 'integer',
                        example: 1
                    ),
                    new OA\Property(
                        property: 'categoria_id',
                        type: 'integer',
                        example: 4
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Vínculo atualizado'
            ),
            new OA\Response(
                response: 404,
                description: 'Vínculo não encontrado'
            ),
            new OA\Response(
                response: 409,
                description: 'Vínculo já existe'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            )
        ]
    )]
    public function update(
        Request $request,
        UserCategoria $usuarioCategoria
    ) {
        $dados = $request->validate([
            'user_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id'
            ],

            'categoria_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:categorias,id'
            ],
        ]);

        $userId = $dados['user_id']
            ?? $usuarioCategoria->user_id;

        $categoriaId = $dados['categoria_id']
            ?? $usuarioCategoria->categoria_id;

        $duplicado = UserCategoria::where(
            'user_id',
            $userId
        )
            ->where(
                'categoria_id',
                $categoriaId
            )
            ->where(
                'id',
                '!=',
                $usuarioCategoria->id
            )
            ->exists();

        if ($duplicado) {
            return response()->json([
                'message' => 'Este usuário já está vinculado a esta categoria.'
            ], 409);
        }

        $usuarioCategoria->update($dados);

        $usuarioCategoria->load([
            'usuario',
            'categoria'
        ]);

        return response()->json([
            'message' => 'Vínculo atualizado com sucesso.',
            'data' => $usuarioCategoria
        ]);
    }


    #[OA\Delete(
        path: '/api/usuario-categorias/{usuarioCategoria}',
        summary: 'Remove o vínculo entre usuário e categoria',
        tags: ['Usuário-Categorias'],
        parameters: [
            new OA\Parameter(
                name: 'usuarioCategoria',
                description: 'ID do vínculo',
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
                response: 204,
                description: 'Vínculo removido'
            ),
            new OA\Response(
                response: 404,
                description: 'Vínculo não encontrado'
            )
        ]
    )]
    public function destroy(UserCategoria $usuarioCategoria)
    {
        $usuarioCategoria->delete();

        return response()->noContent();
    }
}
