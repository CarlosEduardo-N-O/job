<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrabalhoStatus extends Model
{
    use HasFactory;

    protected $table = 'trabalho_status';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    /**
     * Trabalhos que possuem este status.
     */
    public function trabalhos()
    {
        return $this->hasMany(
            Trabalho::class,
            'status_id'
        );
    }
}