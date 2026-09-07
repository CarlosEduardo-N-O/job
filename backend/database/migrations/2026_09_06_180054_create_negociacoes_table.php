<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negociacoes', function (Blueprint $table) {
            $table->id('id_negociacao');

            $table->foreignId('id_interessado')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('id_contratante')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('id_publicacao')
                ->constrained('publicacoes', 'id')
                ->restrictOnDelete();

            $table->foreignId('status_id')
                ->constrained('negociacao_status')
                ->restrictOnDelete();

            $table->decimal('valor_trabalho', 10, 2)
                ->nullable();

            $table->timestamps();

            /*
             * Impede que o mesmo interessado
             * tenha duas negociações na mesma publicação.
             */
            $table->unique([
                'id_publicacao',
                'id_interessado',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacoes');
    }
};