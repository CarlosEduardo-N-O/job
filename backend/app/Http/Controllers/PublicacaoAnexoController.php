<?php

namespace App\Http\Controllers;

use App\Models\Publicacao;
use App\Models\PublicacaoAnexo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use Symfony\Component\HttpFoundation\Response;

class PublicacaoAnexoController extends Controller
{
    /**
     * Lista os anexos de uma publicação.
     */
    #[OA\Get(
        path: '/api/publicacoes/{publicacao}/anexos',
        summary: 'Lista os anexos de uma publicação',
        description: 'Retorna todos os anexos vinculados a uma publicação, independentemente do status.',
        tags: ['Publicação - Anexos'],
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
        responses: [
            new OA\Response(
                response: 200,
                description: 'Anexos carregados com sucesso',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'message',
                            type: 'string',
                            example: 'Anexos da publicação carregados com sucesso.'
                        ),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(
                                        property: 'id',
                                        type: 'integer',
                                        example: 1
                                    ),
                                    new OA\Property(
                                        property: 'publicacao_id',
                                        type: 'integer',
                                        example: 1
                                    ),
                                    new OA\Property(
                                        property: 'nome_original',
                                        type: 'string',
                                        example: 'foto-servico.jpg'
                                    ),
                                    new OA\Property(
                                        property: 'mime_type',
                                        type: 'string',
                                        example: 'image/jpeg'
                                    ),
                                    new OA\Property(
                                        property: 'tipo',
                                        type: 'string',
                                        example: 'imagem'
                                    ),
                                    new OA\Property(
                                        property: 'tamanho',
                                        type: 'integer',
                                        format: 'int64',
                                        example: 524288
                                    ),
                                    new OA\Property(
                                        property: 'ordem',
                                        type: 'integer',
                                        example: 0
                                    ),
                                    new OA\Property(
                                        property: 'created_at',
                                        type: 'string',
                                        format: 'date-time',
                                        example: '2026-09-23T18:30:00Z'
                                    ),
                                    new OA\Property(
                                        property: 'updated_at',
                                        type: 'string',
                                        format: 'date-time',
                                        example: '2026-09-23T18:30:00Z'
                                    ),
                                ],
                                type: 'object'
                            )
                        )
                    ],
                    type: 'object'
                )
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
    public function index(Publicacao $publicacao): JsonResponse
    {
        $anexos = $publicacao->anexos()
            ->get()
            ->makeHidden([
                'nome_arquivo',
                'caminho',
            ]);

        return response()->json([
            'message' => 'Anexos da publicação carregados com sucesso.',
            'data' => $anexos,
        ]);
    }

    /**
     * Adiciona um anexo à publicação.
     */
    #[OA\Post(
        path: '/api/publicacoes/{publicacao}/anexos',
        summary: 'Adiciona um anexo à publicação',
        description: 'Envia uma imagem, vídeo ou arquivo PDF para uma publicação. Apenas o proprietário pode adicionar anexos. Publicações encerradas não podem receber novos anexos. Cada publicação pode possuir no máximo 10 anexos. O tamanho máximo de cada arquivo é 100 MB.',
        tags: ['Publicação - Anexos'],
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
            description: 'Arquivo que será anexado à publicação.',
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['arquivo'],
                    properties: [
                        new OA\Property(
                            property: 'arquivo',
                            description: 'Imagem, vídeo ou arquivo PDF. Formatos permitidos: JPG, JPEG, PNG, WEBP, MP4, WEBM e PDF. Máximo de 100 MB.',
                            type: 'string',
                            format: 'binary'
                        )
                    ],
                    type: 'object'
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Anexo adicionado com sucesso',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'message',
                            type: 'string',
                            example: 'Anexo adicionado com sucesso.'
                        ),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(
                                    property: 'id',
                                    type: 'integer',
                                    example: 1
                                ),
                                new OA\Property(
                                    property: 'publicacao_id',
                                    type: 'integer',
                                    example: 1
                                ),
                                new OA\Property(
                                    property: 'nome_original',
                                    type: 'string',
                                    example: 'foto-servico.jpg'
                                ),
                                new OA\Property(
                                    property: 'mime_type',
                                    type: 'string',
                                    example: 'image/jpeg'
                                ),
                                new OA\Property(
                                    property: 'tipo',
                                    type: 'string',
                                    example: 'imagem'
                                ),
                                new OA\Property(
                                    property: 'tamanho',
                                    type: 'integer',
                                    format: 'int64',
                                    example: 524288
                                ),
                                new OA\Property(
                                    property: 'ordem',
                                    type: 'integer',
                                    example: 0
                                ),
                            ],
                            type: 'object'
                        )
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não possui permissão para adicionar anexos'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação não encontrada'
            ),
            new OA\Response(
                response: 422,
                description: 'Publicação encerrada, arquivo inválido ou limite de anexos atingido'
            )
        ]
    )]
    public function store(
        Request $request,
        Publicacao $publicacao
    ): JsonResponse {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não autenticado.',
            ], 401);
        }

        /*
         * Apenas o contratante/dono da publicação
         * pode adicionar anexos.
         */
        if ((int) $publicacao->contratante_id !== (int) $usuario->id) {
            return response()->json([
                'message' => 'Você não tem permissão para adicionar anexos a esta publicação.',
            ], 403);
        }

        /*
         * Publicações encerradas não podem mais
         * sofrer alterações nos anexos.
         */
        $publicacao->loadMissing('status');

        if ($publicacao->status?->codigo === 'ENCERRADO') {
            return response()->json([
                'message' =>
                    'Esta publicação está encerrada e seus anexos não podem mais ser alterados.'
            ], 422);
        }

        /*
         * Limite máximo de 10 anexos por publicação.
         */
        $quantidadeAtual = $publicacao->anexos()->count();

        if ($quantidadeAtual >= 10) {
            throw ValidationException::withMessages([
                'arquivo' => [
                    'A publicação já possui o limite máximo de 10 anexos.',
                ],
            ]);
        }

        $request->validate([
            'arquivo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,mp4,webm,pdf',
                'max:102400',
            ],
        ], [
            'arquivo.required' => 'É necessário selecionar um arquivo.',
            'arquivo.file' => 'O arquivo enviado é inválido.',
            'arquivo.mimes' => 'O arquivo deve ser JPG, JPEG, PNG, WEBP, MP4, WEBM ou PDF.',
            'arquivo.max' => 'O arquivo não pode ultrapassar 100 MB.',
        ]);

        $arquivo = $request->file('arquivo');

        /*
         * Identifica o tipo real do arquivo através do MIME type.
         */
        $mimeType = $arquivo->getMimeType();

        $tipo = match (true) {
            str_starts_with($mimeType, 'image/') => 'imagem',
            str_starts_with($mimeType, 'video/') => 'video',
            $mimeType === 'application/pdf' => 'pdf',
            default => null,
        };

        if (!$tipo) {
            throw ValidationException::withMessages([
                'arquivo' => [
                    'Tipo de arquivo não permitido.',
                ],
            ]);
        }

        /*
         * Define a ordem do novo anexo.
         */
        $ordem = ($publicacao->anexos()->max('ordem') ?? -1) + 1;

        $nomeOriginal = $arquivo->getClientOriginalName();

        /*
         * Gera um nome físico único.
         */
        $nomeArquivo = uniqid('', true)
            . '.'
            . $arquivo->getClientOriginalExtension();

        /*
         * Arquivos ficam privados em:
         *
         * storage/app/private/publicacoes/{id}
         */
        $diretorio = "publicacoes/{$publicacao->id}";

        $caminho = $arquivo->storeAs(
            $diretorio,
            $nomeArquivo,
            'local'
        );

        try {
            $anexo = $publicacao->anexos()->create([
                'nome_original' => $nomeOriginal,
                'nome_arquivo' => $nomeArquivo,
                'caminho' => $caminho,
                'mime_type' => $mimeType,
                'tipo' => $tipo,
                'tamanho' => $arquivo->getSize(),
                'ordem' => $ordem,
            ]);
        } catch (\Throwable $e) {
            /*
             * Se o registro no banco falhar,
             * remove o arquivo físico.
             */
            Storage::disk('local')->delete($caminho);

            throw $e;
        }

        /*
         * Não devolvemos caminho físico do servidor.
         */
        $anexo->makeHidden([
            'nome_arquivo',
            'caminho',
        ]);

        return response()->json([
            'message' => 'Anexo adicionado com sucesso.',
            'data' => $anexo,
        ], 201);
    }

    /**
     * Visualiza um anexo de forma autenticada.
     */
    #[OA\Get(
        path: '/api/publicacoes/{publicacao}/anexos/{anexo}',
        summary: 'Visualiza um anexo',
        description: 'Retorna o arquivo diretamente para o navegador. Imagens, PDFs e vídeos podem ser visualizados de acordo com o suporte do navegador.',
        tags: ['Publicação - Anexos'],
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
            ),
            new OA\Parameter(
                name: 'anexo',
                description: 'ID do anexo',
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
                description: 'Arquivo retornado com sucesso',
                content: [
                    new OA\MediaType(
                        mediaType: 'image/jpeg',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    ),
                    new OA\MediaType(
                        mediaType: 'image/png',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    ),
                    new OA\MediaType(
                        mediaType: 'image/webp',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    ),
                    new OA\MediaType(
                        mediaType: 'application/pdf',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    ),
                    new OA\MediaType(
                        mediaType: 'video/mp4',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    ),
                    new OA\MediaType(
                        mediaType: 'video/webm',
                        schema: new OA\Schema(
                            type: 'string',
                            format: 'binary'
                        )
                    )
                ]
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação, anexo ou arquivo não encontrado'
            )
        ]
    )]
    public function show(
        Request $request,
        Publicacao $publicacao,
        PublicacaoAnexo $anexo
    ): Response {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não autenticado.',
            ], 401);
        }

        /*
         * Garante que o anexo pertence à publicação
         * informada na URL.
         */
        if ((int) $anexo->publicacao_id !== (int) $publicacao->id) {
            return response()->json([
                'message' => 'O anexo informado não pertence a esta publicação.',
            ], 404);
        }

        /*
         * Verifica se o arquivo realmente existe.
         */
        if (!Storage::disk('local')->exists($anexo->caminho)) {
            return response()->json([
                'message' => 'Arquivo não encontrado no armazenamento.',
            ], 404);
        }

        $caminhoCompleto = Storage::disk('local')
            ->path($anexo->caminho);

        /*
         * Retorna o arquivo diretamente para o navegador.
         */
        return response()->file(
            $caminhoCompleto,
            [
                'Content-Type' => $anexo->mime_type,
                'Content-Disposition' => 'inline; filename="' .
                    addslashes($anexo->nome_original) .
                    '"',
            ]
        );
    }

    /**
     * Remove um anexo da publicação.
     */
    #[OA\Delete(
        path: '/api/publicacoes/{publicacao}/anexos/{anexo}',
        summary: 'Remove um anexo da publicação',
        description: 'Remove o anexo do banco de dados e também o arquivo físico do armazenamento privado. Publicações encerradas não podem ter seus anexos removidos.',
        tags: ['Publicação - Anexos'],
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
            ),
            new OA\Parameter(
                name: 'anexo',
                description: 'ID do anexo',
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
                description: 'Anexo removido com sucesso',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: 'message',
                            type: 'string',
                            example: 'Anexo removido com sucesso.'
                        )
                    ],
                    type: 'object'
                )
            ),
            new OA\Response(
                response: 401,
                description: 'Não autenticado'
            ),
            new OA\Response(
                response: 403,
                description: 'Usuário não possui permissão para remover o anexo'
            ),
            new OA\Response(
                response: 404,
                description: 'Publicação ou anexo não encontrado'
            ),
            new OA\Response(
                response: 422,
                description: 'Publicação encerrada e anexo não pode ser removido'
            )
        ]
    )]
    public function destroy(
        Request $request,
        Publicacao $publicacao,
        PublicacaoAnexo $anexo
    ): JsonResponse {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'message' => 'Usuário não autenticado.',
            ], 401);
        }

        /*
         * Apenas o dono da publicação pode remover anexos.
         */
        if ((int) $publicacao->contratante_id !== (int) $usuario->id) {
            return response()->json([
                'message' => 'Você não tem permissão para remover anexos desta publicação.',
            ], 403);
        }

        /*
         * Garante que o anexo pertence à publicação.
         */
        if ((int) $anexo->publicacao_id !== (int) $publicacao->id) {
            return response()->json([
                'message' => 'O anexo informado não pertence a esta publicação.',
            ], 404);
        }

        /*
         * Publicações encerradas não podem mais
         * sofrer alterações nos anexos.
         */
        $publicacao->loadMissing('status');

        if ($publicacao->status?->codigo === 'ENCERRADO') {
            return response()->json([
                'message' =>
                    'Esta publicação está encerrada e seus anexos não podem mais ser alterados.'
            ], 422);
        }

        /*
         * Remove o arquivo físico.
         */
        Storage::disk('local')->delete($anexo->caminho);

        /*
         * Remove o registro do banco.
         */
        $anexo->delete();

        return response()->json([
            'message' => 'Anexo removido com sucesso.',
        ]);
    }
}