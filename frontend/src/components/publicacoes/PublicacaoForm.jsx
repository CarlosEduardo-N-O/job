import { useEffect, useState } from 'react';

import usePublicacaoControle from './publicacaoControle';

import {
    getAnexosPublicacao,
    getAnexoPublicacao,
    excluirAnexoPublicacao,
} from '../../services/publicacaoService';

import '../../styles/publicacoes.css';

export default function PublicacaoForm({
    publicacao,
    onClose,
    onSaved,
}) {
    const {
        modoEdicao,
        categorias,
        formulario,

        arquivos = [],

        carregando,
        salvando,
        erro,

        handleChange,
        handleArquivosChange,

        removerArquivo,

        handleSubmit,
        fechar,
    } = usePublicacaoControle({
        publicacao,
        onClose,
        onSaved,
    });

    /*
     * ================================================================
     * ESTADOS DOS ANEXOS
     * ================================================================
     */

    const [anexosExistentes, setAnexosExistentes] =
        useState([]);

    const [carregandoAnexos, setCarregandoAnexos] =
        useState(false);

    const [erroAnexos, setErroAnexos] =
        useState('');

    /*
     * ================================================================
     * ESTADOS DO CARROSSEL
     * ================================================================
     */

    const [previews, setPreviews] =
        useState([]);

    const [previewAtual, setPreviewAtual] =
        useState(0);

    /*
     * ================================================================
     * NORMALIZAÇÃO
     * ================================================================
     */

    const listaArquivos = Array.isArray(arquivos)
        ? arquivos
        : [];

    const listaCategorias =
        Array.isArray(categorias)
            ? categorias
            : [];

    const listaAnexosExistentes =
        Array.isArray(anexosExistentes)
            ? anexosExistentes
            : [];


    /*
     * ================================================================
     * CARREGAR ANEXOS EXISTENTES
     * ================================================================
     *
     * Primeiro buscamos a lista de metadados.
     *
     * Depois buscamos o arquivo físico de cada anexo
     * através do endpoint:
     *
     * GET /publicacoes/{publicacao}/anexos/{anexo}
     *
     * Como o backend mantém os arquivos privados,
     * precisamos receber o arquivo como Blob.
     */

    useEffect(() => {
        let cancelado = false;

        async function carregarAnexos() {
            /*
             * Se não estamos editando,
             * não existe anexo para carregar.
             */
            if (!publicacao?.id) {
                setAnexosExistentes([]);
                setCarregandoAnexos(false);
                return;
            }

            try {
                setCarregandoAnexos(true);
                setErroAnexos('');

                /*
                 * Busca os metadados.
                 */
                const response =
                    await getAnexosPublicacao(
                        publicacao.id
                    );

                if (cancelado) {
                    return;
                }

                /*
                 * O controller retorna:
                 *
                 * {
                 *     message: "...",
                 *     data: [...]
                 * }
                 */
                const dados =
                    Array.isArray(response)
                        ? response
                        : Array.isArray(response?.data)
                            ? response.data
                            : [];

                /*
                 * Ordena pela ordem cadastrada.
                 */
                const anexosOrdenados =
                    [...dados].sort(
                        (a, b) =>
                            Number(a.ordem ?? 0) -
                            Number(b.ordem ?? 0)
                    );

                /*
                 * Agora baixa os arquivos.
                 *
                 * Promise.all permite carregar
                 * todos simultaneamente.
                 */
                const anexosComUrl =
                    await Promise.all(
                        anexosOrdenados.map(
                            async (anexo) => {
                                try {
                                    const blob =
                                        await getAnexoPublicacao(
                                            publicacao.id,
                                            anexo.id
                                        );

                                    /*
                                     * Gera URL temporária
                                     * para imagem/vídeo.
                                     */
                                    const url =
                                        URL.createObjectURL(
                                            blob
                                        );

                                    return {
                                        id: anexo.id,

                                        nome:
                                            anexo.nome_original ||
                                            'Arquivo',

                                        tipo:
                                            anexo.mime_type ||
                                            blob.type ||
                                            '',

                                        tipoAnexo:
                                            anexo.tipo ||
                                            '',

                                        tamanho:
                                            Number(
                                                anexo.tamanho
                                            ) || blob.size || 0,

                                        ordem:
                                            Number(
                                                anexo.ordem
                                            ) || 0,

                                        url,

                                        blob,
                                    };
                                } catch (error) {
                                    console.error(
                                        `Erro ao carregar anexo ${anexo.id}:`,
                                        error
                                    );

                                    return null;
                                }
                            }
                        )
                    );

                if (cancelado) {
                    /*
                     * Se o componente foi desmontado
                     * enquanto os downloads estavam
                     * acontecendo, revoga as URLs.
                     */
                    anexosComUrl.forEach((anexo) => {
                        if (anexo?.url) {
                            URL.revokeObjectURL(
                                anexo.url
                            );
                        }
                    });

                    return;
                }

                /*
                 * Remove eventuais anexos que falharam.
                 */
                const anexosValidos =
                    anexosComUrl.filter(Boolean);

                setAnexosExistentes(
                    anexosValidos
                );

                /*
                 * Começa pelo primeiro arquivo.
                 */
                setPreviewAtual(0);

            } catch (error) {
                console.error(
                    'Erro ao carregar anexos da publicação:',
                    error
                );

                if (!cancelado) {
                    setErroAnexos(
                        obterMensagemErroAnexo(
                            error
                        )
                    );

                    setAnexosExistentes([]);
                }

            } finally {
                if (!cancelado) {
                    setCarregandoAnexos(false);
                }
            }
        }

        carregarAnexos();

        /*
         * Limpeza quando o componente é desmontado
         * ou quando muda a publicação.
         */
        return () => {
            cancelado = true;
        };

    }, [publicacao?.id]);


    /*
     * ================================================================
     * LIMPEZA DAS URLS DOS ANEXOS EXISTENTES
     * ================================================================
     */

    useEffect(() => {
        return () => {
            anexosExistentes.forEach((anexo) => {
                if (anexo?.url) {
                    URL.revokeObjectURL(
                        anexo.url
                    );
                }
            });
        };
    }, [anexosExistentes]);


    /*
     * ================================================================
     * MONTAR PREVIEWS
     * ================================================================
     */

    useEffect(() => {
        /*
         * Anexos já existentes.
         */
        const previewsExistentes =
            listaAnexosExistentes.map(
                (anexo) => ({
                    id: `existente-${anexo.id}`,

                    existente: true,

                    anexo,

                    arquivo: null,

                    url: anexo.url || '',

                    nome:
                        anexo.nome ||
                        anexo.nome_original ||
                        'Arquivo',

                    tipo:
                        anexo.tipo ||
                        anexo.mime_type ||
                        '',

                    tamanho:
                        Number(anexo.tamanho) || 0,
                })
            );


        /*
         * Arquivos novos.
         */
        const previewsNovos =
            listaArquivos.map(
                (arquivo, index) => ({
                    id:
                        `novo-${arquivo.name}-${arquivo.size}-${arquivo.lastModified}-${index}`,

                    existente: false,

                    anexo: null,

                    arquivo,

                    url:
                        URL.createObjectURL(
                            arquivo
                        ),

                    nome:
                        arquivo.name,

                    tipo:
                        arquivo.type,

                    tamanho:
                        arquivo.size,
                })
            );


        /*
         * Junta os dois tipos.
         */
        const novosPreviews = [
            ...previewsExistentes,
            ...previewsNovos,
        ];

        setPreviews(
            novosPreviews
        );


        /*
         * Mantém o índice válido.
         */
        setPreviewAtual((atual) => {
            if (
                novosPreviews.length === 0
            ) {
                return 0;
            }

            return Math.min(
                atual,
                novosPreviews.length - 1
            );
        });


        /*
         * Revoga somente as URLs criadas
         * para arquivos novos.
         */
        return () => {
            previewsNovos.forEach(
                (preview) => {
                    if (
                        preview.url
                    ) {
                        URL.revokeObjectURL(
                            preview.url
                        );
                    }
                }
            );
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        arquivos,
        anexosExistentes,
    ]);


    /*
     * ================================================================
     * FORMATAR TAMANHO
     * ================================================================
     */

    function formatarTamanho(
        tamanho
    ) {
        const valor =
            Number(tamanho) || 0;

        if (valor === 0) {
            return '0 KB';
        }

        if (valor < 1024) {
            return `${valor} B`;
        }

        if (
            valor <
            1024 * 1024
        ) {
            return `${(
                valor / 1024
            ).toFixed(1)} KB`;
        }

        return `${(
            valor /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }


    /*
     * ================================================================
     * IDENTIFICAR TIPO
     * ================================================================
     */

    function obterTipoArquivo(
        preview
    ) {
        if (!preview) {
            return 'arquivo';
        }

        const tipo =
            preview.tipo ||
            preview.arquivo?.type ||
            '';

        if (
            tipo.startsWith(
                'image/'
            )
        ) {
            return 'imagem';
        }

        if (
            tipo.startsWith(
                'video/'
            )
        ) {
            return 'video';
        }

        if (
            tipo ===
            'application/pdf'
        ) {
            return 'pdf';
        }

        return 'arquivo';
    }


    /*
     * ================================================================
     * NAVEGAÇÃO
     * ================================================================
     */

    function irParaAnterior() {
        if (
            previews.length <= 1
        ) {
            return;
        }

        setPreviewAtual(
            (atual) =>
                atual === 0
                    ? previews.length - 1
                    : atual - 1
        );
    }


    function irParaProximo() {
        if (
            previews.length <= 1
        ) {
            return;
        }

        setPreviewAtual(
            (atual) =>
                atual ===
                previews.length - 1
                    ? 0
                    : atual + 1
        );
    }


    /*
     * ================================================================
     * REMOVER ANEXO
     * ================================================================
     *
     * EXISTENTE:
     *     DELETE imediatamente na API.
     *
     * NOVO:
     *     apenas remove do formulário.
     */

    async function removerPreviewAtual() {
        if (
            !previews.length ||
            salvando
        ) {
            return;
        }

        const preview =
            previews[previewAtual];

        if (!preview) {
            return;
        }


        /*
         * ============================================================
         * ANEXO EXISTENTE
         * ============================================================
         */

        if (
            preview.existente
        ) {
            const anexoId =
                preview.anexo?.id;

            if (!anexoId) {
                return;
            }

            try {
                setErroAnexos('');

                /*
                 * Deixa o botão indisponível
                 * durante a requisição.
                 */
                const indiceAtual =
                    previewAtual;

                await excluirAnexoPublicacao(
                    publicacao.id,
                    anexoId
                );

                /*
                 * Revoga a URL local.
                 */
                if (
                    preview.url
                ) {
                    URL.revokeObjectURL(
                        preview.url
                    );
                }

                /*
                 * Remove do estado.
                 */
                setAnexosExistentes(
                    (anteriores) =>
                        anteriores.filter(
                            (anexo) =>
                                anexo.id !==
                                anexoId
                        )
                );

                /*
                 * Ajusta o índice.
                 */
                setPreviewAtual(
                    (atual) => {
                        if (
                            previews.length <=
                            1
                        ) {
                            return 0;
                        }

                        if (
                            indiceAtual >=
                            previews.length - 1
                        ) {
                            return Math.max(
                                0,
                                previews.length - 2
                            );
                        }

                        return indiceAtual;
                    }
                );

            } catch (error) {
                console.error(
                    'Erro ao excluir anexo:',
                    error
                );

                setErroAnexos(
                    obterMensagemErroAnexo(
                        error,
                        'Não foi possível excluir o arquivo.'
                    )
                );
            }

            return;
        }


        /*
         * ============================================================
         * ARQUIVO NOVO
         * ============================================================
         */

        const indiceArquivoNovo =
            previews
                .slice(
                    0,
                    previewAtual
                )
                .filter(
                    (item) =>
                        !item.existente
                )
                .length;

        if (
            indiceArquivoNovo >= 0 &&
            indiceArquivoNovo <
                listaArquivos.length
        ) {
            removerArquivo(
                indiceArquivoNovo
            );
        }
    }


    /*
     * ================================================================
     * TECLADO
     * ================================================================
     */

    function handlePreviewKeyDown(
        event
    ) {
        if (
            event.key ===
            'ArrowLeft'
        ) {
            event.preventDefault();
            irParaAnterior();
        }

        if (
            event.key ===
            'ArrowRight'
        ) {
            event.preventDefault();
            irParaProximo();
        }
    }


    /*
     * ================================================================
     * PREVIEW SELECIONADO
     * ================================================================
     */

    const previewSelecionado =
        previews[
            previewAtual
        ] || null;


    /*
     * ================================================================
     * QUANTIDADE
     * ================================================================
     */

    const quantidadeAnexos =
        listaAnexosExistentes.length +
        listaArquivos.length;

    const limiteArquivosAtingido =
        quantidadeAnexos >= 10;


    const tipoPreview =
        obterTipoArquivo(
            previewSelecionado
        );


    /*
     * ================================================================
     * MENSAGEM DE CARREGAMENTO
     * ================================================================
     */

    const telaCarregando =
        carregando ||
        carregandoAnexos;


    /*
     * ================================================================
     * RENDER
     * ================================================================
     */

    return (
        <div
            className="publicacao-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !salvando
                ) {
                    fechar();
                }
            }}
        >

            <div className="publicacao-modal">

                {/* ====================================================
                    CABEÇALHO
                ==================================================== */}

                <div className="publicacao-modal-header">

                    <div>

                        <h2>
                            {modoEdicao
                                ? 'Editar publicação'
                                : 'Nova publicação'}
                        </h2>

                        <p>
                            {modoEdicao
                                ? 'Atualize os dados do serviço.'
                                : 'Preencha os dados do serviço.'}
                        </p>

                    </div>


                    <button
                        type="button"
                        className="publicacao-modal-fechar"
                        onClick={fechar}
                        disabled={salvando}
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>


                {/* ====================================================
                    ERROS
                ==================================================== */}

                {erro && (
                    <div className="publicacao-modal-erro">
                        {erro}
                    </div>
                )}

                {erroAnexos && (
                    <div className="publicacao-modal-erro">
                        {erroAnexos}
                    </div>
                )}


                {/* ====================================================
                    CARREGANDO
                ==================================================== */}

                {telaCarregando ? (

                    <div className="publicacao-modal-loading">

                        <div>
                            {carregandoAnexos
                                ? 'Carregando imagens e arquivos...'
                                : 'Carregando...'}
                        </div>

                    </div>

                ) : (

                    <form
                        className="publicacao-modal-form"
                        onSubmit={handleSubmit}
                    >

                        {/* ====================================================
                            CATEGORIA
                        ==================================================== */}

                        <div className="publicacao-modal-campo">

                            <label htmlFor="categoria_id">
                                Categoria
                            </label>

                            <select
                                id="categoria_id"
                                name="categoria_id"
                                value={
                                    formulario?.categoria_id ??
                                    ''
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                disabled={
                                    salvando
                                }
                            >

                                <option value="">
                                    Selecione uma categoria
                                </option>

                                {listaCategorias.map(
                                    (categoria) => (
                                        <option
                                            key={
                                                categoria.id
                                            }
                                            value={
                                                categoria.id
                                            }
                                        >
                                            {
                                                categoria.nome
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        {/* ====================================================
                            TÍTULO
                        ==================================================== */}

                        <div className="publicacao-modal-campo">

                            <label htmlFor="titulo">
                                Título
                            </label>

                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                value={
                                    formulario?.titulo ??
                                    ''
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Ex.: Instalação elétrica"
                                maxLength={255}
                                required
                                disabled={
                                    salvando
                                }
                            />

                        </div>


                        {/* ====================================================
                            DESCRIÇÃO
                        ==================================================== */}

                        <div className="publicacao-modal-campo">

                            <label htmlFor="descricao">
                                Descrição
                            </label>

                            <textarea
                                id="descricao"
                                name="descricao"
                                value={
                                    formulario?.descricao ??
                                    ''
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Descreva o serviço..."
                                rows={5}
                                required
                                disabled={
                                    salvando
                                }
                            />

                        </div>


                        {/* ====================================================
                            ANEXOS
                        ==================================================== */}

                        <div className="publicacao-modal-campo">

                            <label htmlFor="arquivos">
                                Imagens e arquivos
                            </label>


                            <div className="publicacao-arquivos-input">

                                <input
                                    id="arquivos"
                                    name="arquivos"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"
                                    onChange={
                                        handleArquivosChange
                                    }
                                    disabled={
                                        salvando ||
                                        limiteArquivosAtingido
                                    }
                                    className="publicacao-arquivos-input-hidden"
                                />


                                <label
                                    htmlFor="arquivos"
                                    className={`publicacao-arquivos-btn ${
                                        salvando ||
                                        limiteArquivosAtingido
                                            ? 'disabled'
                                            : ''
                                    }`}
                                >

                                    <span className="publicacao-arquivos-btn-icon">
                                        ＋
                                    </span>

                                    <span>
                                        Adicionar arquivos
                                    </span>

                                </label>


                                <small>
                                    {quantidadeAnexos}{' '}
                                    de 10 arquivos
                                    selecionados.
                                    Imagens, vídeos e
                                    PDF. Até 100 MB
                                    por arquivo.
                                </small>

                            </div>


                            {/* ====================================================
                                CARROSSEL
                            ==================================================== */}

                            {previewSelecionado && (

                                <div
                                    className="publicacao-arquivos-carousel"
                                    tabIndex={0}
                                    onKeyDown={
                                        handlePreviewKeyDown
                                    }
                                >

                                    <div className="publicacao-arquivos-carousel-content">

                                        {/* ANTERIOR */}

                                        {previews.length >
                                            1 && (

                                            <button
                                                type="button"
                                                className="publicacao-arquivos-carousel-arrow publicacao-arquivos-carousel-arrow-left"
                                                onClick={
                                                    irParaAnterior
                                                }
                                                disabled={
                                                    salvando
                                                }
                                                aria-label="Arquivo anterior"
                                            >
                                                ‹
                                            </button>

                                        )}


                                        {/* ====================================================
                                            IMAGEM
                                        ==================================================== */}

                                        {tipoPreview ===
                                            'imagem' && (

                                            <div className="publicacao-arquivo-carousel-media">

                                                <img
                                                    src={
                                                        previewSelecionado.url
                                                    }
                                                    alt={
                                                        previewSelecionado.nome
                                                    }
                                                />

                                            </div>

                                        )}


                                        {/* ====================================================
                                            VÍDEO
                                        ==================================================== */}

                                        {tipoPreview ===
                                            'video' && (

                                            <div className="publicacao-arquivo-carousel-media">

                                                <video
                                                    src={
                                                        previewSelecionado.url
                                                    }
                                                    controls
                                                />

                                            </div>

                                        )}


                                        {/* ====================================================
                                            PDF
                                        ==================================================== */}

                                        {tipoPreview ===
                                            'pdf' && (

                                            <div className="publicacao-arquivo-carousel-pdf">

                                                <span>
                                                    📄
                                                </span>

                                                <strong>
                                                    PDF
                                                </strong>

                                                <small>
                                                    Arquivo PDF
                                                    selecionado
                                                </small>

                                            </div>

                                        )}


                                        {/* ====================================================
                                            ARQUIVO
                                        ==================================================== */}

                                        {tipoPreview ===
                                            'arquivo' && (

                                            <div className="publicacao-arquivo-carousel-pdf">

                                                <span>
                                                    📎
                                                </span>

                                                <strong>
                                                    Arquivo
                                                </strong>

                                                <small>
                                                    {
                                                        previewSelecionado.nome
                                                    }
                                                </small>

                                            </div>

                                        )}


                                        {/* PRÓXIMO */}

                                        {previews.length >
                                            1 && (

                                            <button
                                                type="button"
                                                className="publicacao-arquivos-carousel-arrow publicacao-arquivos-carousel-arrow-right"
                                                onClick={
                                                    irParaProximo
                                                }
                                                disabled={
                                                    salvando
                                                }
                                                aria-label="Próximo arquivo"
                                            >
                                                ›
                                            </button>

                                        )}

                                    </div>


                                    {/* ====================================================
                                        INFORMAÇÕES
                                    ==================================================== */}

                                    <div className="publicacao-arquivos-carousel-info">

                                        <div className="publicacao-arquivos-carousel-file-info">

                                            <strong
                                                title={
                                                    previewSelecionado.nome
                                                }
                                            >
                                                {
                                                    previewSelecionado.nome
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    formatarTamanho(
                                                        previewSelecionado.tamanho
                                                    )
                                                }
                                            </span>

                                        </div>


                                        <button
                                            type="button"
                                            className="publicacao-arquivo-remover"
                                            onClick={
                                                removerPreviewAtual
                                            }
                                            disabled={
                                                salvando
                                            }
                                            aria-label={`Remover ${previewSelecionado.nome}`}
                                            title="Remover arquivo"
                                        >
                                            ×
                                        </button>

                                    </div>


                                    {/* ====================================================
                                        DOTS
                                    ==================================================== */}

                                    {previews.length >
                                        1 && (

                                        <div className="publicacao-arquivos-carousel-dots">

                                            {previews.map(
                                                (
                                                    preview,
                                                    index
                                                ) => (

                                                    <button
                                                        key={
                                                            preview.id
                                                        }
                                                        type="button"
                                                        className={`publicacao-arquivos-carousel-dot ${
                                                            index ===
                                                            previewAtual
                                                                ? 'active'
                                                                : ''
                                                        }`}
                                                        onClick={() =>
                                                            setPreviewAtual(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            salvando
                                                        }
                                                        aria-label={`Mostrar arquivo ${index + 1}`}
                                                    />

                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            )}


                            {/* ====================================================
                                SEM ANEXOS
                            ==================================================== */}

                            {!previewSelecionado &&
                                !carregandoAnexos && (
                                    <div className="publicacao-arquivos-sem-preview">
                                        Nenhum arquivo selecionado.
                                    </div>
                                )}

                        </div>


                        {/* ====================================================
                            VALOR / DATA
                        ==================================================== */}

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="valor_estimado">
                                    Valor estimado
                                </label>

                                <input
                                    id="valor_estimado"
                                    name="valor_estimado"
                                    type="number"
                                    value={
                                        formulario?.valor_estimado ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>


                            <div className="publicacao-modal-campo">

                                <label htmlFor="data_inicio">
                                    Data de início
                                </label>

                                <input
                                    id="data_inicio"
                                    name="data_inicio"
                                    type="date"
                                    value={
                                        formulario?.data_inicio ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>

                        </div>


                        {/* ====================================================
                            CIDADE / ESTADO
                        ==================================================== */}

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="cidade">
                                    Cidade
                                </label>

                                <input
                                    id="cidade"
                                    name="cidade"
                                    type="text"
                                    value={
                                        formulario?.cidade ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Ex.: Rio do Sul"
                                    maxLength={255}
                                    required
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>


                            <div className="publicacao-modal-campo">

                                <label htmlFor="estado">
                                    Estado
                                </label>

                                <input
                                    id="estado"
                                    name="estado"
                                    type="text"
                                    value={
                                        formulario?.estado ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="SC"
                                    maxLength={2}
                                    required
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>

                        </div>


                        {/* ====================================================
                            ENDEREÇO
                        ==================================================== */}

                        <div className="publicacao-modal-campo">

                            <label htmlFor="endereco_servico">
                                Endereço do serviço
                            </label>

                            <input
                                id="endereco_servico"
                                name="endereco_servico"
                                type="text"
                                value={
                                    formulario?.endereco_servico ??
                                    ''
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Rua, número, bairro..."
                                maxLength={255}
                                disabled={
                                    salvando
                                }
                            />

                        </div>


                        {/* ====================================================
                            HORÁRIO / DATA FIM
                        ==================================================== */}

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="horario_inicio">
                                    Horário de início
                                </label>

                                <input
                                    id="horario_inicio"
                                    name="horario_inicio"
                                    type="time"
                                    value={
                                        formulario?.horario_inicio ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>


                            <div className="publicacao-modal-campo">

                                <label htmlFor="data_fim">
                                    Data de término
                                </label>

                                <input
                                    id="data_fim"
                                    name="data_fim"
                                    type="date"
                                    value={
                                        formulario?.data_fim ??
                                        ''
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        salvando
                                    }
                                />

                            </div>

                        </div>


                        {/* ====================================================
                            AÇÕES
                        ==================================================== */}

                        <div className="publicacao-modal-acoes">

                            <button
                                type="button"
                                className="publicacao-modal-btn-cancelar"
                                onClick={
                                    fechar
                                }
                                disabled={
                                    salvando
                                }
                            >
                                Fechar
                            </button>


                            <button
                                type="submit"
                                className="publicacao-modal-btn-salvar"
                                disabled={
                                    salvando
                                }
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : modoEdicao
                                        ? 'Salvar alterações'
                                        : 'Publicar serviço'}
                            </button>

                        </div>

                    </form>

                )}

            </div>

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function obterMensagemErroAnexo(
    error,
    mensagemPadrao = 'Não foi possível carregar os anexos.'
) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        mensagemPadrao
    );
}