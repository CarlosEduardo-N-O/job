<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negociacao_interacoes', function (Blueprint $table) {
            $table->id('id_negociacao_interacao');

            $table->foreignId('id_interacao')
                ->constrained(
                    'interacoes',
                    'id_interacao'
                )
                ->cascadeOnDelete();

            $table->foreignId('id_negociacao')
                ->constrained(
                    'negociacoes',
                    'id_negociacao'
                )
                ->cascadeOnDelete();

            $table->foreignId('id_interessado')
                ->constrained('users', 'id')
                ->restrictOnDelete();

            $table->foreignId('id_contratante')
                ->constrained('users', 'id')
                ->restrictOnDelete();

            $table->foreignId('id_publicacao')
                ->constrained('publicacoes', 'id')
                ->restrictOnDelete();

            $table->timestamps();

            $table->unique([
                'id_interacao',
                'id_negociacao',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacao_interacoes');
    }
};