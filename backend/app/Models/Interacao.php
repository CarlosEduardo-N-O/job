<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\negociacaoInteracao;

class Interacao extends Model
{
    protected $table = 'interacoes';

    protected $primaryKey = 'id_interacao';

    protected $fillable = [
        'id_interacao_tipo',
        'remetente_id',
        'mensagem',
        'valor_proposto',
    ];

    protected $casts = [
        'valor_proposto' => 'decimal:2',
    ];

    public function tipo(): BelongsTo
    {
        return $this->belongsTo(
            InteracaoTipo::class,
            'id_interacao_tipo',
            'id_interacao_tipo'
        );
    }

    public function remetente(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'remetente_id'
        );
    }

    public function negociacaoInteracao(): HasOne
    {
        return $this->hasOne(
            NegociacaoInteracao::class,
            'id_interacao',
            'id_interacao'
        );
    }
}