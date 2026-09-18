<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trabalho_pagamentos', function (Blueprint $table) {
            $table->id('id_trabalho_pagamento');

            $table->foreignId('id_trabalho')
                ->constrained(
                    'trabalhos',
                    'id_trabalho'
                )
                ->restrictOnDelete();

            $table->foreignId('status_id')
                ->constrained(
                    'trabalho_pagamento_status',
                    'id_trabalho_pagamento_status'
                )
                ->restrictOnDelete();

            $table->string('tipo', 30);

            $table->decimal(
                'valor',
                12,
                2
            );

            $table->timestamp(
                'data_processamento'
            )->nullable();

            $table->text(
                'observacao'
            )->nullable();

            $table->timestamps();

            $table->index('id_trabalho');
            $table->index('status_id');
            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trabalho_pagamentos');
    }
};