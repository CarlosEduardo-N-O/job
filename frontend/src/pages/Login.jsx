import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
    const navigate = useNavigate();

    const {
        login,
        isAuthenticated,
    } = useAuth();

    // Login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal cadastro
    const [mostrarCadastro, setMostrarCadastro] = useState(false);

    const [cadastro, setCadastro] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        telefone: '',
        cidade: '',
        estado: '',
    });

    const [cadastroError, setCadastroError] = useState('');
    const [cadastroLoading, setCadastroLoading] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // =========================
    // LOGIN
    // =========================

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

    // =========================
    // CADASTRO
    // =========================

    function abrirCadastro() {
        setCadastroError('');

        setCadastro({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            telefone: '',
            cidade: '',
            estado: '',
        });

        setMostrarCadastro(true);
    }

    function fecharCadastro() {
        if (!cadastroLoading) {
            setMostrarCadastro(false);
            setCadastroError('');
        }
    }

    function handleCadastroChange(event) {
        const { name, value } = event.target;

        setCadastro((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleCadastro(event) {
        event.preventDefault();

        setCadastroError('');

        // Validação local
        if (
            cadastro.password !==
            cadastro.password_confirmation
        ) {
            setCadastroError(
                'As senhas não são iguais.'
            );

            return;
        }

        if (cadastro.password.length < 6) {
            setCadastroError(
                'A senha deve possuir pelo menos 6 caracteres.'
            );

            return;
        }

        setCadastroLoading(true);

        try {
            // Cadastro
            await api.post('/users', {
                name: cadastro.name,
                email: cadastro.email,
                password: cadastro.password,
                telefone: cadastro.telefone || null,
                cidade: cadastro.cidade || null,
                estado: cadastro.estado
                    ? cadastro.estado.toUpperCase()
                    : null,
            });

            /*
             * Cadastro realizado.
             *
             * Como o endpoint de cadastro ainda não
             * retorna um token, fazemos o login
             * automaticamente usando as credenciais
             * recém-criadas.
             */
            await login(
                cadastro.email,
                cadastro.password
            );

            // Fecha o modal
            setMostrarCadastro(false);

            // Entra na aplicação
            navigate('/', {
                replace: true,
            });

        } catch (error) {
            console.error(error);

            if (error.response?.status === 422) {
                const errors =
                    error.response?.data?.errors;

                if (errors) {
                    const primeiraMensagem =
                        Object.values(errors)
                            .flat()
                            .find(Boolean);

                    setCadastroError(
                        primeiraMensagem ||
                        'Verifique os dados informados.'
                    );
                } else {
                    setCadastroError(
                        error.response?.data?.message ||
                        'Verifique os dados informados.'
                    );
                }
            } else {
                setCadastroError(
                    'Não foi possível criar a conta.'
                );
            }
        } finally {
            setCadastroLoading(false);
        }
    }

    return (
        <>
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
                            onClick={abrirCadastro}
                        >
                            Criar conta
                        </button>
                    </div>

                </div>
            </div>

            {/* =========================
                MODAL CADASTRO
            ========================= */}

            {mostrarCadastro && (
                <div
                    className="cadastro-modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !cadastroLoading
                        ) {
                            fecharCadastro();
                        }
                    }}
                >
                    <div
                        className="cadastro-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cadastro-title"
                    >
                        <div className="cadastro-modal-header">
                            <div>
                                <h2 id="cadastro-title">
                                    Criar conta
                                </h2>

                                <p>
                                    Crie sua conta para começar
                                    a usar o JOB.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="cadastro-modal-close"
                                onClick={fecharCadastro}
                                disabled={cadastroLoading}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="cadastro-form"
                            onSubmit={handleCadastro}
                        >

                            <div className="cadastro-form-group">
                                <label htmlFor="cadastro-name">
                                    Nome
                                </label>

                                <input
                                    id="cadastro-name"
                                    name="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={cadastro.name}
                                    onChange={handleCadastroChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className="cadastro-form-group">
                                <label htmlFor="cadastro-email">
                                    E-mail
                                </label>

                                <input
                                    id="cadastro-email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={cadastro.email}
                                    onChange={handleCadastroChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="cadastro-form-row">

                                <div className="cadastro-form-group">
                                    <label htmlFor="cadastro-telefone">
                                        Telefone
                                    </label>

                                    <input
                                        id="cadastro-telefone"
                                        name="telefone"
                                        type="tel"
                                        placeholder="(47) 99999-9999"
                                        value={cadastro.telefone}
                                        onChange={handleCadastroChange}
                                        autoComplete="tel"
                                    />
                                </div>

                                <div className="cadastro-form-group">
                                    <label htmlFor="cadastro-estado">
                                        Estado
                                    </label>

                                    <select
                                        id="cadastro-estado"
                                        name="estado"
                                        value={cadastro.estado}
                                        onChange={handleCadastroChange}
                                    >
                                        <option value="">
                                            UF
                                        </option>

                                        <option value="AC">AC</option>
                                        <option value="AL">AL</option>
                                        <option value="AP">AP</option>
                                        <option value="AM">AM</option>
                                        <option value="BA">BA</option>
                                        <option value="CE">CE</option>
                                        <option value="DF">DF</option>
                                        <option value="ES">ES</option>
                                        <option value="GO">GO</option>
                                        <option value="MA">MA</option>
                                        <option value="MT">MT</option>
                                        <option value="MS">MS</option>
                                        <option value="MG">MG</option>
                                        <option value="PA">PA</option>
                                        <option value="PB">PB</option>
                                        <option value="PR">PR</option>
                                        <option value="PE">PE</option>
                                        <option value="PI">PI</option>
                                        <option value="RJ">RJ</option>
                                        <option value="RN">RN</option>
                                        <option value="RS">RS</option>
                                        <option value="RO">RO</option>
                                        <option value="RR">RR</option>
                                        <option value="SC">SC</option>
                                        <option value="SP">SP</option>
                                        <option value="SE">SE</option>
                                        <option value="TO">TO</option>
                                    </select>
                                </div>

                            </div>

                            <div className="cadastro-form-group">
                                <label htmlFor="cadastro-cidade">
                                    Cidade
                                </label>

                                <input
                                    id="cadastro-cidade"
                                    name="cidade"
                                    type="text"
                                    placeholder="Sua cidade"
                                    value={cadastro.cidade}
                                    onChange={handleCadastroChange}
                                    autoComplete="address-level2"
                                />
                            </div>

                            <div className="cadastro-form-row">

                                <div className="cadastro-form-group">
                                    <label htmlFor="cadastro-password">
                                        Senha
                                    </label>

                                    <input
                                        id="cadastro-password"
                                        name="password"
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={cadastro.password}
                                        onChange={handleCadastroChange}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="cadastro-form-group">
                                    <label htmlFor="cadastro-password-confirmation">
                                        Confirmar senha
                                    </label>

                                    <input
                                        id="cadastro-password-confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        placeholder="Repita sua senha"
                                        value={cadastro.password_confirmation}
                                        onChange={handleCadastroChange}
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>

                            </div>

                            {cadastroError && (
                                <div className="error-message cadastro-error">
                                    {cadastroError}
                                </div>
                            )}

                            <div className="cadastro-modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={fecharCadastro}
                                    disabled={cadastroLoading}
                                >
                                    Voltar
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={cadastroLoading}
                                >
                                    {cadastroLoading
                                        ? 'Criando conta...'
                                        : 'Criar conta'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}