import api from './api';


export async function getPublicacoes() {

    const response =
        await api.get(
            '/publicacoes'
        );

    return response.data;

}


export async function getMinhasPublicacoes() {

    const response =
        await api.get(
            '/publicacoes/minhas_publicacoes'
        );

    return response.data;

}


export async function criarPublicacao(
    dados
) {

    const formData =
        new FormData();


    formData.append(
        'categoria_id',
        dados.categoria_id
    );

    formData.append(
        'titulo',
        dados.titulo
    );

    formData.append(
        'descricao',
        dados.descricao
    );


    if (
        dados.valor_estimado !== undefined &&
        dados.valor_estimado !== null &&
        dados.valor_estimado !== ''
    ) {

        formData.append(
            'valor_estimado',
            dados.valor_estimado
        );

    }


    if (dados.cidade) {

        formData.append(
            'cidade',
            dados.cidade
        );

    }


    if (dados.estado) {

        formData.append(
            'estado',
            dados.estado
        );

    }


    if (dados.endereco_servico) {

        formData.append(
            'endereco_servico',
            dados.endereco_servico
        );

    }


    if (dados.data_inicio) {

        formData.append(
            'data_inicio',
            dados.data_inicio
        );

    }


    if (dados.horario_inicio) {

        formData.append(
            'horario_inicio',
            dados.horario_inicio
        );

    }


    if (dados.data_fim) {

        formData.append(
            'data_fim',
            dados.data_fim
        );

    }


    /*
     * IMPORTANTE:
     *
     * NÃO enviar arquivos aqui.
     *
     * Os arquivos são enviados depois,
     * através de adicionarAnexoPublicacao().
     */


    const response =
        await api.post(
            '/publicacoes',
            formData
        );


    return response.data;

}


export async function getPublicacao(
    id
) {

    const response =
        await api.get(
            `/publicacoes/${id}`
        );

    return response.data;

}

export async function getOutrasPublicacoes() {

    const response =
        await api.get(
            '/publicacoes/outras'
        );

    return response.data;

}


export async function atualizarPublicacao(
    id,
    dados
) {

    const response =
        await api.put(
            `/publicacoes/${id}`,
            dados
        );

    return response.data;

}


export async function cancelarPublicacao(
    id
) {

    const response =
        await api.patch(
            `/publicacoes/${id}/cancelar`
        );

    return response.data;

}


export async function criarInteracao(
    publicacaoId,
    dados
) {

    const response =
        await api.post(
            `/publicacoes/${publicacaoId}/interacoes`,
            dados
        );

    return response.data;

}


/*
|--------------------------------------------------------------------------
| ANEXOS
|--------------------------------------------------------------------------
*/


export async function getAnexosPublicacao(
    publicacaoId
) {

    const response =
        await api.get(
            `/publicacoes/${publicacaoId}/anexos`
        );

    return response.data;

}


export async function getAnexoPublicacao(
    publicacaoId,
    anexoId
) {

    const response =
        await api.get(
            `/publicacoes/${publicacaoId}/anexos/${anexoId}`,
            {
                responseType: 'blob',
            }
        );

    return response.data;

}


export async function adicionarAnexoPublicacao(
    publicacaoId,
    arquivo
) {

    const formData =
        new FormData();


    formData.append(
        'arquivo',
        arquivo
    );


    const response =
        await api.post(
            `/publicacoes/${publicacaoId}/anexos`,
            formData
        );


    return response.data;

}


export async function excluirAnexoPublicacao(
    publicacaoId,
    anexoId
) {

    const response =
        await api.delete(
            `/publicacoes/${publicacaoId}/anexos/${anexoId}`
        );

    return response.data;

}