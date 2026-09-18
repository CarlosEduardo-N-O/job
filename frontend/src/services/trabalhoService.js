import api from './api';


/*
 * =========================================================
 * CONTRATAÇÕES
 * =========================================================
 *
 * Usuário autenticado como CONTRATANTE.
 *
 * GET /api/trabalhos/contratacoes
 */

export async function getContratacoes() {

    const response =
        await api.get(
            '/trabalhos/contratacoes'
        );

    return response.data;
}


/*
 * =========================================================
 * MEUS TRABALHOS
 * =========================================================
 *
 * Usuário autenticado como CONTRATADO.
 *
 * GET /api/trabalhos/meus
 */

export async function getMeusTrabalhos() {

    const response =
        await api.get(
            '/trabalhos/meus'
        );

    return response.data;
}


/*
 * =========================================================
 * INTERAGIR COM TRABALHO
 * =========================================================
 *
 * POST /api/trabalhos/{trabalho}/interacoes
 */

export async function interagirTrabalho(
    trabalhoId,
    dados
) {

    const response =
        await api.post(
            `/trabalhos/${trabalhoId}/interacoes`,
            dados
        );

    return response.data;
}


/*
 * =========================================================
 * TIPOS DE INTERAÇÃO
 * =========================================================
 *
 * Conforme TrabalhoController.
 */

export const TIPOS_INTERACAO_TRABALHO = {

    SERVICO_CONCLUIDO:
        6,

    SERVICO_CONFIRMADO:
        7,

    SERVICO_CONTESTADO:
        8,

    DESISTENCIA_CONTRATADO:
        9,

    DESISTENCIA_CONTRATANTE:
        10,
};