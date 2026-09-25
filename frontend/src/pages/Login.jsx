import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
    const navigate = useNavigate();

    const {
        login,
        isAuthenticated,
    } = useAuth();

    // =========================
    // LOGIN
    // =========================

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // =========================
    // MODAL CADASTRO
    // =========================

    const [mostrarCadastro, setMostrarCadastro] = useState(false);

    const [cadastro, setCadastro] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        telefone: '',
        cidade: '',
        estado: '',
        categoria_ids: [],
    });

    const [categorias, setCategorias] = useState([]);
    const [categoriasLoading, setCategoriasLoading] =
        useState(false);

    const [cadastroError, setCadastroError] =
        useState('');

    const [cadastroLoading, setCadastroLoading] =
        useState(false);

    // Referência para navegação horizontal das categorias
    const categoriasContainerRef = useRef(null);

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

    async function carregarCategorias() {
        setCategoriasLoading(true);
        setCadastroError('');

        try {
            const response =
                await api.get('/categorias');

            setCategorias(
                response.data?.data || []
            );
        } catch (error) {
            console.error(
                'Erro ao carregar categorias:',
                error
            );

            setCategorias([]);

            setCadastroError(
                'Não foi possível carregar as categorias.'
            );
        } finally {
            setCategoriasLoading(false);
        }
    }

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
            categoria_ids: [],
        });

        setMostrarCadastro(true);

        carregarCategorias();
    }

    function fecharCadastro() {
        if (!cadastroLoading) {
            setMostrarCadastro(false);
            setCadastroError('');
        }
    }

    function handleCadastroChange(event) {
        const {
            name,
            value,
        } = event.target;

        setCadastro((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // =========================
    // SELEÇÃO DE CATEGORIAS
    // =========================

    function selecionarCategoria(categoriaId) {
        if (cadastroLoading) {
            return;
        }

        setCadastro((prev) => {
            const id = Number(categoriaId);

            const jaSelecionada =
                prev.categoria_ids.includes(id);

            const novosIds = jaSelecionada
                ? prev.categoria_ids.filter(
                    (item) => item !== id
                )
                : [
                    ...prev.categoria_ids,
                    id,
                ];

            return {
                ...prev,
                categoria_ids: novosIds,
            };
        });

        setCadastroError('');
    }

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

    // =========================
    // ENVIAR CADASTRO
    // =========================

    async function handleCadastro(event) {
        event.preventDefault();

        setCadastroError('');

        // Validação das categorias
        if (
            !cadastro.categoria_ids ||
            cadastro.categoria_ids.length === 0
        ) {
            setCadastroError(
                'Selecione pelo menos uma categoria.'
            );

            return;
        }

        // Validação local das senhas
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
            // 1. Cria o usuário
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

            // 2. Faz login automaticamente
            await login(
                cadastro.email,
                cadastro.password
            );

            // 3. Vincula as categorias selecionadas
            //
            // O login já deixou o Axios autenticado.
            // Cada categoria é enviada separadamente para o endpoint
            // que já existe no backend.
            for (const categoriaId of cadastro.categoria_ids) {
                try {
                    await api.post('/users-categorias', {
                        categoria_id: categoriaId,
                    });
                } catch (error) {
                    // O usuário já foi criado e autenticado.
                    // Se uma categoria falhar, não impede o cadastro.
                    console.error(
                        `Erro ao vincular categoria ${categoriaId}:`,
                        error
                    );
                }
            }

            // 4. Finaliza o cadastro normalmente
            setMostrarCadastro(false);

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
                    error.response?.data?.message ||
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
                        <h1>
                            Bem-vindo ao JOB
                        </h1>

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
                                    setEmail(
                                        event.target.value
                                    )
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
                                    setPassword(
                                        event.target.value
                                    )
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
                            event.target ===
                            event.currentTarget &&
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
                                disabled={
                                    cadastroLoading
                                }
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
                                    value={
                                        cadastro.name
                                    }
                                    onChange={
                                        handleCadastroChange
                                    }
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
                                    value={
                                        cadastro.email
                                    }
                                    onChange={
                                        handleCadastroChange
                                    }
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
                                        value={
                                            cadastro.telefone
                                        }
                                        onChange={
                                            handleCadastroChange
                                        }
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
                                        value={
                                            cadastro.estado
                                        }
                                        onChange={
                                            handleCadastroChange
                                        }
                                    >
                                        <option value="">
                                            UF
                                        </option>

                                        <option value="AC">
                                            AC
                                        </option>
                                        <option value="AL">
                                            AL
                                        </option>
                                        <option value="AP">
                                            AP
                                        </option>
                                        <option value="AM">
                                            AM
                                        </option>
                                        <option value="BA">
                                            BA
                                        </option>
                                        <option value="CE">
                                            CE
                                        </option>
                                        <option value="DF">
                                            DF
                                        </option>
                                        <option value="ES">
                                            ES
                                        </option>
                                        <option value="GO">
                                            GO
                                        </option>
                                        <option value="MA">
                                            MA
                                        </option>
                                        <option value="MT">
                                            MT
                                        </option>
                                        <option value="MS">
                                            MS
                                        </option>
                                        <option value="MG">
                                            MG
                                        </option>
                                        <option value="PA">
                                            PA
                                        </option>
                                        <option value="PB">
                                            PB
                                        </option>
                                        <option value="PR">
                                            PR
                                        </option>
                                        <option value="PE">
                                            PE
                                        </option>
                                        <option value="PI">
                                            PI
                                        </option>
                                        <option value="RJ">
                                            RJ
                                        </option>
                                        <option value="RN">
                                            RN
                                        </option>
                                        <option value="RS">
                                            RS
                                        </option>
                                        <option value="RO">
                                            RO
                                        </option>
                                        <option value="RR">
                                            RR
                                        </option>
                                        <option value="SC">
                                            SC
                                        </option>
                                        <option value="SP">
                                            SP
                                        </option>
                                        <option value="SE">
                                            SE
                                        </option>
                                        <option value="TO">
                                            TO
                                        </option>
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
                                    value={
                                        cadastro.cidade
                                    }
                                    onChange={
                                        handleCadastroChange
                                    }
                                    autoComplete="address-level2"
                                />
                            </div>

                            {/* =========================
                                CATEGORIAS
                            ========================= */}

                            <div className="cadastro-form-group cadastro-categoria-group">

                                <div className="cadastro-categoria-header">
                                    <div>
                                        <label>
                                            Categorias
                                        </label>

                                        <p>
                                            Selecione uma ou mais
                                            categorias de serviços
                                            que você pode realizar.
                                        </p>
                                    </div>

                                    {categorias.length >
                                        6 && (
                                            <div className="cadastro-categoria-navigation">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navegarCategorias(
                                                            'esquerda'
                                                        )
                                                    }
                                                    disabled={
                                                        categoriasLoading ||
                                                        cadastroLoading
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
                                                    disabled={
                                                        categoriasLoading ||
                                                        cadastroLoading
                                                    }
                                                    aria-label="Ver mais categorias"
                                                >
                                                    ›
                                                </button>

                                            </div>
                                        )}
                                </div>

                                <div className="cadastro-categorias-wrapper">

                                    {categoriasLoading ? (
                                        <div className="cadastro-categorias-loading">
                                            <div className="loading-spinner" />

                                            <span>
                                                Carregando
                                                categorias...
                                            </span>
                                        </div>
                                    ) : categorias.length ===
                                        0 ? (
                                        <p className="cadastro-categorias-empty">
                                            Nenhuma categoria
                                            disponível.
                                        </p>
                                    ) : (
                                        <div
                                            className="cadastro-categories-list"
                                            ref={
                                                categoriasContainerRef
                                            }
                                        >
                                            {categorias.map(
                                                (
                                                    categoria
                                                ) => {
                                                    const selecionada =
                                                        cadastro.categoria_ids.includes(
                                                            Number(
                                                                categoria.id
                                                            )
                                                        );

                                                    return (
                                                        <button
                                                            key={
                                                                categoria.id
                                                            }
                                                            type="button"
                                                            className={
                                                                selecionada
                                                                    ? 'category-item selected'
                                                                    : 'category-item'
                                                            }
                                                            onClick={() =>
                                                                selecionarCategoria(
                                                                    categoria.id
                                                                )
                                                            }
                                                            disabled={
                                                                cadastroLoading
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
                                                                {selecionada
                                                                    ? '✓'
                                                                    : '+'}
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}

                                </div>

                                {cadastro.categoria_ids.length >
                                    0 && (
                                        <div className="cadastro-categorias-selecionadas">
                                            {
                                                cadastro
                                                    .categoria_ids
                                                    .length
                                            }{' '}
                                            {cadastro
                                                .categoria_ids
                                                .length === 1
                                                ? 'categoria selecionada'
                                                : 'categorias selecionadas'}
                                        </div>
                                    )}

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
                                        value={
                                            cadastro.password
                                        }
                                        onChange={
                                            handleCadastroChange
                                        }
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
                                        value={
                                            cadastro.password_confirmation
                                        }
                                        onChange={
                                            handleCadastroChange
                                        }
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
                                    onClick={
                                        fecharCadastro
                                    }
                                    disabled={
                                        cadastroLoading
                                    }
                                >
                                    Voltar
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={
                                        cadastroLoading ||
                                        categoriasLoading ||
                                        categorias.length ===
                                        0
                                    }
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