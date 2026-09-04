import api from './api';

export async function login(email, password) {
    const response = await api.post('/login', {
        email,
        password,
    });

    return response.data;
}

export async function getAuthenticatedUser() {
    const response = await api.get('/users');

    return response.data;
}

export async function updateAuthenticatedUser(data) {
    const response = await api.put('/users', data);

    return response.data;
}

export async function logout() {
    const response = await api.post('/logout');

    return response.data;
}