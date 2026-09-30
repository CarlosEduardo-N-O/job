<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificacoes', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('tipo', 50);

            $table->string('titulo', 150);

            $table->text('mensagem');

            $table->boolean('lida')
                ->default(false);

            $table->json('dados')
                ->nullable();

            $table->timestamps();

            $table->index('user_id');
            $table->index('lida');
            $table->index('tipo');
            $table->index(['user_id', 'lida']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificacoes');
    }
};