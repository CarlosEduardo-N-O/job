<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrabalhoPagamentoStatus extends Model
{
    use HasFactory;

    protected $table = 'trabalho_pagamento_status';

    protected $primaryKey = 'id_trabalho_pagamento_status';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function pagamentos()
    {
        return $this->hasMany(
            TrabalhoPagamento::class,
            'status_id',
            'id_trabalho_pagamento_status'
        );
    }
}