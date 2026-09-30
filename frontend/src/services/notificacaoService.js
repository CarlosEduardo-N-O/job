import api from './api';

export async function getNotificacoes(params = {}) {
    const response = await api.get('/notificacoes', {
        params,
    });

    return response.data;
}

export async function getNotificacoesNaoLidas() {
    const response = await api.get('/notificacoes/nao-lidas');

    return response.data;
}

export async function getContadorNotificacoes() {
    const response = await api.get('/notificacoes/contador');

    return response.data;
}

export async function marcarNotificacaoComoLida(
    notificacaoId
) {
    const response = await api.patch(
        `/notificacoes/${notificacaoId}/ler`
    );

    return response.data;
}

export async function marcarTodasNotificacoesComoLidas() {
    const response = await api.patch(
        '/notificacoes/ler-todas'
    );

    return response.data;
}

export async function excluirNotificacao(
    notificacaoId
) {
    const response = await api.delete(
        `/notificacoes/${notificacaoId}`
    );

    return response.data;
}