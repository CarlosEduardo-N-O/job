<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PublicacaoStatus;

class Publicacao extends Model
{
    protected $table = 'publicacoes';

    protected $fillable = [
        'contratante_id',
        'categoria_id',
        'titulo',
        'descricao',
        'valor_estimado',
        'cidade',
        'estado',
        'endereco_servico',
        'data_inicio',
        'horario_inicio',
        'data_fim',
        'status_id',
    ];

    protected $casts = [
        'valor_estimado' => 'decimal:2',
        'data_inicio' => 'date',
        'data_fim' => 'date',
    ];

    public function contratante(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'contratante_id'
        );
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(
            Categoria::class,
            'categoria_id'
        );
    }

    public function negociacoes(): HasMany
    {
        return $this->hasMany(
            Negociacao::class,
            'id_publicacao',
            'id'
        );
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(
            PublicacaoStatus::class,
            'status_id'
        );
    }
}
