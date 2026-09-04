import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    login as loginService,
    getAuthenticatedUser,
    logout as logoutService,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('job_user');

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('job_token');
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response =
                    await getAuthenticatedUser();

                const authenticatedUser =
                    response.data ?? response;

                setUser(authenticatedUser);

                localStorage.setItem(
                    'job_user',
                    JSON.stringify(authenticatedUser)
                );
            } catch (error) {
                console.error(
                    'Erro ao recuperar usuário autenticado:',
                    error
                );

                localStorage.removeItem('job_token');
                localStorage.removeItem('job_user');

                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [token]);

    async function login(email, password) {
        const response = await loginService(
            email,
            password
        );

        const newToken = response.token;

        const authenticatedUser =
            response.data?.data ??
            response.data ??
            null;

        localStorage.setItem(
            'job_token',
            newToken
        );

        if (authenticatedUser) {
            localStorage.setItem(
                'job_user',
                JSON.stringify(authenticatedUser)
            );
        }

        setToken(newToken);
        setUser(authenticatedUser);

        return response;
    }

    async function logout() {
        try {
            await logoutService();
        } catch (error) {
            console.error(
                'Erro ao realizar logout:',
                error
            );
        } finally {
            localStorage.removeItem('job_token');
            localStorage.removeItem('job_user');

            setToken(null);
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!token,
                login,
                logout,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}