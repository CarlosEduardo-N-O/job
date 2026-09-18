<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trabalho_interacoes', function (Blueprint $table) {
            $table->id('id_trabalho_interacao');

            $table->foreignId('id_trabalho')
                ->constrained(
                    'trabalhos',
                    'id_trabalho'
                )
                ->restrictOnDelete();

            $table->foreignId('id_interacao')
                ->constrained(
                    'interacoes',
                    'id_interacao'
                )
                ->restrictOnDelete()
                ->unique();

            $table->timestamps();

            $table->index('id_trabalho');
            $table->index('id_interacao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trabalho_interacoes');
    }
};