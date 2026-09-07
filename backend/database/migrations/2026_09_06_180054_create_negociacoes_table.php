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
                ->constrained('users', 'id')
                ->restrictOnDelete();

            $table->foreignId('id_contratante')
                ->constrained('users', 'id')
                ->restrictOnDelete();

            $table->foreignId('id_publicacao')
                ->constrained('publicacoes', 'id')
                ->restrictOnDelete();

            $table->string('status', 30);

            $table->decimal('valor_trabalho', 12, 2)
                ->nullable();

            $table->timestamps();

            $table->unique([
                'id_interessado',
                'id_publicacao',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacoes');
    }
};