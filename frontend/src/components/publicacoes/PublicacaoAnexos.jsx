import { useEffect, useRef, useState } from 'react';

import {
    getAnexosPublicacao,
    getAnexoPublicacao,
} from '../../services/publicacaoService';

import '../../styles/contratacoes.css';


export default function PublicacaoAnexos({
    publicacao,
}) {

    const publicacaoId =
        publicacao?.id;


    /*
     * =========================================================
     * ANEXOS RECEBIDOS
     * =========================================================
     */

    const anexosRecebidos =
        Array.isArray(publicacao?.anexos)
            ? publicacao.anexos
            : null;


    /*
     * =========================================================
     * ESTADOS
     * =========================================================
     */

    const [anexos, setAnexos] =
        useState(
            anexosRecebidos ?? []
        );


    const [carregando, setCarregando] =
        useState(
            !anexosRecebidos
        );


    const [urls, setUrls] =
        useState({});


    const [anexoSelecionado, setAnexoSelecionado] =
        useState(null);


    /*
     * IDs das imagens que ainda estão sendo carregadas.
     *
     * Exemplo:
     *
     * Set { 1, 2 }
     *
     * significa que as imagens 1 e 2 ainda
     * estão sendo carregadas.
     */

    const [imagensCarregando, setImagensCarregando] =
        useState(
            new Set()
        );


    /*
     * IDs das imagens que apresentaram erro.
     */

    const [imagensComErro, setImagensComErro] =
        useState(
            new Set()
        );


    /*
     * =========================================================
     * REFS
     * =========================================================
     */

    const carrosselRef =
        useRef(null);


    const urlsRef =
        useRef({});


    /*
     * =========================================================
     * ATUALIZAR ANEXOS RECEBIDOS
     * =========================================================
     */

    useEffect(() => {

        if (
            Array.isArray(
                publicacao?.anexos
            )
        ) {

            setAnexos(
                publicacao.anexos
            );

            setCarregando(false);

            return;

        }


        setAnexos([]);

        setCarregando(true);

    }, [
        publicacaoId,
        publicacao?.anexos,
    ]);


    /*
     * =========================================================
     * BUSCAR ANEXOS
     * =========================================================
     */

    useEffect(() => {

        /*
         * Se os anexos já vieram junto com a publicação,
         * não precisamos consultar a API novamente.
         */

        if (
            Array.isArray(
                publicacao?.anexos
            )
        ) {

            return;

        }


        if (!publicacaoId) {

            setAnexos([]);

            setCarregando(false);

            return;

        }


        let ativo = true;


        async function carregar() {

            try {

                setCarregando(true);


                const resposta =
                    await getAnexosPublicacao(
                        publicacaoId
                    );


                const dados =
                    resposta?.data ??
                    resposta ??
                    [];


                if (ativo) {

                    setAnexos(
                        Array.isArray(dados)
                            ? dados
                            : []
                    );

                }

            } catch (error) {

                console.error(
                    'Erro ao carregar anexos da publicação:',
                    error
                );


                if (ativo) {

                    setAnexos([]);

                }

            } finally {

                if (ativo) {

                    setCarregando(false);

                }

            }

        }


        carregar();


        return () => {

            ativo = false;

        };

    }, [
        publicacaoId,
        publicacao?.anexos,
    ]);


    /*
     * =========================================================
     * PREPARAR ESTADO DAS IMAGENS
     * =========================================================
     *
     * Assim que os anexos chegam, todas as imagens que ainda
     * não estão no cache entram no estado de carregamento.
     */

    useEffect(() => {

        if (!anexos.length) {

            setImagensCarregando(
                new Set()
            );

            return;

        }


        const idsImagens =
            anexos
                .filter(
                    (anexo) =>
                        anexo?.tipo === 'imagem'
                )
                .filter(
                    (anexo) =>
                        !urlsRef.current[anexo.id]
                )
                .map(
                    (anexo) =>
                        anexo.id
                );


        setImagensCarregando(
            new Set(idsImagens)
        );


        setImagensComErro(
            new Set()
        );

    }, [
        anexos,
    ]);


    /*
     * =========================================================
     * CARREGAR IMAGENS
     * =========================================================
     */

    useEffect(() => {

        if (
            !publicacaoId ||
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


            for (
                const anexo
                of imagens
            ) {

                /*
                 * Se já estiver em cache, não precisamos
                 * fazer uma nova requisição.
                 */

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


                    setImagensCarregando(
                        (estadoAtual) => {

                            const novoEstado =
                                new Set(
                                    estadoAtual
                                );

                            novoEstado.delete(
                                anexo.id
                            );

                            return novoEstado;

                        }
                    );


                    continue;

                }


                try {

                    const blob =
                        await getAnexoPublicacao(
                            publicacaoId,
                            anexo.id
                        );


                    if (!blob) {

                        throw new Error(
                            'O servidor não retornou o arquivo.'
                        );

                    }


                    const blobImagem =
                        blob instanceof Blob
                            ? blob
                            : new Blob(
                                [blob],
                                {
                                    type:
                                        anexo.mime_type ||
                                        'image/png',
                                }
                            );


                    const url =
                        URL.createObjectURL(
                            blobImagem
                        );


                    /*
                     * Se o componente já foi desmontado,
                     * não devemos manter a URL.
                     */

                    if (!ativo) {

                        URL.revokeObjectURL(
                            url
                        );

                        return;

                    }


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


                    /*
                     * A imagem terminou de ser carregada
                     * pelo nosso processo de busca.
                     */

                    setImagensCarregando(
                        (estadoAtual) => {

                            const novoEstado =
                                new Set(
                                    estadoAtual
                                );

                            novoEstado.delete(
                                anexo.id
                            );

                            return novoEstado;

                        }
                    );

                } catch (error) {

                    console.error(
                        `Erro ao carregar imagem ${anexo.id}:`,
                        error
                    );


                    if (!ativo) {

                        return;

                    }


                    /*
                     * Remove do loading.
                     */

                    setImagensCarregando(
                        (estadoAtual) => {

                            const novoEstado =
                                new Set(
                                    estadoAtual
                                );

                            novoEstado.delete(
                                anexo.id
                            );

                            return novoEstado;

                        }
                    );


                    /*
                     * Marca a imagem como erro.
                     */

                    setImagensComErro(
                        (estadoAtual) => {

                            const novoEstado =
                                new Set(
                                    estadoAtual
                                );

                            novoEstado.add(
                                anexo.id
                            );

                            return novoEstado;

                        }
                    );

                }

            }

        }


        carregarImagens();


        return () => {

            ativo = false;

        };

    }, [
        publicacaoId,
        anexos,
    ]);


    /*
     * =========================================================
     * LIMPAR URLs
     * =========================================================
     */

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


    /*
     * =========================================================
     * NAVEGAÇÃO
     * =========================================================
     */

    function navegar(
        direcao
    ) {

        if (
            !carrosselRef.current
        ) {

            return;

        }


        const elemento =
            carrosselRef.current;


        elemento.scrollBy({

            left:
                elemento.clientWidth *
                direcao,

            behavior:
                'smooth',

        });

    }


    /*
     * =========================================================
     * ABRIR ANEXO
     * =========================================================
     */

    async function abrirAnexo(
        anexo
    ) {

        try {

            /*
             * Imagem já carregada.
             */

            if (
                anexo.tipo === 'imagem' &&
                urlsRef.current[
                    anexo.id
                ]
            ) {

                setAnexoSelecionado({

                    ...anexo,

                    url:
                        urlsRef.current[
                            anexo.id
                        ],

                });

                return;

            }


            const blob =
                await getAnexoPublicacao(
                    publicacaoId,
                    anexo.id
                );


            const blobArquivo =
                blob instanceof Blob
                    ? blob
                    : new Blob(
                        [blob],
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


            setAnexoSelecionado({

                ...anexo,

                url,

            });

        } catch (error) {

            console.error(
                'Erro ao abrir anexo:',
                error
            );

        }

    }


    /*
     * =========================================================
     * FECHAR ANEXO
     * =========================================================
     */

    function fecharAnexo() {

        const urlEmCache =
            anexoSelecionado?.id &&
            urlsRef.current[
                anexoSelecionado.id
            ];


        if (
            anexoSelecionado?.url &&
            anexoSelecionado.url !==
                urlEmCache
        ) {

            URL.revokeObjectURL(
                anexoSelecionado.url
            );

        }


        setAnexoSelecionado(
            null
        );

    }


    /*
     * =========================================================
     * CARREGANDO ANEXOS
     * =========================================================
     *
     * Agora não retornamos null.
     *
     * O usuário vê um espaço reservado enquanto a API
     * ainda está buscando os anexos.
     */

    if (carregando) {

        return (

            <div className="minhas-publicacoes-anexos">

                <div className="anexo-carrossel">

                    <div className="anexo-slide">

                        <div className="anexo-carregando">

                            <span>
                                Carregando anexos...
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        );

    }


    /*
     * =========================================================
     * SEM ANEXOS
     * =========================================================
     */

    if (!anexos.length) {

        return null;

    }


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (

        <>

            <div className="minhas-publicacoes-anexos">

                <div
                    ref={carrosselRef}
                    className="anexo-carrossel"
                >

                    {anexos.map(
                        (
                            anexo
                        ) => {

                            const imagem =
                                anexo.tipo === 'imagem';


                            const url =
                                urls[
                                    anexo.id
                                ];


                            const carregandoImagem =
                                imagem &&
                                imagensCarregando.has(
                                    anexo.id
                                );


                            const imagemComErro =
                                imagem &&
                                imagensComErro.has(
                                    anexo.id
                                );


                            return (

                                <div
                                    key={
                                        anexo.id
                                    }
                                    className="anexo-slide"
                                >

                                    {imagem ? (

                                        /*
                                         * =================================================
                                         * IMAGEM
                                         * =================================================
                                         */

                                        url ? (

                                            <button
                                                type="button"
                                                className="anexo-imagem-card"
                                                onClick={() =>
                                                    abrirAnexo(
                                                        anexo
                                                    )
                                                }
                                            >

                                                <img
                                                    src={url}
                                                    alt={
                                                        anexo.nome_original ||
                                                        'Imagem da publicação'
                                                    }
                                                />

                                            </button>

                                        ) : (

                                            <div className="anexo-carregando">

                                                {carregandoImagem ? (

                                                    <span>
                                                        Carregando imagem...
                                                    </span>

                                                ) : imagemComErro ? (

                                                    <span>
                                                        Não foi possível carregar a imagem.
                                                    </span>

                                                ) : (

                                                    <span>
                                                        Preparando imagem...
                                                    </span>

                                                )}

                                            </div>

                                        )

                                    ) : (

                                        /*
                                         * =================================================
                                         * VÍDEO / PDF
                                         * =================================================
                                         */

                                        <button
                                            type="button"
                                            className="anexo-arquivo-card"
                                            onClick={() =>
                                                abrirAnexo(
                                                    anexo
                                                )
                                            }
                                        >

                                            <span className="anexo-arquivo-icone">

                                                {anexo.tipo ===
                                                    'video'
                                                    ? '▶'
                                                    : '📄'}

                                            </span>


                                            <div>

                                                <strong>

                                                    {anexo.tipo ===
                                                        'video'
                                                        ? 'Vídeo'
                                                        : 'PDF'}

                                                </strong>


                                                <span>

                                                    {
                                                        anexo.nome_original
                                                    }

                                                </span>


                                                <small>
                                                    Clique para abrir
                                                </small>

                                            </div>

                                        </button>

                                    )}

                                </div>

                            );

                        }
                    )}

                </div>


                {anexos.length > 1 && (

                    <>

                        <button
                            type="button"
                            className="anexo-carrossel-seta anexo-carrossel-esquerda"
                            onClick={() =>
                                navegar(-1)
                            }
                            aria-label="Anexo anterior"
                        >
                            ‹
                        </button>


                        <button
                            type="button"
                            className="anexo-carrossel-seta anexo-carrossel-direita"
                            onClick={() =>
                                navegar(1)
                            }
                            aria-label="Próximo anexo"
                        >
                            ›
                        </button>

                    </>

                )}


                <div className="anexos-indicador">

                    <span>

                        {anexos.length === 1
                            ? '1 anexo'
                            : `${anexos.length} anexos`}

                    </span>

                </div>

            </div>


            {/* =================================================
                MODAL
            ================================================= */}

            {anexoSelecionado && (

                <div
                    className="minha-publicacao-anexo-modal"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            fecharAnexo();

                        }

                    }}
                >

                    <div className="minha-publicacao-anexo-modal-conteudo">

                        <div className="minha-publicacao-anexo-modal-header">

                            <strong>

                                {
                                    anexoSelecionado.nome_original ||
                                    'Anexo'
                                }

                            </strong>


                            <button
                                type="button"
                                onClick={
                                    fecharAnexo
                                }
                                aria-label="Fechar"
                            >
                                ×
                            </button>

                        </div>


                        <div className="minha-publicacao-anexo-modal-body">

                            {anexoSelecionado.tipo ===
                                'imagem' && (

                                <img
                                    src={
                                        anexoSelecionado.url
                                    }
                                    alt={
                                        anexoSelecionado.nome_original ||
                                        'Imagem'
                                    }
                                />

                            )}


                            {anexoSelecionado.tipo ===
                                'video' && (

                                <video
                                    src={
                                        anexoSelecionado.url
                                    }
                                    controls
                                    autoPlay
                                />

                            )}


                            {anexoSelecionado.tipo ===
                                'pdf' && (

                                <iframe
                                    src={
                                        anexoSelecionado.url
                                    }
                                    title={
                                        anexoSelecionado.nome_original ||
                                        'PDF'
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