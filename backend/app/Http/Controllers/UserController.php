<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Cadastro público
    |--------------------------------------------------------------------------
    */

    #[OA\Post(
        path: '/api/users',
        summary: 'Cadastra um novo usuário',
        tags: ['Usuários'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: [
                    'name',
                    'email',
                    'password'
                ],
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'Carlos'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'carlos@email.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: '123456'
                    ),
                    new OA\Property(
                        property: 'telefone',
                        type: 'string',
                        example: '(47) 99999-9999'
                    ),
                    new OA\Property(
                        property: 'foto_url',
                        type: 'string',
                        example: 'https://site.com/foto.jpg'
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
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Usuário criado'
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
            'name' => [
                'required',
                'string',
                'max:255'
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email'
            ],

            'password' => [
                'required',
                'string',
                'min:6'
            ],

            'telefone' => [
                'nullable',
                'string',
                'max:30'
            ],

            'foto_url' => [
                'nullable',
                'string',
                'max:500'
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
        ]);

        $dados['password'] = Hash::make(
            $dados['password']
        );

        $dados['status'] = 'ativo';

        $usuario = User::create($dados);

        return response()->json([
            'message' => 'Usuário criado com sucesso.',
            'data' => $usuario
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | Meu cadastro
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/users',
        summary: 'Exibe os dados do usuário autenticado',
        tags: ['Usuários'],
        security: [
            ['sanctum' => []]
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados do usuário autenticado'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function show(Request $request)
    {
        $usuario = $request->user();

        return response()->json([
            'data' => $usuario
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Atualizar meu cadastro
    |--------------------------------------------------------------------------
    */

    #[OA\Put(
        path: '/api/users',
        summary: 'Atualiza os dados do usuário autenticado',
        tags: ['Usuários'],
        security: [
            ['sanctum' => []]
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'name',
                        type: 'string',
                        example: 'Carlos Eduardo'
                    ),
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'carlos@email.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: '123456'
                    ),
                    new OA\Property(
                        property: 'telefone',
                        type: 'string',
                        example: '(47) 99999-9999'
                    ),
                    
                    new OA\Property(
                        property: 'foto_url',
                        type: 'string',
                        example: 'https://site.com/foto.jpg'
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
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Usuário atualizado'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            )
        ]
    )]
    public function update(Request $request)
    {
        $usuario = $request->user();

        $dados = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255'
            ],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                'unique:users,email,' . $usuario->id
            ],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:6'
            ],

            'telefone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30'
            ],

            'foto_url' => [
                'sometimes',
                'nullable',
                'string',
                'max:500'
            ],

            'cidade' => [
                'sometimes',
                'nullable',
                'string',
                'max:100'
            ],

            'estado' => [
                'sometimes',
                'nullable',
                'string',
                'size:2'
            ],
        ]);

        if (
            isset($dados['password']) &&
            !empty($dados['password'])
        ) {
            $dados['password'] = Hash::make(
                $dados['password']
            );
        } else {
            unset($dados['password']);
        }

        $usuario->update($dados);

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'data' => $usuario->fresh()
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Excluir minha conta
    |--------------------------------------------------------------------------
    */

    #[OA\Delete(
        path: '/api/users',
        summary: 'Exclui a conta do usuário autenticado',
        tags: ['Usuários'],
        security: [
            ['sanctum' => []]
        ],
        responses: [
            new OA\Response(
                response: 204,
                description: 'Conta excluída'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function destroy(Request $request)
    {
        $usuario = $request->user();

        $token = $usuario->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        $usuario->delete();

        return response()->noContent();
    }
}