<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrabalhoInteracao extends Model
{
    use HasFactory;

    protected $table = 'trabalho_interacoes';

    protected $primaryKey = 'id_trabalho_interacao';

    protected $fillable = [
        'id_trabalho',
        'id_interacao',
    ];

    public function trabalho()
    {
        return $this->belongsTo(
            Trabalho::class,
            'id_trabalho',
            'id_trabalho'
        );
    }

    public function interacao()
    {
        return $this->belongsTo(
            Interacao::class,
            'id_interacao',
            'id_interacao'
        );
    }
}