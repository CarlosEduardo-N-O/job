<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrabalhoPagamento extends Model
{
    use HasFactory;

    protected $table = 'trabalho_pagamentos';

    protected $primaryKey = 'id_trabalho_pagamento';

    protected $fillable = [
        'id_trabalho',
        'status_id',
        'tipo',
        'valor_trabalho',
        'valor_taxa',
        'valor_total',
        'data_processamento',
        'observacao',
    ];

    protected $casts = [
        'valor_trabalho' => 'decimal:2',
        'valor_taxa' => 'decimal:2',
        'valor_total' => 'decimal:2',
        'data_processamento' => 'datetime',
    ];

    public function trabalho()
    {
        return $this->belongsTo(
            Trabalho::class,
            'id_trabalho',
            'id_trabalho'
        );
    }

    public function status()
    {
        return $this->belongsTo(
            TrabalhoPagamentoStatus::class,
            'status_id',
            'id_trabalho_pagamento_status'
        );
    }
}