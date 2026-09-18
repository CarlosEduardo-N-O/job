<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categorias', function (Blueprint $table) {

            $table->id();

            $table->string('nome', 100)->unique();

            $table->text('descricao')->nullable();

            $table->string('status', 20)->default('ativo');

            $table->timestamps();
        });

        DB::table('categorias')->insert([
            [
                'nome' => 'Encanador',
                'descricao' => 'Instalação e reparo de sistemas hidráulicos, vazamentos e tubulações',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Eletricista',
                'descricao' => 'Instalações elétricas, manutenção de quadros, tomadas e fiação',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Diarista / Faxina',
                'descricao' => 'Limpeza residencial e comercial, diária ou periódica',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Pintor',
                'descricao' => 'Pintura residencial, comercial e serviços de textura',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Jardinagem',
                'descricao' => 'Manutenção de jardins, poda, paisagismo e grama',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Marceneiro',
                'descricao' => 'Fabricação e reparo de móveis planejados e sob medida',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Pedreiro',
                'descricao' => 'Alvenaria, reformas, reboco e pequenas construções',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Técnico em Informática',
                'descricao' => 'Manutenção de computadores, redes e formatação',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Aulas Particulares',
                'descricao' => 'Reforço escolar, idiomas e aulas particulares em geral',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Fotografia',
                'descricao' => 'Cobertura fotográfica de eventos, ensaios e produtos',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Cabeleireiro / Manicure',
                'descricao' => 'Serviços de beleza, cabelo, unhas e estética',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Personal Trainer',
                'descricao' => 'Treinamento físico personalizado, presencial ou online',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Mecânico',
                'descricao' => 'Manutenção e reparo automotivo em geral',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Chaveiro',
                'descricao' => 'Confecção de chaves e manutenção de fechaduras',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nome' => 'Dedetização',
                'descricao' => 'Controle de pragas e sanitização de imóveis',
                'status' => 'ativo',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('categorias');
    }
};