import { useEffect, useState } from 'react';

import {
    getAuthenticatedUser,
    updateAuthenticatedUser,
} from '../services/authService';

import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
    const {
        user,
        setUser,
        logout,
    } = useAuth();

    const [form, setForm] = useState({
        name: '',
        email: '',
        telefone: '',
        foto_url: '',
        cidade: '',
        estado: '',
        password: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        setLoading(true);
        setError('');

        try {
            const response =
                await getAuthenticatedUser();

            const usuario =
                response.data ?? response;

            setUser(usuario);

            setForm({
                name: usuario.name ?? '',
                email: usuario.email ?? '',
                telefone: usuario.telefone ?? '',
                foto_url: usuario.foto_url ?? '',
                cidade: usuario.cidade ?? '',
                estado: usuario.estado ?? '',
                password: '',
            });
        } catch (error) {
            console.error(error);

            setError(
                'Não foi possível carregar seu perfil.'
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setMessage('');
        setError('');

        try {
            const dataToSend = {
                name: form.name,
                email: form.email,
                telefone: form.telefone,
                foto_url: form.foto_url,
                cidade: form.cidade,
                estado: form.estado,
            };

            if (form.password.trim() !== '') {
                dataToSend.password =
                    form.password;
            }

            const response =
                await updateAuthenticatedUser(
                    dataToSend
                );

            const updatedUser =
                response.data ?? response;

            setUser(updatedUser);

            localStorage.setItem(
                'job_user',
                JSON.stringify(updatedUser)
            );

            setForm((current) => ({
                ...current,
                password: '',
            }));

            setMessage(
                'Perfil atualizado com sucesso!'
            );
        } catch (error) {
            console.error(error);

            if (
                error.response?.status === 422
            ) {
                setError(
                    'Verifique os dados informados.'
                );
            } else {
                setError(
                    'Não foi possível atualizar o perfil.'
                );
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="page profile-page">

            <header className="page-header simple">
                <div>
                    <span className="welcome-text">
                        Minha conta
                    </span>

                    <h1>
                        Perfil
                    </h1>
                </div>
            </header>

            <section className="profile-header">

                <div className="profile-avatar">
                    {form.foto_url ? (
                        <img
                            src={form.foto_url}
                            alt={`Foto de ${form.name}`}
                        />
                    ) : (
                        form.name
                            ?.charAt(0)
                            ?.toUpperCase() || 'U'
                    )}
                </div>

                <div className="profile-info">
                    <h2>
                        {user?.name || 'Usuário'}
                    </h2>
                </div>

            </section>

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form
                className="profile-form"
                onSubmit={handleSubmit}
            >

                <div className="form-section">
                    <h2>
                        Dados pessoais
                    </h2>

                    <div className="form-group">
                        <label htmlFor="name">
                            Nome
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            E-mail
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone">
                            Telefone
                        </label>

                        <input
                            id="telefone"
                            name="telefone"
                            type="tel"
                            value={form.telefone}
                            onChange={handleChange}
                            placeholder="(47) 99999-9999"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="foto_url">
                            URL da foto
                        </label>

                        <input
                            id="foto_url"
                            name="foto_url"
                            type="url"
                            value={form.foto_url}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h2>
                        Localização
                    </h2>

                    <div className="form-row">

                        <div className="form-group">
                            <label htmlFor="cidade">
                                Cidade
                            </label>

                            <input
                                id="cidade"
                                name="cidade"
                                type="text"
                                value={form.cidade}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group state-field">
                            <label htmlFor="estado">
                                Estado
                            </label>

                            <input
                                id="estado"
                                name="estado"
                                type="text"
                                maxLength="2"
                                value={form.estado}
                                onChange={handleChange}
                                placeholder="SC"
                            />
                        </div>

                    </div>
                </div>

                <div className="form-section">
                    <h2>
                        Segurança
                    </h2>

                    <div className="form-group">
                        <label htmlFor="password">
                            Nova senha
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Deixe vazio para manter a atual"
                            minLength="6"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                >
                    {saving
                        ? 'Salvando...'
                        : 'Salvar alterações'}
                </button>

            </form>

            <button
                type="button"
                className="logout-button"
                onClick={logout}
            >
                Sair da conta
            </button>

        </div>
    );
}