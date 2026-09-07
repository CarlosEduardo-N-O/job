<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negociacao_pagamento', function (Blueprint $table) {
            $table->id('id_pagamento');

            $table->foreignId('id_negociacao')
                ->constrained('negociacoes', 'id_negociacao')
                ->restrictOnDelete();

            $table->foreignId('status_id')
                ->constrained(
                    'negociacao_pagamento_status'
                )
                ->restrictOnDelete();

            $table->decimal('valor', 10, 2);

            $table->timestamp('data_pagamento_informado')
                ->nullable();

            $table->timestamp('data_validacao')
                ->nullable();

            $table->text('observacao')
                ->nullable();

            $table->timestamps();

            /*
             * Uma negociação possui apenas um pagamento.
             */
            $table->unique('id_negociacao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negociacao_pagamento');
    }
};