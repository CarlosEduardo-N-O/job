<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/login',
        summary: 'Realiza login do usuário',
        tags: ['Autenticação'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(
                        property: 'email',
                        type: 'string',
                        format: 'email',
                        example: 'teste@job.com'
                    ),
                    new OA\Property(
                        property: 'password',
                        type: 'string',
                        format: 'password',
                        example: '123456'
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login realizado com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'E-mail ou senha inválidos'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário inativo'
            ),
            new OA\Response(
                response: 422,
                description: 'Dados inválidos'
            )
        ]
    )]
    public function login(Request $request)
    {
        $dados = $request->validate([
            'email' => [
                'required',
                'email'
            ],
            'password' => [
                'required',
                'string'
            ],
        ]);

        $usuario = User::where(
            'email',
            $dados['email']
        )->first();

        if (
            !$usuario ||
            !Hash::check(
                $dados['password'],
                $usuario->password
            )
        ) {
            return response()->json([
                'message' => 'E-mail ou senha inválidos.'
            ], 401);
        }

        if ($usuario->status !== 'ativo') {
            return response()->json([
                'message' => 'Usuário inativo.'
            ], 403);
        }

        $token = $usuario->createToken(
            'job-app'
        )->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            'token_type' => 'Bearer',
            'data' => $usuario
        ], 200);
    }


    #[OA\Post(
        path: '/api/logout',
        summary: 'Realiza logout do usuário',
        tags: ['Autenticação'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Logout realizado com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function logout(Request $request)
    {
        $usuario = $request->user();

        $token = $usuario->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.'
        ]);
    }


    #[OA\Get(
        path: '/api/logon',
        summary: 'Retorna o usuário autenticado',
        tags: ['Autenticação'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Usuário autenticado'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function logon(Request $request)
    {
        return response()->json([
            'data' => $request->user()
        ]);
    }
}