import api from './api';

export async function getPublicacoes() {
    const response = await api.get('/publicacoes');

    return response.data;
}

export async function getMinhasPublicacoes() {
    const response = await api.get(
        '/publicacoes/minhas_publicacoes'
    );

    return response.data;
}

export async function criarPublicacao(dados) {
    const response = await api.post(
        '/publicacoes',
        dados
    );

    return response.data;
}

export async function getPublicacao(id) {
    const response = await api.get(
        `/publicacoes/${id}`
    );

    return response.data;
}

export async function atualizarPublicacao(
    id,
    dados
) {
    const response = await api.put(
        `/publicacoes/${id}`,
        dados
    );

    return response.data;
}

export async function cancelarPublicacao(id) {
    const response = await api.patch(
        `/publicacoes/${id}/cancelar`
    );

    return response.data;
}

export async function criarInteracao(
    publicacaoId,
    dados
) {
    const response = await api.post(
        `/publicacoes/${publicacaoId}/interacoes`,
        dados
    );

    return response.data;
}