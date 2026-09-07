<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NegociacaoInteracao extends Model
{
    protected $table = 'negociacao_interacoes';

    protected $primaryKey = 'id_negociacao_interacao';

    protected $fillable = [
        'id_interacao',
        'id_negociacao',
        'id_interessado',
        'id_contratante',
        'id_publicacao',
    ];

    public function interacao(): BelongsTo
    {
        return $this->belongsTo(
            Interacao::class,
            'id_interacao',
            'id_interacao'
        );
    }

    public function negociacao(): BelongsTo
    {
        return $this->belongsTo(
            Negociacao::class,
            'id_negociacao',
            'id_negociacao'
        );
    }

    public function interessado(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'id_interessado'
        );
    }

    public function contratante(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'id_contratante'
        );
    }

    public function publicacao(): BelongsTo
    {
        return $this->belongsTo(
            Publicacao::class,
            'id_publicacao'
        );
    }
}