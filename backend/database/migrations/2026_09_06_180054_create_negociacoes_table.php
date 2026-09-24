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

            /*
             * Valor que o prestador receberá pelo serviço.
             */
            $table->decimal('valor_trabalho', 10, 2)
                ->nullable();

            /*
             * Percentual da taxa de intermediação aplicado
             * no momento da negociação.
             *
             * Exemplo: 12.00 = 12%
             */
            $table->decimal('taxa_percentual', 5, 2)
                ->nullable();

            /*
             * Valor monetário da taxa de intermediação.
             *
             * Exemplo:
             * valor_trabalho = 500.00
             * taxa_percentual = 12.00
             * valor_taxa = 60.00
             */
            $table->decimal('valor_taxa', 10, 2)
                ->nullable();

            /*
             * Valor total que será cobrado do contratante.
             *
             * Exemplo:
             * valor_trabalho = 500.00
             * valor_taxa = 60.00
             * valor_total = 560.00
             */
            $table->decimal('valor_total', 10, 2)
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