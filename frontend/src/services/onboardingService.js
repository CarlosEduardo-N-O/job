import api from './api';

export async function verificarPrimeiroAcesso() {
    const response = await api.get('/onboarding');

    return response.data;
}

export async function concluirOnboarding() {
    const response = await api.post('/onboarding/concluir');

    return response.data;
}