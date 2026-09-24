<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Executa a migration.
     */
    public function up(): void
    {
        Schema::create('trabalhos', function (Blueprint $table) {
            $table->id('id_trabalho');

            /*
             * Origem do trabalho.
             */
            $table->foreignId('id_publicacao')
                ->constrained(
                    'publicacoes',
                    'id'
                )
                ->restrictOnDelete();

            /*
             * Negociação que originou
             * o trabalho.
             */
            $table->foreignId('id_negociacao')
                ->constrained(
                    'negociacoes',
                    'id_negociacao'
                )
                ->restrictOnDelete()
                ->unique();

            /*
             * Usuário que criou a publicação
             * e realizou a contratação.
             */
            $table->foreignId('id_contratante')
                ->constrained(
                    'users',
                    'id'
                )
                ->restrictOnDelete();

            /*
             * Usuário que participou da negociação
             * e foi contratado.
             */
            $table->foreignId('id_contratado')
                ->constrained(
                    'users',
                    'id'
                )
                ->restrictOnDelete();

            /*
             * Status atual do trabalho.
             */
            $table->foreignId('status_id')
                ->constrained(
                    'trabalho_status',
                    'id'
                )
                ->restrictOnDelete();

            /*
             * Valor do serviço.
             *
             * É o valor que o contratado
             * recebe pelo trabalho.
             */
            $table->decimal(
                'valor_trabalho',
                12,
                2
            );

            /*
             * Valor da taxa de intermediação
             * cobrada pela JOB.
             */
            $table->decimal(
                'valor_taxa',
                12,
                2
            );

            /*
             * Valor total pago pelo contratante.
             *
             * valor_trabalho + valor_taxa
             */
            $table->decimal(
                'valor_total',
                12,
                2
            );

            /*
             * Datas que serão utilizadas
             * nas próximas etapas.
             */
            $table->timestamp(
                'data_inicio'
            )->nullable();

            $table->timestamp(
                'data_conclusao'
            )->nullable();

            $table->timestamps();

            /*
             * Índices para consultas
             * dos dois pontos de vista.
             */
            $table->index('id_publicacao');
            $table->index('id_contratante');
            $table->index('id_contratado');
            $table->index('status_id');
        });
    }

    /**
     * Reverte a migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('trabalhos');
    }
};