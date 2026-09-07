import { useEffect, useState } from 'react';

import {
    getAuthenticatedUser,
    updateAuthenticatedUser,
    getUserCategories,
    addUserCategory,
    removeUserCategory,
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

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingCategoria, setSavingCategoria] = useState(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError('');

        try {
            const [
                usuarioResponse,
                categoriasResponse,
            ] = await Promise.all([
                getAuthenticatedUser(),
                getUserCategories(),
            ]);

            const usuario =
                usuarioResponse.data ??
                usuarioResponse;

            const listaCategorias =
                categoriasResponse.data ??
                categoriasResponse;

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

            setCategorias(listaCategorias);
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
                response.data ??
                response;

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

    async function handleCategoria(categoria) {
        setSavingCategoria(categoria.id);
        setMessage('');
        setError('');

        try {
            if (categoria.selecionada) {

                await removeUserCategory(
                    categoria.vinculo_id
                );

                setCategorias((current) =>
                    current.map((item) =>
                        item.id === categoria.id
                            ? {
                                ...item,
                                selecionada: false,
                                vinculo_id: null,
                            }
                            : item
                    )
                );

                setMessage(
                    `Categoria "${categoria.nome}" removida.`
                );

            } else {

                const response =
                    await addUserCategory(
                        categoria.id
                    );

                const novoVinculo =
                    response.data ??
                    response;

                setCategorias((current) =>
                    current.map((item) =>
                        item.id === categoria.id
                            ? {
                                ...item,
                                selecionada: true,
                                vinculo_id:
                                    novoVinculo.id,
                            }
                            : item
                    )
                );

                setMessage(
                    `Categoria "${categoria.nome}" adicionada.`
                );
            }

        } catch (error) {
            console.error(error);

            if (
                error.response?.status === 409
            ) {
                setMessage(
                    'Esta categoria já está vinculada ao seu perfil.'
                );
            } else {
                setError(
                    'Não foi possível alterar a categoria.'
                );
            }

        } finally {
            setSavingCategoria(null);
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>

                <p>
                    Carregando perfil...
                </p>
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
                            alt={`Foto de ${form.name} `}
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
                        Minhas categorias
                    </h2>

                    <p className="form-description">
                        Selecione as categorias dos
                        serviços que você pode realizar.
                    </p>

                    <div className="categories-list">

                        {categorias.length === 0 ? (
                            <p>
                                Nenhuma categoria
                                cadastrada.
                            </p>
                        ) : (
                            categorias.map((categoria) => (
                                <button
                                    key={categoria.id}
                                    type="button"
                                    className={
                                        categoria.selecionada
                                            ? 'category-item selected'
                                            : 'category-item'
                                    }
                                    onClick={() =>
                                        handleCategoria(
                                            categoria
                                        )
                                    }
                                    disabled={
                                        savingCategoria ===
                                        categoria.id
                                    }
                                >

                                    <div className="category-content">

                                        <strong>
                                            {categoria.nome}
                                        </strong>

                                        {categoria.descricao && (
                                            <span>
                                                {
                                                    categoria.descricao
                                                }
                                            </span>
                                        )}

                                    </div>

                                    <div className="category-check">

                                        {categoria.selecionada
                                            ? '✓'
                                            : '+'}

                                    </div>

                                </button>
                            ))
                        )}

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
