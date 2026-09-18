<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublicacaoStatus extends Model
{
    use HasFactory;

    protected $table = 'publicacao_status';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function publicacoes(): HasMany
    {
        return $this->hasMany(
            Publicacao::class,
            'status_id'
        );
    }
}