<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NegociacaoStatus extends Model
{
    protected $table = 'negociacao_status';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    /**
     * Negociações que possuem este status.
     */
    public function negociacoes(): HasMany
    {
        return $this->hasMany(
            Negociacao::class,
            'status_id'
        );
    }
}