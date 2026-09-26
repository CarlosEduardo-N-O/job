import { useEffect, useRef, useState } from 'react';

import {
    getAnexoPublicacao,
} from '../../services/publicacaoService';


/* =============================================================
   FORMATAÇÕES
============================================================= */

function formatarValor(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 'Não informado';
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return valor;
    }

    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}


function formatarData(data) {

    if (!data) {
        return 'Não informada';
    }

    const valor = String(data);

    const dataParte =
        valor.split('T')[0];

    const partes =
        dataParte.split('-');

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
}


function formatarTamanho(tamanho) {

    if (
        tamanho === null ||
        tamanho === undefined ||
        Number.isNaN(Number(tamanho))
    ) {
        return '';
    }

    const bytes = Number(tamanho);

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    }

    return `${(
        bytes /
        (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
}


/* =============================================================
   ANEXOS
============================================================= */

function AnexosOutrasPublicacoes({
    publicacao,
}) {

    const anexos =
        Array.isArray(publicacao?.anexos)
            ? publicacao.anexos
            : [];

    const [urls, setUrls] =
        useState({});

    const urlsRef =
        useRef({});

    const carrosselRef =
        useRef(null);

    const [anexoAtual, setAnexoAtual] =
        useState(0);

    const [anexoVisualizado, setAnexoVisualizado] =
        useState(null);

    const [carregandoAnexo, setCarregandoAnexo] =
        useState(null);


    /* =========================================================
       CARREGAR IMAGENS
    ========================================================= */

    useEffect(() => {

        if (
            !publicacao?.id ||
            !anexos.length
        ) {
            return;
        }

        let ativo = true;


        async function carregarImagens() {

            const imagens =
                anexos.filter(
                    (anexo) =>
                        anexo?.tipo === 'imagem'
                );


            for (const anexo of imagens) {

                if (
                    urlsRef.current[
                        anexo.id
                    ]
                ) {

                    setUrls(
                        (estadoAtual) => ({
                            ...estadoAtual,

                            [anexo.id]:
                                urlsRef.current[
                                    anexo.id
                                ],
                        })
                    );

                    continue;
                }


                try {

                    const resposta =
                        await getAnexoPublicacao(
                            publicacao.id,
                            anexo.id
                        );


                    if (!resposta) {
                        continue;
                    }


                    const blobImagem =
                        resposta instanceof Blob
                            ? resposta
                            : new Blob(
                                [resposta],
                                {
                                    type:
                                        anexo.mime_type ||
                                        'image/png',
                                }
                            );


                    if (!ativo) {
                        return;
                    }


                    const url =
                        URL.createObjectURL(
                            blobImagem
                        );


                    urlsRef.current[
                        anexo.id
                    ] = url;


                    setUrls(
                        (estadoAtual) => ({
                            ...estadoAtual,

                            [anexo.id]:
                                url,
                        })
                    );

                } catch (error) {

                    console.error(
                        'Erro ao carregar imagem:',
                        error
                    );

                }
            }
        }


        carregarImagens();


        return () => {
            ativo = false;
        };

    }, [
        publicacao?.id,

        anexos
            .map(
                (anexo) =>
                    `${anexo.id}-${anexo.tipo}-${anexo.mime_type}`
            )
            .join('|'),
    ]);


    /* =========================================================
       LIMPAR URLS
    ========================================================= */

    useEffect(() => {

        return () => {

            Object.values(
                urlsRef.current
            ).forEach(
                (url) => {

                    if (url) {
                        URL.revokeObjectURL(
                            url
                        );
                    }

                }
            );

            urlsRef.current = {};

        };

    }, []);


    /* =========================================================
       ATUALIZAR ÍNDICE
    ========================================================= */

    function atualizarIndice() {

        if (!carrosselRef.current) {
            return;
        }

        const elemento =
            carrosselRef.current;

        const largura =
            elemento.clientWidth;

        if (!largura) {
            return;
        }

        const indice =
            Math.round(
                elemento.scrollLeft /
                largura
            );

        setAnexoAtual(
            Math.max(
                0,
                Math.min(
                    indice,
                    anexos.length - 1
                )
            )
        );

    }


    /* =========================================================
       PRÓXIMO
    ========================================================= */

    function proximoAnexo() {

        if (
            !carrosselRef.current ||
            anexos.length <= 1
        ) {
            return;
        }

        const elemento =
            carrosselRef.current;

        const largura =
            elemento.clientWidth;

        const proximo =
            anexoAtual >=
            anexos.length - 1
                ? 0
                : anexoAtual + 1;


        elemento.scrollTo({

            left:
                proximo *
                largura,

            behavior:
                'smooth',

        });


        setAnexoAtual(
            proximo
        );

    }


    /* =========================================================
       ANTERIOR
    ========================================================= */

    function anexoAnterior() {

        if (
            !carrosselRef.current ||
            anexos.length <= 1
        ) {
            return;
        }

        const elemento =
            carrosselRef.current;

        const largura =
            elemento.clientWidth;

        const anterior =
            anexoAtual <= 0
                ? anexos.length - 1
                : anexoAtual - 1;


        elemento.scrollTo({

            left:
                anterior *
                largura,

            behavior:
                'smooth',

        });


        setAnexoAtual(
            anterior
        );

    }


    /* =========================================================
       SELECIONAR INDICADOR
    ========================================================= */

    function selecionarAnexo(indice) {

        if (!carrosselRef.current) {
            return;
        }

        const largura =
            carrosselRef.current.clientWidth;


        carrosselRef.current.scrollTo({

            left:
                indice *
                largura,

            behavior:
                'smooth',

        });


        setAnexoAtual(
            indice
        );

    }


    /* =========================================================
       ABRIR ANEXO
    ========================================================= */

    async function abrirAnexo(anexo) {

        if (!anexo?.id) {
            return;
        }


        try {

            setCarregandoAnexo(
                anexo.id
            );


            if (
                anexo.tipo === 'imagem' &&
                urlsRef.current[
                    anexo.id
                ]
            ) {

                setAnexoVisualizado({

                    ...anexo,

                    url:
                        urlsRef.current[
                            anexo.id
                        ],

                });

                return;
            }


            const resposta =
                await getAnexoPublicacao(
                    publicacao.id,
                    anexo.id
                );


            if (!resposta) {
                return;
            }


            const blobArquivo =
                resposta instanceof Blob
                    ? resposta
                    : new Blob(
                        [resposta],
                        {
                            type:
                                anexo.mime_type ||
                                'application/octet-stream',
                        }
                    );


            const url =
                URL.createObjectURL(
                    blobArquivo
                );


            setAnexoVisualizado({

                ...anexo,

                url,

            });

        } catch (error) {

            console.error(
                'Erro ao abrir anexo:',
                error
            );

        } finally {

            setCarregandoAnexo(
                null
            );

        }

    }


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    function fecharVisualizacao() {

        if (
            anexoVisualizado?.url &&
            !(
                anexoVisualizado.tipo ===
                    'imagem' &&
                urlsRef.current[
                    anexoVisualizado.id
                ] ===
                    anexoVisualizado.url
            )
        ) {

            URL.revokeObjectURL(
                anexoVisualizado.url
            );

        }


        setAnexoVisualizado(
            null
        );

    }


    /* =========================================================
       TECLADO
    ========================================================= */

    function handleTeclado(event) {

        if (
            event.key ===
            'ArrowLeft'
        ) {

            event.preventDefault();

            anexoAnterior();

        }


        if (
            event.key ===
            'ArrowRight'
        ) {

            event.preventDefault();

            proximoAnexo();

        }


        if (
            event.key ===
            'Escape'
        ) {

            event.preventDefault();

            fecharVisualizacao();

        }

    }


    if (!anexos.length) {
        return null;
    }


    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <>

            <div
                className="publicacao-anexos"
                tabIndex={0}
                onKeyDown={
                    handleTeclado
                }
            >

                <div className="publicacao-anexos-carrossel">

                    <div
                        ref={carrosselRef}
                        className="publicacao-anexos-trilho"
                        onScroll={
                            atualizarIndice
                        }
                    >

                        {anexos.map(
                            (anexo) => {

                                if (
                                    anexo.tipo ===
                                    'imagem'
                                ) {

                                    return (

                                        <div
                                            key={
                                                anexo.id
                                            }
                                            className="publicacao-anexo-slide"
                                        >

                                            <button
                                                type="button"
                                                className="publicacao-anexo-imagem"
                                                onClick={() =>
                                                    abrirAnexo(
                                                        anexo
                                                    )
                                                }
                                            >

                                                {urls[
                                                    anexo.id
                                                ] ? (

                                                    <img
                                                        src={
                                                            urls[
                                                                anexo.id
                                                            ]
                                                        }
                                                        alt={
                                                            anexo.nome_original ||
                                                            'Imagem da publicação'
                                                        }
                                                    />

                                                ) : (

                                                    <span className="publicacao-anexo-carregando">
                                                        Carregando...
                                                    </span>

                                                )}

                                            </button>

                                        </div>

                                    );

                                }


                                if (
                                    anexo.tipo ===
                                    'video'
                                ) {

                                    return (

                                        <div
                                            key={
                                                anexo.id
                                            }
                                            className="publicacao-anexo-slide"
                                        >

                                            <button
                                                type="button"
                                                className="publicacao-anexo-arquivo"
                                                onClick={() =>
                                                    abrirAnexo(
                                                        anexo
                                                    )
                                                }
                                                disabled={
                                                    carregandoAnexo ===
                                                    anexo.id
                                                }
                                            >

                                                <span className="publicacao-anexo-icone">
                                                    🎥
                                                </span>

                                                <span className="publicacao-anexo-info">

                                                    <strong>
                                                        {
                                                            anexo.nome_original
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            formatarTamanho(
                                                                anexo.tamanho
                                                            )
                                                        }
                                                    </small>

                                                </span>

                                            </button>

                                        </div>

                                    );

                                }


                                if (
                                    anexo.tipo ===
                                    'pdf'
                                ) {

                                    return (

                                        <div
                                            key={
                                                anexo.id
                                            }
                                            className="publicacao-anexo-slide"
                                        >

                                            <button
                                                type="button"
                                                className="publicacao-anexo-arquivo"
                                                onClick={() =>
                                                    abrirAnexo(
                                                        anexo
                                                    )
                                                }
                                                disabled={
                                                    carregandoAnexo ===
                                                    anexo.id
                                                }
                                            >

                                                <span className="publicacao-anexo-icone">
                                                    📄
                                                </span>

                                                <span className="publicacao-anexo-info">

                                                    <strong>
                                                        {
                                                            anexo.nome_original
                                                        }
                                                    </strong>

                                                    <small>
                                                        {
                                                            formatarTamanho(
                                                                anexo.tamanho
                                                            )
                                                        }
                                                    </small>

                                                </span>

                                            </button>

                                        </div>

                                    );

                                }


                                return null;

                            }
                        )}

                    </div>


                    {anexos.length > 1 && (

                        <>

                            <button
                                type="button"
                                className="publicacao-anexos-seta publicacao-anexos-seta-esquerda"
                                onClick={
                                    anexoAnterior
                                }
                                aria-label="Anexo anterior"
                            >
                                ‹
                            </button>


                            <button
                                type="button"
                                className="publicacao-anexos-seta publicacao-anexos-seta-direita"
                                onClick={
                                    proximoAnexo
                                }
                                aria-label="Próximo anexo"
                            >
                                ›
                            </button>

                        </>

                    )}

                </div>


                {anexos.length > 1 && (

                    <div className="publicacao-anexos-controles">

                        <div className="publicacao-anexos-indicadores">

                            {anexos.map(
                                (
                                    anexo,
                                    indice
                                ) => (

                                    <button
                                        key={
                                            anexo.id
                                        }
                                        type="button"
                                        className={
                                            `publicacao-anexo-indicador ${
                                                indice ===
                                                anexoAtual
                                                    ? 'ativo'
                                                    : ''
                                            }`
                                        }
                                        onClick={() =>
                                            selecionarAnexo(
                                                indice
                                            )
                                        }
                                        aria-label={`Ir para anexo ${indice + 1}`}
                                    />

                                )
                            )}

                        </div>


                        <span className="publicacao-anexos-contador">

                            {anexoAtual + 1}
                            {' / '}
                            {anexos.length}

                        </span>

                    </div>

                )}

            </div>


            {/* =====================================================
               MODAL DO ANEXO
            ===================================================== */}

            {anexoVisualizado && (

                <div
                    className="publicacao-anexo-modal"
                    role="dialog"
                    aria-modal="true"
                    onClick={
                        fecharVisualizacao
                    }
                >

                    <div
                        className="publicacao-anexo-modal-conteudo"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="publicacao-anexo-modal-header">

                            <strong>
                                {
                                    anexoVisualizado.nome_original
                                }
                            </strong>


                            <button
                                type="button"
                                onClick={
                                    fecharVisualizacao
                                }
                                aria-label="Fechar"
                            >
                                ×
                            </button>

                        </div>


                        <div className="publicacao-anexo-modal-body">

                            {anexoVisualizado.tipo ===
                                'imagem' && (

                                <img
                                    src={
                                        anexoVisualizado.url
                                    }
                                    alt={
                                        anexoVisualizado.nome_original
                                    }
                                />

                            )}


                            {anexoVisualizado.tipo ===
                                'video' && (

                                <video
                                    src={
                                        anexoVisualizado.url
                                    }
                                    controls
                                    autoPlay
                                />

                            )}


                            {anexoVisualizado.tipo ===
                                'pdf' && (

                                <iframe
                                    src={
                                        anexoVisualizado.url
                                    }
                                    title={
                                        anexoVisualizado.nome_original
                                    }
                                />

                            )}

                        </div>

                    </div>

                </div>

            )}

        </>
    );
}


/* =============================================================
   CARD DE OUTRA PUBLICAÇÃO
============================================================= */

export default function OutrasPublicacoes({
    publicacao,
}) {

    const statusCodigo =
        publicacao?.status?.codigo ?? '';


    const statusNome =
        publicacao?.status?.nome ??
        statusCodigo ??
        'Sem status';


    return (

        <article className="publicacao-card">

            <div className="publicacao-card-header">

                <div>

                    <h2>
                        {publicacao.titulo}
                    </h2>


                    {publicacao.categoria && (

                        <span className="publicacao-categoria">

                            {
                                publicacao
                                    .categoria
                                    .nome
                            }

                        </span>

                    )}

                </div>


                <span className="publicacao-status">

                    {statusNome}

                </span>

            </div>


            <div className="publicacao-card-body">

                <p className="publicacao-descricao">

                    {publicacao.descricao}

                </p>


                <AnexosOutrasPublicacoes
                    publicacao={
                        publicacao
                    }
                />


                <div className="publicacao-info">

                    <div>

                        <span>
                            Valor estimado
                        </span>

                        <strong>

                            {formatarValor(
                                publicacao.valor_estimado
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Data
                        </span>

                        <strong>

                            {formatarData(
                                publicacao.data_inicio
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Local
                        </span>

                        <strong>

                            {
                                publicacao.cidade ||
                                'Não informado'
                            }

                            {publicacao.estado
                                ? ` - ${publicacao.estado}`
                                : ''}

                        </strong>

                    </div>

                </div>


                {publicacao.contratante && (

                    <div className="publicacao-contratante">

                        <span>
                            Contratante
                        </span>

                        <strong>

                            {
                                publicacao
                                    .contratante
                                    .name
                            }

                        </strong>

                    </div>

                )}

            </div>

        </article>
    );
}