<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'JOB API',
    version: '1.0.0',
    description: 'API da plataforma JOB para intermediação de serviços.'
)]

#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Servidor local'
)]

#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum',
    description: 'Token de autenticação do Laravel Sanctum'
)]

class OpenApi
{
}