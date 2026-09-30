<?php

namespace App\Http\Controllers;

use App\Models\Notificacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NotificacaoController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LISTAR NOTIFICAÇÕES
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/notificacoes',
        summary: 'Lista as notificações do usuário autenticado',
        description: 'Retorna somente as notificações pertencentes ao usuário autenticado, ordenadas da mais recente para a mais antiga.',
        tags: ['Notificações'],
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
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notificações retornadas com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $notificacoes = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notificacoes,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LISTAR NÃO LIDAS
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/notificacoes/nao-lidas',
        summary: 'Lista as notificações não lidas',
        description: 'Retorna somente as notificações não lidas pertencentes ao usuário autenticado.',
        tags: ['Notificações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notificações não lidas retornadas com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function naoLidas(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $notificacoes = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->where('lida', false)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notificacoes,
            'total' => $notificacoes->count(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CONTADOR
    |--------------------------------------------------------------------------
    */

    #[OA\Get(
        path: '/api/notificacoes/contador',
        summary: 'Consulta o contador de notificações não lidas',
        description: 'Retorna a quantidade de notificações não lidas pertencentes ao usuário autenticado.',
        tags: ['Notificações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Contador retornado com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function contador(Request $request): JsonResponse
    {
        $usuario = $request->user();

        $total = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->where('lida', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | MARCAR UMA NOTIFICAÇÃO COMO LIDA
    |--------------------------------------------------------------------------
    */

    #[OA\Patch(
        path: '/api/notificacoes/{notificacao}/ler',
        summary: 'Marca uma notificação como lida',
        description: 'Marca como lida uma notificação pertencente ao usuário autenticado. Uma notificação de outro usuário não pode ser acessada.',
        tags: ['Notificações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'notificacao',
                description: 'ID da notificação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1
                ),
                example: 1
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notificação marcada como lida'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 404,
                description: 'Notificação não encontrada'
            )
        ]
    )]
    public function marcarComoLida(
        Request $request,
        int $notificacao
    ): JsonResponse {
        $usuario = $request->user();

        /*
         * IMPORTANTE:
         *
         * A busca é feita pelo ID da notificação
         * E pelo ID do usuário autenticado.
         *
         * Dessa forma, um usuário nunca consegue
         * marcar como lida uma notificação de outro usuário.
         */
        $registro = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->findOrFail($notificacao);

        $registro->update([
            'lida' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notificação marcada como lida.',
            'data' => $registro->fresh(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | MARCAR TODAS COMO LIDAS
    |--------------------------------------------------------------------------
    */

    #[OA\Patch(
        path: '/api/notificacoes/ler-todas',
        summary: 'Marca todas as notificações como lidas',
        description: 'Marca como lidas todas as notificações não lidas pertencentes ao usuário autenticado.',
        tags: ['Notificações'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notificações marcadas como lidas'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            )
        ]
    )]
    public function marcarTodasComoLidas(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        $total = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->where('lida', false)
            ->update([
                'lida' => true,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Notificações marcadas como lidas.',
            'data' => [
                'total' => $total,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | EXCLUIR NOTIFICAÇÃO
    |--------------------------------------------------------------------------
    */

    #[OA\Delete(
        path: '/api/notificacoes/{notificacao}',
        summary: 'Exclui uma notificação',
        description: 'Exclui uma notificação pertencente ao usuário autenticado. Um usuário não pode excluir notificações de outro usuário.',
        tags: ['Notificações'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'notificacao',
                description: 'ID da notificação',
                in: 'path',
                required: true,
                schema: new OA\Schema(
                    type: 'integer',
                    minimum: 1
                ),
                example: 1
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notificação excluída com sucesso'
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 404,
                description: 'Notificação não encontrada'
            )
        ]
    )]
    public function destroy(
        Request $request,
        int $notificacao
    ): JsonResponse {
        $usuario = $request->user();

        /*
         * A notificação é localizada dentro do conjunto
         * pertencente ao usuário autenticado.
         */
        $registro = Notificacao::query()
            ->where('user_id', $usuario->id)
            ->findOrFail($notificacao);

        $registro->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notificação excluída.',
        ]);
    }
}