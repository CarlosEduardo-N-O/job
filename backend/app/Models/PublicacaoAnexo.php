<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicacaoAnexo extends Model
{
    protected $table = 'publicacao_anexos';

    protected $fillable = [
        'publicacao_id',
        'nome_original',
        'nome_arquivo',
        'caminho',
        'mime_type',
        'tipo',
        'tamanho',
        'ordem',
    ];

    protected $casts = [
        'tamanho' => 'integer',
        'ordem' => 'integer',
    ];

    protected $hidden = [
        'nome_arquivo',
        'caminho',
    ];

    public function publicacao(): BelongsTo
    {
        return $this->belongsTo(
            Publicacao::class,
            'publicacao_id'
        );
    }
}