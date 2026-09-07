<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\UserCategoria;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class UserCategoriaController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Lista categorias disponíveis
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/users-categorias/categorias',
        summary: 'Lista todas as categorias e informa quais pertencem ao usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de categorias'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function categorias(Request $request)
    {
        $usuario = $request->user();

        $categoriasUsuario = UserCategoria::where(
            'user_id',
            $usuario->id
        )
            ->get()
            ->keyBy('categoria_id');

        $categorias = Categoria::orderBy('nome')
            ->get()
            ->map(function ($categoria) use ($categoriasUsuario) {

                $vinculo = $categoriasUsuario->get(
                    $categoria->id
                );

                return [
                    'id' => $categoria->id,
                    'nome' => $categoria->nome,
                    'descricao' => $categoria->descricao,
                    'selecionada' => $vinculo !== null,
                    'vinculo_id' => $vinculo?->id,
                ];
            });

        return response()->json([
            'data' => $categorias
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Lista meus vínculos
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/users-categorias',
        summary: 'Lista as categorias do usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de vínculos'
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

        $vinculos = UserCategoria::with('categoria')
            ->where(
                'user_id',
                $usuario->id
            )
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $vinculos
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Vincular categoria
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/users-categorias',
        summary: 'Vincula uma categoria ao usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'categoria_id'
                ],
                properties: [
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
                description: 'Categoria já vinculada'
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
        ]);

        $existe = UserCategoria::where(
            'user_id',
            $usuario->id
        )
            ->where(
                'categoria_id',
                $dados['categoria_id']
            )
            ->exists();

        if ($existe) {
            return response()->json([
                'message' => 'Esta categoria já está vinculada ao seu perfil.'
            ], 409);
        }

        $vinculo = UserCategoria::create([
            'user_id' => $usuario->id,
            'categoria_id' => $dados['categoria_id'],
        ]);

        $vinculo->load('categoria');

        return response()->json([
            'message' => 'Categoria vinculada com sucesso.',
            'data' => $vinculo
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Remover vínculo
    |--------------------------------------------------------------------------
    */

    #[OA\Delete(
        path: '/api/users-categorias/{usuarioCategoria}',
        summary: 'Remove uma categoria do usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
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
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function destroy(
        Request $request,
        UserCategoria $usuarioCategoria
    ) {
        $usuario = $request->user();

        if (
            $usuarioCategoria->user_id !==
            $usuario->id
        ) {
            return response()->json([
                'message' => 'Este vínculo não pertence ao usuário autenticado.'
            ], 404);
        }

        $usuarioCategoria->delete();

        return response()->noContent();
    }
}