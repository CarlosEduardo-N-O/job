<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\UserCategoriaController;


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
    | Categorias
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'categorias',
        CategoriaController::class
    );


    /*
    |--------------------------------------------------------------------------
    | Usuário x Categoria
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'users-categorias',
        UserCategoriaController::class
    );
});