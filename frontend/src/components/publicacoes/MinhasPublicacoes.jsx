import { useEffect, useRef, useState } from 'react';

import {
    carregarAnexoComoUrl,
} from './publicacaoControle';


export default function MinhasPublicacoes({
    publicacoes,
    onEditar,
    onNegociacoes,
    onCancelar,
}) {

    if (!Array.isArray(publicacoes) || publicacoes.length === 0) {
        return null;
    }


    return (
        <div className="contratacoes-list">

            {publicacoes.map((publicacao) => (

                <MinhaPublicacaoCard
                    key={publicacao.id}
                    publicacao={publicacao}
                    onEditar={onEditar}
                    onNegociacoes={onNegociacoes}
                    onCancelar={onCancelar}
                />

            ))}

        </div>
    );
}


/* =============================================================
   CARD DA PUBLICAÇÃO
============================================================= */

function MinhaPublicacaoCard({
    publicacao,
    onEditar,
    onNegociacoes,
    onCancelar,
}) {

    const codigoStatus =
        publicacao?.status?.codigo ?? '';


    const nomeStatus =
        publicacao?.status?.nome ??
        codigoStatus ??
        'Sem status';


    return (
        <article className="contratacao-publicacao-card">


            {/* =================================================
               CABEÇALHO
            ================================================= */}

            <div className="contratacao-card-header">

                <div>

                    <h3>
                        {publicacao.titulo}
                    </h3>


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

                    {nomeStatus}

                </span>

            </div>


            {/* =================================================
               ANEXOS
            ================================================= */}

            <PublicacaoAnexos
                publicacao={publicacao}
            />


            {/* =================================================
               META
            ================================================= */}

            <div className="contratacao-card-meta">


                <div>

                    <span>
                        Valor
                    </span>

                    <strong>
                        {
                            formatarValor(
                                publicacao.valor_estimado
                            )
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Data
                    </span>

                    <strong>
                        {
                            formatarData(
                                publicacao.data_inicio
                            )
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Negociações
                    </span>

                    <strong>

                        {
                            publicacao
                                .negociacoes_count ??
                            0
                        }

                    </strong>

                </div>

            </div>


            {/* =================================================
               DESCRIÇÃO
            ================================================= */}

            <div className="contratacao-card-descricao">

                {publicacao.descricao}

            </div>


            {/* =================================================
               LOCAL
            ================================================= */}

            {(publicacao.cidade ||
                publicacao.estado ||
                publicacao.endereco_servico) && (

                    <div className="contratacao-card-local">

                        {publicacao.cidade && (

                            <div>

                                <span>
                                    Cidade
                                </span>

                                <strong>

                                    {publicacao.cidade}

                                    {publicacao.estado
                                        ? ` - ${publicacao.estado}`
                                        : ''}

                                </strong>

                            </div>

                        )}


                        {publicacao.endereco_servico && (

                            <div>

                                <span>
                                    Endereço
                                </span>

                                <strong>
                                    {
                                        publicacao
                                            .endereco_servico
                                    }
                                </strong>

                            </div>

                        )}

                    </div>

                )}


            {/* =================================================
               AÇÕES
            ================================================= */}

            <div className="publicacao-acoes-contratacao">


                <button
                    type="button"
                    className="btn-editar-publicacao"
                    onClick={() =>
                        onEditar?.(
                            publicacao
                        )
                    }
                    disabled={
                        codigoStatus === 'ENCERRADO'
                    }
                    title={
                        codigoStatus === 'ENCERRADO'
                            ? 'Publicação encerrada e não pode mais ser alterada.'
                            : 'Editar publicação'
                    }
                >
                    ✏️ Editar
                </button>


                <button
                    type="button"
                    className="btn-negociacoes-publicacao"
                    onClick={() =>
                        onNegociacoes?.(
                            publicacao
                        )
                    }
                >

                    🤝 Negociações

                    <span>

                        {
                            publicacao
                                .negociacoes_count ??
                            0
                        }

                    </span>

                </button>


                <button
                    type="button"
                    className="btn-cancelar-publicacao"
                    onClick={() =>
                        onCancelar?.(
                            publicacao
                        )
                    }
                    disabled={
                        codigoStatus !==
                        'ATIVO'
                    }
                >
                    ✕ Cancelar
                </button>

            </div>

        </article>
    );
}


/* =============================================================
   ANEXOS DA PUBLICAÇÃO
============================================================= */

function PublicacaoAnexos({
    publicacao,
}) {

    const anexos =
        Array.isArray(publicacao?.anexos)
            ? publicacao.anexos
            : [];


    const carrosselRef =
        useRef(null);


    const [urls, setUrls] =
        useState({});


    const [anexoSelecionado, setAnexoSelecionado] =
        useState(null);


    const [carregando, setCarregando] =
        useState(false);


    /*
     * Carrega as imagens para criar as URLs
     * autenticadas usando o endpoint do backend.
     */

    useEffect(() => {

        let ativo = true;

        const urlsCriadas = [];


        async function carregarImagens() {

            const imagens =
                anexos.filter(
                    (anexo) =>
                        anexo?.tipo ===
                        'imagem'
                );


            if (!imagens.length) {

                if (ativo) {
                    setUrls({});
                }

                return;
            }


            const novasUrls = {};


            for (const anexo of imagens) {

                try {

                    const url =
                        await carregarAnexoComoUrl(
                            publicacao.id,
                            anexo.id
                        );


                    urlsCriadas.push(url);


                    if (!ativo) {

                        URL.revokeObjectURL(
                            url
                        );

                        continue;
                    }


                    novasUrls[anexo.id] =
                        url;

                } catch (error) {

                    console.error(
                        'Erro ao carregar imagem do anexo:',
                        anexo.id,
                        error
                    );

                }

            }


            if (ativo) {

                setUrls(
                    novasUrls
                );

            }

        }


        carregarImagens();


        return () => {

            ativo = false;


            urlsCriadas.forEach(
                (url) => {

                    URL.revokeObjectURL(
                        url
                    );

                }
            );

        };

    }, [
        publicacao?.id,
        anexos
            .map(
                (anexo) =>
                    `${anexo.id}-${anexo.tipo}`
            )
            .join('|'),
    ]);


    /*
     * Não existe nenhum anexo.
     */

    if (!anexos.length) {
        return null;
    }


    /*
     * Abre qualquer tipo de anexo.
     */

    async function abrirAnexo(anexo) {

        try {

            setCarregando(
                true
            );


            const url =
                await carregarAnexoComoUrl(
                    publicacao.id,
                    anexo.id
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

            window.alert(
                'Não foi possível abrir este arquivo.'
            );

        } finally {

            setCarregando(
                false
            );

        }

    }


    function fecharAnexo() {

        if (
            anexoSelecionado?.url
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
     * Rola o carrossel através das setas.
     */

    function moverCarrossel(
        direcao
    ) {

        if (!carrosselRef.current) {
            return;
        }


        const largura =
            carrosselRef.current
                .clientWidth;


        carrosselRef.current.scrollBy({
            left:
                largura *
                direcao,
            behavior:
                'smooth',
        });

    }


    return (
        <>

            <div className="minhas-publicacoes-anexos">


                {/* =================================================
                   BOTÃO ESQUERDO
                ================================================= */}

                {anexos.length > 1 && (

                    <button
                        type="button"
                        className="anexo-carrossel-seta anexo-carrossel-esquerda"
                        onClick={() =>
                            moverCarrossel(-1)
                        }
                        aria-label="Ver anexos anteriores"
                    >
                        ‹
                    </button>

                )}


                {/* =================================================
                   CARROSSEL
                ================================================= */}

                <div
                    ref={carrosselRef}
                    className="anexo-carrossel"
                >

                    {anexos.map(
                        (anexo) => (

                            <div
                                className="anexo-slide"
                                key={
                                    anexo.id
                                }
                            >

                                {anexo.tipo ===
                                    'imagem' && (

                                        <button
                                            type="button"
                                            className="anexo-imagem-card"
                                            onClick={() =>
                                                abrirAnexo(
                                                    anexo
                                                )
                                            }
                                            title={`Visualizar ${anexo.nome_original}`}
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

                                                <div className="anexo-carregando">

                                                    Carregando imagem...

                                                </div>

                                            )}

                                        </button>

                                    )}


                                {anexo.tipo ===
                                    'video' && (

                                        <button
                                            type="button"
                                            className="anexo-arquivo-card"
                                            onClick={() =>
                                                abrirAnexo(
                                                    anexo
                                                )
                                            }
                                            disabled={
                                                carregando
                                            }
                                        >

                                            <span className="anexo-arquivo-icone">
                                                🎥
                                            </span>

                                            <div>

                                                <strong>
                                                    Vídeo
                                                </strong>

                                                <span>
                                                    {
                                                        anexo.nome_original
                                                    }
                                                </span>

                                                <small>
                                                    Clique para visualizar
                                                </small>

                                            </div>

                                        </button>

                                    )}


                                {anexo.tipo ===
                                    'pdf' && (

                                        <button
                                            type="button"
                                            className="anexo-arquivo-card"
                                            onClick={() =>
                                                abrirAnexo(
                                                    anexo
                                                )
                                            }
                                            disabled={
                                                carregando
                                            }
                                        >

                                            <span className="anexo-arquivo-icone">
                                                📄
                                            </span>

                                            <div>

                                                <strong>
                                                    Documento PDF
                                                </strong>

                                                <span>
                                                    {
                                                        anexo.nome_original
                                                    }
                                                </span>

                                                <small>
                                                    Clique para visualizar
                                                </small>

                                            </div>

                                        </button>

                                    )}

                            </div>

                        )
                    )}

                </div>


                {/* =================================================
                   BOTÃO DIREITO
                ================================================= */}

                {anexos.length > 1 && (

                    <button
                        type="button"
                        className="anexo-carrossel-seta anexo-carrossel-direita"
                        onClick={() =>
                            moverCarrossel(1)
                        }
                        aria-label="Ver próximos anexos"
                    >
                        ›
                    </button>

                )}

            </div>


            {/* =================================================
               INDICADOR
            ================================================= */}

            {anexos.length > 1 && (

                <div className="anexos-indicador">

                    <span>
                        {anexos.length}{' '}
                        {anexos.length === 1
                            ? 'anexo'
                            : 'anexos'}
                    </span>

                    <span>
                        ← arraste para ver mais →
                    </span>

                </div>

            )}


            {/* =================================================
               MODAL DO ANEXO
            ================================================= */}

            {anexoSelecionado && (

                <div
                    className="minha-publicacao-anexo-modal"
                    onClick={
                        fecharAnexo
                    }
                >

                    <div
                        className="minha-publicacao-anexo-modal-conteudo"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        <div className="minha-publicacao-anexo-modal-header">

                            <strong>
                                {
                                    anexoSelecionado
                                        .nome_original
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
                                            anexoSelecionado
                                                .nome_original
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
                                    >
                                        Seu navegador não suporta reprodução de vídeo.
                                    </video>

                                )}


                            {anexoSelecionado.tipo ===
                                'pdf' && (

                                    <iframe
                                        src={
                                            anexoSelecionado.url
                                        }
                                        title={
                                            anexoSelecionado
                                                .nome_original
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


    const numero =
        Number(valor);


    if (
        Number.isNaN(numero)
    ) {

        return valor;

    }


    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL',
        }
    );
}


function formatarData(data) {

    if (!data) {

        return 'Não informada';

    }


    const valor =
        String(data);


    const dataParte =
        valor.split('T')[0];


    const partes =
        dataParte.split('-');


    if (
        partes.length === 3
    ) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    return data;
}