<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserCategoriaController;
use App\Http\Controllers\PublicacaoController;
use App\Http\Controllers\NegociacaoController;


/*
|--------------------------------------------------------------------------
| Rotas públicas
|--------------------------------------------------------------------------
*/

// Login
Route::post(
    '/login',
    [AuthController::class, 'login']
)->name('login');

// Cadastro
Route::post(
    '/users',
    [UserController::class, 'store']
);


/*
|--------------------------------------------------------------------------
| Rotas protegidas pelo Sanctum
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Autenticação
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/logon',
        [AuthController::class, 'logon']
    );

    Route::post(
        '/logout',
        [AuthController::class, 'logout']
    );


    /*
    |--------------------------------------------------------------------------
    | Meu usuário
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/users',
        [UserController::class, 'show']
    );

    Route::put(
        '/users',
        [UserController::class, 'update']
    );

    Route::delete(
        '/users',
        [UserController::class, 'destroy']
    );


    /*
    |--------------------------------------------------------------------------
    | Usuário x Categoria
    |--------------------------------------------------------------------------
    */

    // Lista todas as categorias e informa
    // quais pertencem ao usuário logado
    Route::get(
        '/users-categorias/categorias',
        [UserCategoriaController::class, 'categorias']
    );

    // Lista os vínculos do usuário logado
    Route::get(
        '/users-categorias',
        [UserCategoriaController::class, 'index']
    );

    // Cria um vínculo para o usuário logado
    Route::post(
        '/users-categorias',
        [UserCategoriaController::class, 'store']
    );

    // Remove um vínculo do usuário logado
    Route::delete(
        '/users-categorias/{usuarioCategoria}',
        [UserCategoriaController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Usuário x Categoria
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/publicacoes/minhas_publicacoes',
        [PublicacaoController::class, 'minhas_publicacoes']
    );

    Route::apiResource(
        'publicacoes',
        PublicacaoController::class
    )->parameters([
        'publicacoes' => 'publicacao',
    ]);

    Route::post(
        '/publicacoes/{publicacao}/interacoes',
        [NegociacaoController::class, 'store']
    );

    Route::get(
        '/negociacoes',
        [NegociacaoController::class, 'index']
    );

    Route::get(
        '/negociacoes/{negociacao}',
        [NegociacaoController::class, 'show']
    );

    Route::post(
        '/negociacoes/{negociacao}/interacoes',
        [NegociacaoController::class, 'interagir']
    );

    Route::post(
        '/negociacoes/{negociacao}/aceitar',
        [NegociacaoController::class, 'aceitar']
    );

    Route::post(
        '/negociacoes/{negociacao}/recusar',
        [NegociacaoController::class, 'recusar']
    );
});
