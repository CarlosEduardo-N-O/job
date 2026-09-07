import api from './api';

export async function getNegociacoes() {
    const response = await api.get('/negociacoes');

    return response.data;
}

export async function getMinhasNegociacoes() {
    const response = await api.get('/negociacoes/meus');

    return response.data;
}

export async function getNegociacao(id) {
    const response = await api.get(
        `/negociacoes/${id}`
    );

    return response.data;
}

export async function interagirNegociacao(id, dados) {
    const response = await api.post(
        `/negociacoes/${id}/interacoes`,
        dados
    );

    return response.data;
}

export async function aceitarNegociacao(id) {
    const response = await api.post(
        `/negociacoes/${id}/aceitar`
    );

    return response.data;
}

export async function recusarNegociacao(id) {
    const response = await api.post(
        `/negociacoes/${id}/recusar`
    );

    return response.data;
}