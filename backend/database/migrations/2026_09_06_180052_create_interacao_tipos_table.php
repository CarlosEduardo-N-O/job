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
            $table->string('tipo', 30)->unique();
        });

        DB::table('interacao_tipos')->insert([
            [
                'id_interacao_tipo' => 1,
                'tipo' => 'INTERESSE',
            ],
            [
                'id_interacao_tipo' => 2,
                'tipo' => 'PROPOSTA',
            ],
            [
                'id_interacao_tipo' => 3,
                'tipo' => 'DUVIDA',
            ],
            [
                'id_interacao_tipo' => 4,
                'tipo' => 'ACEITE',
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('interacao_tipos');
    }
};