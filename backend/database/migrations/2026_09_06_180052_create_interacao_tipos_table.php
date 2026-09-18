<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interacao_tipos', function (Blueprint $table) {

            $table->id('id_interacao_tipo');

            /*
             * Identifica em qual fluxo o tipo pode ser utilizado.
             *
             * NEGOCIACAO = interações da negociação
             * TRABALHO   = interações do trabalho
             */
            $table->string('contexto', 20);

            /*
             * Nome do tipo da interação.
             */
            $table->string('tipo', 50);

            /*
             * O mesmo tipo não pode existir duas vezes
             * dentro do mesmo contexto.
             */
            $table->unique([
                'contexto',
                'tipo',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Interações de NEGOCIAÇÃO
        |--------------------------------------------------------------------------
        */

        DB::table('interacao_tipos')->insert([

            [
                'id_interacao_tipo' => 1,
                'contexto' => 'NEGOCIACAO',
                'tipo' => 'INTERESSE',
            ],

            [
                'id_interacao_tipo' => 2,
                'contexto' => 'NEGOCIACAO',
                'tipo' => 'PROPOSTA',
            ],

            [
                'id_interacao_tipo' => 3,
                'contexto' => 'NEGOCIACAO',
                'tipo' => 'DUVIDA',
            ],

            [
                'id_interacao_tipo' => 4,
                'contexto' => 'NEGOCIACAO',
                'tipo' => 'RESPOSTA',
            ],

            [
                'id_interacao_tipo' => 5,
                'contexto' => 'NEGOCIACAO',
                'tipo' => 'ACEITE',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Interações de TRABALHO
        |--------------------------------------------------------------------------
        */

        DB::table('interacao_tipos')->insert([

            [
                'id_interacao_tipo' => 6,
                'contexto' => 'TRABALHO',
                'tipo' => 'SERVICO_CONCLUIDO',
            ],

            [
                'id_interacao_tipo' => 7,
                'contexto' => 'TRABALHO',
                'tipo' => 'SERVICO_CONFIRMADO',
            ],

            [
                'id_interacao_tipo' => 8,
                'contexto' => 'TRABALHO',
                'tipo' => 'SERVICO_CONTESTADO',
            ],

            [
                'id_interacao_tipo' => 9,
                'contexto' => 'TRABALHO',
                'tipo' => 'DESISTENCIA_CONTRATADO',
            ],

            [
                'id_interacao_tipo' => 10,
                'contexto' => 'TRABALHO',
                'tipo' => 'DESISTENCIA_CONTRATANTE',
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('interacao_tipos');
    }
};