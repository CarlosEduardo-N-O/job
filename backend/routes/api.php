<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserCategoriaController;
use App\Http\Controllers\PublicacaoController;
use App\Http\Controllers\NegociacaoController;
use App\Http\Controllers\NegociacaoPagamentoController;

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
    | Publicações
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

    /*
    |--------------------------------------------------------------------------
    | Negociações
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/negociacoes/meus',
        [NegociacaoController::class, 'minhas']
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


    /*
|--------------------------------------------------------------------------
| Pagamentos
|--------------------------------------------------------------------------
*/

    Route::get(
        '/negociacoes/{negociacao}/pagamento',
        [NegociacaoPagamentoController::class, 'show']
    );

    Route::post(
        '/negociacoes/{negociacao}/pagamento/informar',
        [NegociacaoPagamentoController::class, 'informar']
    );

    Route::post(
        '/negociacoes/{negociacao}/pagamento/validar',
        [NegociacaoPagamentoController::class, 'validar']
    );

    Route::post(
        '/negociacoes/{negociacao}/pagamento/nao-validar',
        [NegociacaoPagamentoController::class, 'naoValidar']
    );
});
