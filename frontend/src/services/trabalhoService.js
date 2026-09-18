import api from './api';

export async function getContratacoes() {
    const response = await api.get('/trabalhos/contratacoes');

    return response.data;
}

export async function getMeusTrabalhos() {
    const response = await api.get('/trabalhos/meus');

    return response.data;
}

export async function interagirTrabalho(trabalhoId, dados) {
    const response = await api.post(
        `/trabalhos/${trabalhoId}/interacoes`,
        dados
    );

    return response.data;
}

export const TIPOS_INTERACAO_TRABALHO = {
    SERVICO_CONCLUIDO: 6,
    SERVICO_CONFIRMADO: 7,
    SERVICO_CONTESTADO: 8,
    DESISTENCIA_CONTRATADO: 9,
    DESISTENCIA_CONTRATANTE: 10,
};