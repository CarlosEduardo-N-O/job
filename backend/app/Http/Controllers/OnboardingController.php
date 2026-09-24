<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class OnboardingController extends Controller
{
    #[OA\Get(
        path: '/api/onboarding',
        summary: 'Consultar primeiro acesso',
        description: 'Retorna se o usuário autenticado ainda está no primeiro acesso.',
        security: [
            ['sanctum' => []]
        ],
        tags: ['Onboarding'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Estado do primeiro acesso retornado'
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
            'primeiro_acesso' => $usuario->primeiro_acesso === 'S',
            'codigo' => $usuario->primeiro_acesso,
        ]);
    }

    #[OA\Post(
        path: '/api/onboarding/concluir',
        summary: 'Concluir onboarding',
        description: 'Marca o primeiro acesso do usuário como concluído.',
        security: [
            ['sanctum' => []]
        ],
        tags: ['Onboarding'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Onboarding concluído'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function concluir(Request $request)
    {
        $usuario = $request->user();

        $usuario->update([
            'primeiro_acesso' => 'N',
        ]);

        return response()->json([
            'message' => 'Onboarding concluído com sucesso.',
            'primeiro_acesso' => false,
            'codigo' => 'N',
        ]);
    }
}