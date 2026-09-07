<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Publicacao;

class Negociacao extends Model
{
    protected $table = 'negociacoes';

    protected $primaryKey = 'id_negociacao';

    protected $fillable = [
        'id_interessado',
        'id_contratante',
        'id_publicacao',
        'status',
        'valor_trabalho',
    ];

    protected $casts = [
        'valor_trabalho' => 'decimal:2',
    ];

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

    public function interacoes(): HasMany
    {
        return $this->hasMany(
            NegociacaoInteracao::class,
            'id_negociacao',
            'id_negociacao'
        );
    }
}