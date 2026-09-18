<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trabalho_pagamento_status', function (Blueprint $table) {
            $table->id('id_trabalho_pagamento_status');

            $table->string('codigo', 50)->unique();

            $table->string('nome', 100);

            $table->text('descricao')->nullable();

            $table->boolean('ativo')->default(true);

            $table->timestamps();
        });

        DB::table('trabalho_pagamento_status')->insert([
            [
                'codigo' => 'AGUARDANDO_PROCESSAMENTO',
                'nome' => 'Aguardando processamento',
                'descricao' => 'Pagamento ou estorno aguardando processamento pela plataforma.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'PROCESSANDO',
                'nome' => 'Processando',
                'descricao' => 'Pagamento ou estorno em processamento pela plataforma.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'PAGO',
                'nome' => 'Pago',
                'descricao' => 'Valor liberado e pago ao contratado.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'ESTORNADO',
                'nome' => 'Estornado',
                'descricao' => 'Valor devolvido ao contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'NAO_PROCESSADO',
                'nome' => 'Não processado',
                'descricao' => 'Pagamento ou estorno não pôde ser processado.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'CANCELADO',
                'nome' => 'Cancelado',
                'descricao' => 'Operação de pagamento ou estorno cancelada.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('trabalho_pagamento_status');
    }
};