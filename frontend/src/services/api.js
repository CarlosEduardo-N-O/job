import axios from 'axios';

const apiHost = window.location.hostname;

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        `http://${apiHost}:8000/api`,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Adiciona automaticamente o token do Sanctum
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('job_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Se a API retornar 401, remove a sessão
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('job_token');
            localStorage.removeItem('job_user');
        }

        return Promise.reject(error);
    }
);

export default api;