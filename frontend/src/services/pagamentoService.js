import api from './api';

export async function getPagamento(negociacaoId) {
    const response = await api.get(
        `/negociacoes/${negociacaoId}/pagamento`
    );

    return response.data;
}

export async function informarPagamento(negociacaoId) {
    const response = await api.post(
        `/negociacoes/${negociacaoId}/pagamento/informar`
    );

    return response.data;
}