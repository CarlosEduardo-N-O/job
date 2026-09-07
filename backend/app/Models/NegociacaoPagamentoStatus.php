<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\NegociacaoPagamento;

class NegociacaoPagamentoStatus extends Model
{
    protected $table = 'negociacao_pagamento_status';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function pagamentos(): HasMany
    {
        return $this->hasMany(
            NegociacaoPagamento::class,
            'status_id'
        );
    }
}