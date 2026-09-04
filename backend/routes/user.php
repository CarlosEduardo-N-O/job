<?php

use Illuminate\Support\Facades\Route;

Route::get('/teste', function () {
    return response()->json([
        'success' => true,
        'message' => 'USUARIOS',
        'version' => '1.0.0',
    ]);
});