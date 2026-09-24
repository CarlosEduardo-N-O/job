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
    |
    | Endpoint público.
    |
    | Usado no cadastro do usuário.
    | Não depende de usuário autenticado.
    |
    */

    #[OA\Get(
        path: '/api/categorias',
        summary: 'Lista todas as categorias disponíveis',
        tags: ['Categorias'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de categorias'
            )
        ]
    )]
    public function categorias()
    {
        $categorias = Categoria::orderBy('nome')
            ->get()
            ->map(function ($categoria) {
                return [
                    'id' => $categoria->id,
                    'nome' => $categoria->nome,
                    'descricao' => $categoria->descricao,
                ];
            });

        return response()->json([
            'data' => $categorias
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Lista categorias para o perfil
    |--------------------------------------------------------------------------
    |
    | Retorna TODAS as categorias disponíveis e informa quais estão
    | selecionadas pelo usuário autenticado.
    |
    | Esse endpoint é diferente do /api/categorias porque aqui temos
    | informações específicas do usuário:
    |
    | - selecionada
    | - vinculo_id
    |
    */

    #[OA\Get(
        path: '/api/users-categorias/categorias',
        summary: 'Lista categorias e informa as categorias do usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de categorias com situação do usuário'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function categoriasUsuario(Request $request)
    {
        $usuario = $request->user();

        /*
        | Busca os vínculos do usuário uma única vez.
        | keyBy permite localizar rapidamente pelo categoria_id.
        */
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
    |
    | Retorna somente os vínculos de categoria pertencentes ao usuário
    | autenticado.
    |
    */

    #[OA\Get(
        path: '/api/users-categorias',
        summary: 'Lista as categorias vinculadas ao usuário autenticado',
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
    |
    | A categoria sempre será vinculada ao usuário autenticado.
    |
    | IMPORTANTE:
    | Não recebemos user_id pelo request.
    |
    | Dessa forma, um usuário nunca consegue criar um vínculo
    | de categoria para outro usuário.
    |
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

        /*
        | Verifica se o usuário já possui essa categoria.
        */
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

        /*
        | Cria o vínculo usando SEMPRE o usuário autenticado.
        */
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
    |
    | O usuário só pode remover um vínculo pertencente ao próprio perfil.
    |
    */

    #[OA\Delete(
        path: '/api/users-categorias/{usuarioCategoria}',
        summary: 'Remove uma categoria do usuário autenticado',
        tags: ['Usuário-Categorias'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'usuarioCategoria',
                description: 'ID do vínculo usuário-categoria',
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
                description: 'Vínculo não encontrado ou não pertence ao usuário'
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

        /*
        | Garante que o usuário só possa excluir seus próprios vínculos.
        */
        if ($usuarioCategoria->user_id !== $usuario->id) {
            return response()->json([
                'message' => 'Este vínculo não pertence ao usuário autenticado.'
            ], 404);
        }

        $usuarioCategoria->delete();

        return response()->noContent();
    }
}