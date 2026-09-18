<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publicacao_status', function (Blueprint $table) {

            $table->id();

            $table->string('codigo', 30)
                ->unique();

            $table->string('nome', 100);

            $table->text('descricao')
                ->nullable();

            $table->boolean('ativo')
                ->default(true);

            $table->timestamps();
        });

        DB::table('publicacao_status')->insert([
            [
                'codigo' => 'ATIVO',
                'nome' => 'Ativo',
                'descricao' => 'Publicação disponível para receber novas negociações.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'ENCERRADO',
                'nome' => 'Encerrado',
                'descricao' => 'Publicação encerrada após a contratação de um prestador.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'CANCELADO',
                'nome' => 'Cancelado',
                'descricao' => 'Publicação cancelada pelo contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('publicacao_status');
    }
};