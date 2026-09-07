<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negociacao_status', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 50)->unique();

            $table->string('nome', 100);

            $table->string('descricao', 255)->nullable();

            $table->boolean('ativo')->default(true);

            $table->timestamps();
        });

        DB::table('negociacao_status')->insert([
            [
                'codigo' => 'AGUARDANDO_CONTRATANTE',
                'nome' => 'Aguardando contratante',
                'descricao' => 'Aguardando uma ação do contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'AGUARDANDO_INTERESSADO',
                'nome' => 'Aguardando interessado',
                'descricao' => 'Aguardando uma ação do interessado.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'AGUARDANDO_PAGAMENTO',
                'nome' => 'Aguardando pagamento',
                'descricao' => 'Aguardando o pagamento do contratante.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'PROCESSANDO_PAGAMENTO',
                'nome' => 'Processando pagamento',
                'descricao' => 'Pagamento realizado e aguardando processamento ou confirmação da plataforma.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'FECHADA',
                'nome' => 'Fechada',
                'descricao' => 'Negociação aceita, pagamento processado e contratação liberada.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'ENCERRADA',
                'nome' => 'Encerrada',
                'descricao' => 'Negociação encerrada sem contratação.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'codigo' => 'CANCELADA',
                'nome' => 'Cancelada',
                'descricao' => 'Negociação cancelada devido ao cancelamento da publicação.',
                'ativo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacao_status');
    }
};