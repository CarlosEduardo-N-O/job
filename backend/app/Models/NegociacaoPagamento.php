<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NegociacaoPagamento extends Model
{
    protected $table = 'negociacao_pagamento';

    protected $primaryKey = 'id_pagamento';

    protected $fillable = [
        'id_negociacao',
        'status_id',
        'valor',
        'data_pagamento_informado',
        'data_validacao',
        'observacao',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'data_pagamento_informado' => 'datetime',
        'data_validacao' => 'datetime',
    ];

    public function negociacao(): BelongsTo
    {
        return $this->belongsTo(
            Negociacao::class,
            'id_negociacao',
            'id_negociacao'
        );
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(
            NegociacaoPagamentoStatus::class,
            'status_id'
        );
    }
}