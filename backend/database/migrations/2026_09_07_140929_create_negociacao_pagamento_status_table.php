<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negociacao_pagamento_status', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 50)->unique();

            $table->string('nome', 100);

            $table->string('descricao', 255)->nullable();

            $table->boolean('ativo')->default(true);

            $table->timestamps();
        });

        DB::table('negociacao_pagamento_status')->insert([
            [
                'codigo' => 'AGUARDANDO_PAGAMENTO',
                'nome' => 'Aguardando pagamento',
                'descricao' => 'Aguardando o contratante informar que realizou o pagamento.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'AGUARDANDO_PROCESSAMENTO',
                'nome' => 'Aguardando processamento',
                'descricao' => 'O contratante informou que realizou o pagamento e a plataforma deve identificar e processar o pagamento.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'VALIDADA',
                'nome' => 'Validada',
                'descricao' => 'Pagamento identificado e validado pela plataforma.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'NAO_VALIDADA',
                'nome' => 'Não validada',
                'descricao' => 'O contratante informou que realizou o pagamento, mas o pagamento não foi identificado.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacao_pagamento_status');
    }
};