<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = [
        'nome',
        'descricao',
        'status',
    ];

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_categoria',
            'categoria_id',
            'user_id'
        )->withTimestamps();
    }

    public function publicacoes(): HasMany
    {
        return $this->hasMany(
            Publicacao::class,
            'categoria_id'
        );
    }
}
