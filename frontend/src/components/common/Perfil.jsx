import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    getAuthenticatedUser,
    updateAuthenticatedUser,
    getUserCategories,
    addUserCategory,
    removeUserCategory,
} from '../../services/authService';

import { useAuth } from '../../contexts/AuthContext';

import '../../styles/perfil.css';

export default function Perfil({
    onClose,
}) {
    const {
        user,
        setUser,
        logout,
    } = useAuth();

    const [
        form,
        setForm,
    ] = useState({
        name: '',
        email: '',
        telefone: '',
        foto_url: '',
        cidade: '',
        estado: '',
        password: '',
    });

    const [
        categorias,
        setCategorias,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        savingCategoria,
        setSavingCategoria,
    ] = useState(null);

    const [
        message,
        setMessage,
    ] = useState('');

    const [
        error,
        setError,
    ] = useState('');

    const categoriasContainerRef =
        useRef(null);

    /*
    |--------------------------------------------------------------------------
    | Carregar perfil
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        async function carregarDados() {
            setLoading(true);
            setError('');
            setMessage('');

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

                setCategorias(
                    Array.isArray(listaCategorias)
                        ? listaCategorias
                        : []
                );
            } catch (error) {
                console.error(
                    'Erro ao carregar perfil:',
                    error
                );

                setError(
                    'Não foi possível carregar seu perfil.'
                );
            } finally {
                setLoading(false);
            }
        }

        carregarDados();
    }, [setUser]);

    /*
    |--------------------------------------------------------------------------
    | Fechar com ESC
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                event.key === 'Escape' &&
                !saving
            ) {
                onClose?.();
            }
        }

        document.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [onClose, saving]);

    /*
    |--------------------------------------------------------------------------
    | Bloquear scroll da página
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const overflowAnterior =
            document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow =
                overflowAnterior;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Campos
    |--------------------------------------------------------------------------
    */

    function handleChange(event) {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setMessage('');
        setError('');
    }

    /*
    |--------------------------------------------------------------------------
    | Salvar perfil
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) {
            return;
        }

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

            if (
                form.password.trim() !== ''
            ) {
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

            /*
             * O perfil foi salvo com sucesso.
             * Fecha o modal automaticamente.
             */
            onClose?.();

        } catch (error) {
            console.error(
                'Erro ao atualizar perfil:',
                error
            );

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

            setSaving(false);

            return;
        }

        setSaving(false);
    }

    /*
    |--------------------------------------------------------------------------
    | Categorias
    |--------------------------------------------------------------------------
    */

    function navegarCategorias(direcao) {
        const container =
            categoriasContainerRef.current;

        if (!container) {
            return;
        }

        const deslocamento =
            container.clientWidth * 0.85;

        container.scrollBy({
            left:
                direcao === 'direita'
                    ? deslocamento
                    : -deslocamento,
            behavior: 'smooth',
        });
    }

    async function handleCategoria(categoria) {
        if (
            savingCategoria !== null
        ) {
            return;
        }

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

                return;
            }

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
        } catch (error) {
            console.error(
                'Erro ao alterar categoria:',
                error
            );

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

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    function handleOverlayMouseDown(event) {
        if (
            event.target === event.currentTarget &&
            !saving
        ) {
            onClose?.();
        }
    }

    function handleClose() {
        if (saving) {
            return;
        }

        onClose?.();
    }

    function handleLogout() {
        if (saving) {
            return;
        }

        logout();
    }

    /*
    |--------------------------------------------------------------------------
    | Carregando
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div
                className="profile-modal-overlay"
                onMouseDown={
                    handleOverlayMouseDown
                }
            >
                <div
                    className="profile-modal-loading"
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
                >
                    <div className="loading-spinner"></div>

                    <p>
                        Carregando perfil...
                    </p>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    return (
        <div
            className="profile-modal-overlay"
            onMouseDown={
                handleOverlayMouseDown
            }
        >
            <div
                className="profile-modal"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                <header className="profile-modal-header">

                    <div className="profile-modal-user">

                        <button
                            type="button"
                            className="profile-back-button"
                            onClick={handleClose}
                            disabled={saving}
                            aria-label="Voltar"
                            title="Voltar"
                        >
                            ←
                        </button>

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
                                {user?.name ||
                                    'Usuário'}
                            </h2>

                            <span>
                                Meu perfil
                            </span>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="profile-close"
                        onClick={handleClose}
                        disabled={saving}
                        aria-label="Fechar perfil"
                        title="Fechar"
                    >
                        ×
                    </button>

                </header>

                <div className="profile-modal-content">

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
                                <label htmlFor="profile-name">
                                    Nome
                                </label>

                                <input
                                    id="profile-name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profile-email">
                                    E-mail
                                </label>

                                <input
                                    id="profile-email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profile-telefone">
                                    Telefone
                                </label>

                                <input
                                    id="profile-telefone"
                                    name="telefone"
                                    type="tel"
                                    value={form.telefone}
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="(47) 99999-9999"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profile-foto">
                                    URL da foto
                                </label>

                                <input
                                    id="profile-foto"
                                    name="foto_url"
                                    type="url"
                                    value={form.foto_url}
                                    onChange={
                                        handleChange
                                    }
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
                                    <label htmlFor="profile-cidade">
                                        Cidade
                                    </label>

                                    <input
                                        id="profile-cidade"
                                        name="cidade"
                                        type="text"
                                        value={form.cidade}
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                                <div className="form-group state-field">
                                    <label htmlFor="profile-estado">
                                        Estado
                                    </label>

                                    <input
                                        id="profile-estado"
                                        name="estado"
                                        type="text"
                                        maxLength="2"
                                        value={form.estado}
                                        onChange={
                                            handleChange
                                        }
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
                                Selecione as categorias
                                dos serviços que você
                                pode realizar.
                            </p>

                            <div className="categories-wrapper">

                                {categorias.length === 0 ? (
                                    <p>
                                        Nenhuma categoria
                                        cadastrada.
                                    </p>
                                ) : (
                                    <>

                                        <div className="categories-navigation">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navegarCategorias(
                                                        'esquerda'
                                                    )
                                                }
                                                aria-label="Ver categorias anteriores"
                                            >
                                                ‹
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navegarCategorias(
                                                        'direita'
                                                    )
                                                }
                                                aria-label="Ver mais categorias"
                                            >
                                                ›
                                            </button>

                                        </div>

                                        <div
                                            className="categories-list"
                                            ref={
                                                categoriasContainerRef
                                            }
                                        >
                                            {categorias.map(
                                                (
                                                    categoria
                                                ) => (
                                                    <button
                                                        key={
                                                            categoria.id
                                                        }
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
                                                            savingCategoria !==
                                                            null
                                                        }
                                                    >

                                                        <div className="category-content">

                                                            <strong>
                                                                {
                                                                    categoria.nome
                                                                }
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
                                                )
                                            )}
                                        </div>

                                    </>
                                )}

                            </div>

                        </div>

                        <div className="form-section">

                            <h2>
                                Segurança
                            </h2>

                            <div className="form-group">

                                <label htmlFor="profile-password">
                                    Nova senha
                                </label>

                                <input
                                    id="profile-password"
                                    name="password"
                                    type="password"
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleChange
                                    }
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
                        onClick={handleLogout}
                        disabled={saving}
                    >
                        Sair da conta
                    </button>

                </div>

            </div>
        </div>
    );
}