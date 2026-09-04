<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use OpenApi\Attributes as OA;

class CategoriaController extends Controller
{
    #[OA\Get(
        path: '/api/categorias',
        summary: 'Lista todas as categorias',
        tags: ['Categorias'],
        security: [['sanctum' => []]],
        responses: [new OA\Response(response: 200, description: 'Lista de categorias')]
    )]
    public function index()
    {
        $categorias = Categoria::orderBy('nome')->get();

        return response()->json(['data' => $categorias]);
    }


    #[OA\Get(
        path: '/api/categorias/{categoria}',
        summary: 'Exibe uma categoria',
        tags: ['Categorias'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'categoria',
                description: 'ID da categoria',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer'),
                example: 1
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Categoria encontrada'),
            new OA\Response(response: 404, description: 'Categoria não encontrada'),
        ]
    )]
    public function show(Categoria $categoria)
    {
        return response()->json(['data' => $categoria]);
    }
}