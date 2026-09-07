<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Negociacao extends Model
{
    protected $table = 'negociacoes';

    protected $primaryKey = 'id_negociacao';

    protected $fillable = [
        'id_interessado',
        'id_contratante',
        'id_publicacao',
        'status_id',
        'valor_trabalho',
    ];

    protected $casts = [
        'valor_trabalho' => 'decimal:2',
    ];

    /**
     * Status atual da negociação.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(
            NegociacaoStatus::class,
            'status_id'
        );
    }

    /**
     * Usuário interessado na publicação.
     */
    public function interessado(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'id_interessado'
        );
    }

    /**
     * Usuário contratante da publicação.
     */
    public function contratante(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'id_contratante'
        );
    }

    /**
     * Publicação relacionada à negociação.
     */
    public function publicacao(): BelongsTo
    {
        return $this->belongsTo(
            Publicacao::class,
            'id_publicacao'
        );
    }

    /**
     * Interações da negociação.
     */
    public function interacoes(): HasMany
    {
        return $this->hasMany(
            NegociacaoInteracao::class,
            'id_negociacao',
            'id_negociacao'
        );
    }

    public function pagamento(): HasOne
    {
        return $this->hasOne(
            NegociacaoPagamento::class,
            'id_negociacao',
            'id_negociacao'
        );
    }
}
