<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publicacao_anexos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('publicacao_id')
                ->constrained('publicacoes')
                ->cascadeOnDelete();

            $table->string('nome_original');

            $table->string('nome_arquivo');

            $table->string('caminho');

            $table->string('mime_type');

            $table->string('tipo', 20);

            $table->unsignedBigInteger('tamanho');

            $table->unsignedInteger('ordem')
                ->default(0);

            $table->timestamps();

            $table->index(['publicacao_id', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publicacao_anexos');
    }
};