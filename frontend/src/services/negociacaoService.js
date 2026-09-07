import api from './api';

export async function getNegociacoes() {
    const response = await api.get('/negociacoes');

    return response.data;
}

export async function getNegociacao(id) {
    const response = await api.get(
        `/negociacoes/${id}`
    );

    return response.data;
}