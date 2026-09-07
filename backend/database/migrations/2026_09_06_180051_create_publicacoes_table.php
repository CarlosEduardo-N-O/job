<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publicacoes', function (Blueprint $table) {

            $table->id();

            // Usuário que criou a publicação
            $table->foreignId('contratante_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Categoria do serviço
            $table->foreignId('categoria_id')
                ->constrained('categorias')
                ->restrictOnDelete();

            $table->string('titulo', 200);

            $table->text('descricao');

            // Valor estimado pelo contratante
            $table->decimal('valor_estimado', 10, 2)
                ->nullable();

            // Localização geral
            $table->string('cidade', 100)
                ->nullable();

            $table->char('estado', 2)
                ->nullable();

            // Endereço do serviço
            $table->string('endereco_servico', 500)
                ->nullable();

            // Data desejada
            $table->date('data_inicio')
                ->nullable();

            // Horário ou período desejado
            $table->string('horario_inicio', 50)
                ->nullable();

            // Data limite, se houver
            $table->date('data_fim')
                ->nullable();

            /*
             * ATIVO
             * ENCERRADO
             * CANCELADO
             */
            $table->string('status', 30)
                ->default('ATIVO');

            $table->timestamps();

            $table->index('contratante_id');
            $table->index('categoria_id');
            $table->index('status');
            $table->index(['categoria_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publicacoes');
    }
};