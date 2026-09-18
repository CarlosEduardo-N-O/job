<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Executa a migration.
     */
    public function up(): void
    {
        Schema::create('trabalho_status', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 50)
                ->unique();

            $table->string('nome', 100);

            $table->text('descricao')
                ->nullable();

            $table->boolean('ativo')
                ->default(true);

            $table->timestamps();
        });

        /*
         * Status iniciais do trabalho.
         *
         * Alguns deles ainda serão utilizados
         * nas próximas etapas do projeto.
         */
        DB::table('trabalho_status')->insert([
            [
                'codigo' => 'PENDENTE',
                'nome' => 'Aguardando ser realizado',
                'descricao' => 'Trabalho criado e aguardando o contratado realizar a execução.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'AGUARDANDO_CONFIRMACAO',
                'nome' => 'Aguardando confirmação',
                'descricao' => 'O contratado informou que concluiu o trabalho e aguarda confirmação do contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'CONCLUIDO',
                'nome' => 'Concluído',
                'descricao' => 'O contratante confirmou que o trabalho foi realizado.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'EM_AVALIACAO',
                'nome' => 'Em avaliação',
                'descricao' => 'O contratante contestou a conclusão e a plataforma precisa avaliar o caso.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'DESISTENCIA',
                'nome' => 'Desistência',
                'descricao' => 'O contratado desistiu da execução do trabalho.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'ESTORNADO',
                'nome' => 'Estornado',
                'descricao' => 'O valor foi estornado para o contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'CANCELADO',
                'nome' => 'Cancelado',
                'descricao' => 'Trabalho cancelado pela plataforma.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverte a migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('trabalho_status');
    }
};