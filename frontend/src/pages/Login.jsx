import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const navigate = useNavigate();

    const {
        login,
        isAuthenticated,
    } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await login(email, password);

            navigate('/', {
                replace: true,
            });
        } catch (error) {
            console.error(error);

            if (error.response?.status === 422) {
                setError(
                    'Verifique o e-mail e a senha informados.'
                );
            } else if (error.response?.status === 401) {
                setError(
                    'E-mail ou senha incorretos.'
                );
            } else {
                setError(
                    'Não foi possível realizar o login.'
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-logo">
                    JOB
                </div>

                <div className="login-header">
                    <h1>Bem-vindo ao JOB</h1>

                    <p>
                        Encontre profissionais ou encontre
                        novos trabalhos.
                    </p>
                </div>

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="email">
                            E-mail
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Senha
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? 'Entrando...'
                            : 'Entrar'}
                    </button>
                </form>

                <div className="login-footer">
                    <span>
                        Ainda não possui uma conta?
                    </span>

                    <button
                        type="button"
                        className="link-button"
                    >
                        Criar conta
                    </button>
                </div>

            </div>
        </div>
    );
}