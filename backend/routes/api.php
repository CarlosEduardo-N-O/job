<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserCategoriaController;
use App\Http\Controllers\PublicacaoController;
use App\Http\Controllers\NegociacaoController;
use App\Http\Controllers\NegociacaoPagamentoController;
use App\Http\Controllers\TrabalhoController;
use App\Http\Controllers\TrabalhoPagamentoController;
use App\Http\Controllers\PublicacaoAnexoController;
use App\Http\Controllers\OnboardingController;

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

// Lista categorias disponíveis
Route::get(
    '/categorias',
    [UserCategoriaController::class, 'categorias']
);

/*
|--------------------------------------------------------------------------
| Pagamento da negociação
|--------------------------------------------------------------------------
|
| Rota pública para simulação/confirmação do pagamento pela plataforma.
|
*/

Route::post(
    '/negociacoes/{negociacao}/pagamento/confirmar',
    [NegociacaoPagamentoController::class, 'confirmar']
);

/*
|--------------------------------------------------------------------------
| Trabalhos - Pagamentos
|--------------------------------------------------------------------------
*/

Route::get(
    '/trabalhos/{trabalho}/pagamento',
    [TrabalhoPagamentoController::class, 'show']
);

Route::post(
    '/trabalhos/{trabalho}/pagamento/confirmar',
    [TrabalhoPagamentoController::class, 'confirmar']
);

Route::post(
    '/trabalhos/{trabalho}/pagamento/recusar',
    [TrabalhoPagamentoController::class, 'recusar']
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

    // Lista todas as categorias e informa quais pertencem ao usuário
    Route::get(
        '/users-categorias/categorias',
        [UserCategoriaController::class, 'categoriasUsuario']
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

    Route::get(
        '/publicacoes/outras',
        [PublicacaoController::class, 'outras_publicacoes']
    );

    Route::apiResource(
        'publicacoes',
        PublicacaoController::class
    )->parameters([
        'publicacoes' => 'publicacao',
    ]);

    // Inicia uma negociação a partir de uma publicação
    Route::post(
        '/publicacoes/{publicacao}/interacoes',
        [NegociacaoController::class, 'store']
    );


    /*
    |--------------------------------------------------------------------------
    | Anexos das Publicações
    |--------------------------------------------------------------------------
    */


    Route::get(
        '/publicacoes/{publicacao}/anexos',
        [PublicacaoAnexoController::class, 'index']
    );

    Route::post(
        '/publicacoes/{publicacao}/anexos',
        [PublicacaoAnexoController::class, 'store']
    );

    Route::get(
        '/publicacoes/{publicacao}/anexos/{anexo}',
        [PublicacaoAnexoController::class, 'show']
    );

    Route::delete(
        '/publicacoes/{publicacao}/anexos/{anexo}',
        [PublicacaoAnexoController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Negociações
    |--------------------------------------------------------------------------
    */

    // Negociações do usuário logado
    Route::get(
        '/negociacoes/meus',
        [NegociacaoController::class, 'minhas']
    );

    // Lista negociações
    Route::get(
        '/negociacoes',
        [NegociacaoController::class, 'index']
    );

    // Visualiza uma negociação
    Route::get(
        '/negociacoes/{negociacao}',
        [NegociacaoController::class, 'show']
    );

    // Envia interação na negociação
    Route::post(
        '/negociacoes/{negociacao}/interacoes',
        [NegociacaoController::class, 'interagir']
    );

    // Aceita negociação
    Route::post(
        '/negociacoes/{negociacao}/aceitar',
        [NegociacaoController::class, 'aceitar']
    );

    // Recusa negociação
    Route::post(
        '/negociacoes/{negociacao}/recusar',
        [NegociacaoController::class, 'recusar']
    );

    /*
    |--------------------------------------------------------------------------
    | Pagamento da negociação
    |--------------------------------------------------------------------------
    */

    /*
     * Contratante informa que realizou o pagamento.
     *
     * Esta rota PRECISA estar protegida pelo Sanctum,
     * pois o controller verifica o usuário logado.
     */
    Route::post(
        '/negociacoes/{negociacao}/pagamento/informar',
        [NegociacaoPagamentoController::class, 'informar']
    );


    /*
    |--------------------------------------------------------------------------
    | Trabalhos
    |--------------------------------------------------------------------------
    |
    | Existem somente três operações:
    |
    | 1. Trabalhos que o usuário contratou
    | 2. Trabalhos em que o usuário foi contratado
    | 3. Interações do trabalho
    |
    */

    // Trabalhos contratados pelo usuário
    Route::get(
        '/trabalhos/contratacoes',
        [TrabalhoController::class, 'contratacoes']
    );

    // Trabalhos em que o usuário foi contratado
    Route::get(
        '/trabalhos/meus',
        [TrabalhoController::class, 'meus']
    );

    // Interage com um trabalho
    Route::post(
        '/trabalhos/{trabalho}/interacoes',
        [TrabalhoController::class, 'interagir']
    );

    /*
    |--------------------------------------------------------------------------
    | Onboarding
    |--------------------------------------------------------------------------
    */

    Route::get('/onboarding', [
        OnboardingController::class,
        'show'
    ]);

    Route::post('/onboarding/concluir', [
        OnboardingController::class,
        'concluir'
    ]);
});
