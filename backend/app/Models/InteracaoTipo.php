<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use app\Models\Interacao;

class InteracaoTipo extends Model
{
    protected $table = 'interacao_tipos';

    protected $primaryKey = 'id_interacao_tipo';

    public $timestamps = false;

    protected $fillable = [
        'tipo',
    ];

    public function interacoes(): HasMany
    {
        return $this->hasMany(
            Interacao::class,
            'id_interacao_tipo',
            'id_interacao_tipo'
        );
    }
}