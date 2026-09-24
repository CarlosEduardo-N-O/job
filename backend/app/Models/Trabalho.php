<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trabalho extends Model
{
    use HasFactory;

    protected $table = 'trabalhos';

    protected $primaryKey = 'id_trabalho';

    protected $fillable = [
        'id_publicacao',
        'id_negociacao',
        'id_contratante',
        'id_contratado',
        'status_id',
        'valor_trabalho',
        'valor_taxa',
        'valor_total',
        'data_inicio',
        'data_conclusao',
    ];

    protected $casts = [
        'valor_trabalho' => 'decimal:2',
        'valor_taxa' => 'decimal:2',
        'valor_total' => 'decimal:2',
        'data_inicio' => 'datetime',
        'data_conclusao' => 'datetime',
    ];

    /**
     * Publicação que originou o trabalho.
     */
    public function publicacao()
    {
        return $this->belongsTo(
            Publicacao::class,
            'id_publicacao'
        );
    }

    /**
     * Negociação que originou o trabalho.
     */
    public function negociacao()
    {
        return $this->belongsTo(
            Negociacao::class,
            'id_negociacao',
            'id_negociacao'
        );
    }

    /**
     * Usuário que contratou.
     */
    public function contratante()
    {
        return $this->belongsTo(
            User::class,
            'id_contratante'
        );
    }

    /**
     * Usuário contratado.
     */
    public function contratado()
    {
        return $this->belongsTo(
            User::class,
            'id_contratado'
        );
    }

    /**
     * Status atual do trabalho.
     */
    public function status()
    {
        return $this->belongsTo(
            TrabalhoStatus::class,
            'status_id'
        );
    }

    /**
     * Interações realizadas no trabalho.
     */
    public function interacoes()
    {
        return $this->hasMany(
            TrabalhoInteracao::class,
            'id_trabalho',
            'id_trabalho'
        );
    }

    /**
     * Pagamentos relacionados ao trabalho.
     */
    public function pagamentos()
    {
        return $this->hasMany(
            TrabalhoPagamento::class,
            'id_trabalho',
            'id_trabalho'
        );
    }
}