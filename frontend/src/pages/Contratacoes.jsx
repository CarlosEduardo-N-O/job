import { useEffect, useState } from 'react';

import {
    getMinhasPublicacoes,
    cancelarPublicacao,
} from '../services/publicacaoService';

import {
    getContratacoes,
} from '../services/trabalhoService';

import Publicacao from '../components/publicacoes/Publicacao';

import NegociacoesModal from '../components/negociacoes/Negociacoes';

import Trabalhos from '../components/trabalhos/Trabalhos';

import '../styles/publicacoes.css';
import '../styles/negociacoes.css';
import '../styles/trabalhos.css';
import '../styles/trabalhos.css';
import '../styles/contratacoes.css';


export default function Contratacoes() {

    /* =====================================================
       PUBLICAÇÕES
    ===================================================== */

    const [publicacoes, setPublicacoes] =
        useState([]);


    /* =====================================================
       TRABALHOS / CONTRATAÇÕES
    ===================================================== */

    const [trabalhos, setTrabalhos] =
        useState([]);

    const [carregandoTrabalhos, setCarregandoTrabalhos] =
        useState(false);

    const [erroTrabalhos, setErroTrabalhos] =
        useState('');


    /* =====================================================
       ABA ATUAL
    ===================================================== */

    const [aba, setAba] =
        useState('publicacoes');


    /* =====================================================
       ESTADO DAS PUBLICAÇÕES
    ===================================================== */

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState('');


    /* =====================================================
       MODAL DE EDIÇÃO
    ===================================================== */

    const [
        publicacaoEditando,
        setPublicacaoEditando,
    ] = useState(null);


    /* =====================================================
       MODAL DE NEGOCIAÇÕES
    ===================================================== */

    const [
        publicacaoNegociacoes,
        setPublicacaoNegociacoes,
    ] = useState(null);


    /* =====================================================
       CARREGAR PUBLICAÇÕES AO ABRIR A PÁGINA
    ===================================================== */

    useEffect(() => {

        carregarPublicacoes();

    }, []);


    /* =====================================================
       CARREGAR CONTRATAÇÕES AO ENTRAR NA ABA
    ===================================================== */

    useEffect(() => {

        if (aba === 'contratacoes') {

            carregarTrabalhos();

        }

    }, [aba]);


    /* =====================================================
       PUBLICAÇÕES
    ===================================================== */

    async function carregarPublicacoes() {

        try {

            setCarregando(true);

            setErro('');


            const response =
                await getMinhasPublicacoes();


            const dados =
                response?.data ?? response;


            setPublicacoes(

                Array.isArray(dados)
                    ? dados
                    : []

            );

        } catch (error) {

            console.error(
                'Erro ao carregar publicações:',
                error
            );


            setErro(

                error?.response?.data?.message ||

                'Não foi possível carregar suas publicações.'

            );

        } finally {

            setCarregando(false);

        }
    }


    /* =====================================================
       TRABALHOS / CONTRATAÇÕES
    ===================================================== */

    async function carregarTrabalhos() {

        try {

            setCarregandoTrabalhos(true);

            setErroTrabalhos('');


            const response =
                await getContratacoes();


            /*
             * O controller retorna:
             *
             * {
             *     data: [...]
             * }
             *
             * Então normalmente response.data
             * já será o array.
             */

            let dados =
                response?.data ?? response;


            /*
             * Caso o service/axios retorne uma
             * estrutura adicional:
             *
             * {
             *     data: {
             *         data: [...]
             *     }
             * }
             */

            if (
                dados &&
                !Array.isArray(dados) &&
                Array.isArray(dados.data)
            ) {

                dados =
                    dados.data;

            }


            setTrabalhos(

                Array.isArray(dados)
                    ? dados
                    : []

            );

        } catch (error) {

            console.error(
                'Erro ao carregar contratações:',
                error
            );


            const mensagem =
                error?.response?.data?.message ||

                Object.values(
                    error?.response?.data?.errors || {}
                ).flat()[0] ||

                'Não foi possível carregar suas contratações.';


            setErroTrabalhos(
                mensagem
            );

        } finally {

            setCarregandoTrabalhos(false);

        }
    }


    /* =====================================================
       NOVA PUBLICAÇÃO
    ===================================================== */

    function abrirNovaPublicacao() {

        setPublicacaoEditando({});

    }


    /* =====================================================
       EDITAR PUBLICAÇÃO
    ===================================================== */

    function abrirEdicao(publicacao) {

        setPublicacaoEditando(
            publicacao
        );

    }


    /* =====================================================
       FECHAR EDIÇÃO
    ===================================================== */

    function fecharEdicao() {

        setPublicacaoEditando(null);

    }


    /* =====================================================
       ABRIR NEGOCIAÇÕES
    ===================================================== */

    function abrirNegociacoes(publicacao) {

        setPublicacaoNegociacoes(
            publicacao
        );

    }


    /* =====================================================
       FECHAR NEGOCIAÇÕES
    ===================================================== */

    function fecharNegociacoes() {

        setPublicacaoNegociacoes(null);

    }


    /* =====================================================
       PUBLICAÇÃO SALVA
    ===================================================== */

    function handlePublicacaoSalva(
        publicacaoSalva
    ) {

        /*
         * Se o modal não retornar a publicação,
         * simplesmente recarregamos.
         */

        if (!publicacaoSalva) {

            carregarPublicacoes();

            return;

        }


        setPublicacoes(
            (anterior) => {

                const existe =
                    anterior.some(
                        (publicacao) =>
                            publicacao.id ===
                            publicacaoSalva.id
                    );


                /*
                 * Nova publicação
                 */

                if (!existe) {

                    return [
                        publicacaoSalva,
                        ...anterior,
                    ];

                }


                /*
                 * Publicação existente
                 */

                return anterior.map(
                    (publicacao) =>

                        publicacao.id ===
                            publicacaoSalva.id

                            ? publicacaoSalva

                            : publicacao
                );

            }
        );

    }


    /* =====================================================
       CANCELAR PUBLICAÇÃO
    ===================================================== */

    async function cancelarPublicacaoHandler(
        publicacao
    ) {

        const confirmar =
            window.confirm(
                `Deseja realmente cancelar a publicação "${publicacao.titulo}"?`
            );


        if (!confirmar) {

            return;

        }


        try {

            await cancelarPublicacao(
                publicacao.id
            );


            /*
             * O backend retorna o status
             * como relacionamento.
             *
             * status: {
             *     codigo: "CANCELADO",
             *     nome: "Cancelado"
             * }
             */

            setPublicacoes(
                (anterior) =>

                    anterior.map(
                        (item) =>

                            item.id ===
                                publicacao.id

                                ? {
                                    ...item,

                                    status: {
                                        ...item.status,

                                        codigo:
                                            'CANCELADO',

                                        nome:
                                            'Cancelado',
                                    },
                                }

                                : item
                    )
            );

        } catch (error) {

            console.error(
                'Erro ao cancelar publicação:',
                error
            );


            window.alert(

                error?.response?.data?.message ||

                'Não foi possível cancelar a publicação.'

            );

        }

    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <main className="contratacoes-page">


            {/* =================================================
               CABEÇALHO
            ================================================= */}

            <header className="contratacoes-header">

                {/* =================================================
               ABAS
            ================================================= */}

                <div className="contratacoes-tabs">


                    {/* ---------------------------------------------
                   MINHAS PUBLICAÇÕES
                --------------------------------------------- */}

                    <button
                        type="button"
                        className={
                            aba === 'publicacoes'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba(
                                'publicacoes'
                            )
                        }
                    >
                        Minhas publicações
                    </button>


                    {/* ---------------------------------------------
                   CONTRATAÇÕES
                --------------------------------------------- */}

                    <button
                        type="button"
                        className={
                            aba === 'contratacoes'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba(
                                'contratacoes'
                            )
                        }
                    >
                        Contratações
                    </button>

                </div>

            </header>


            {/* =================================================
               ABA: MINHAS PUBLICAÇÕES
            ================================================= */}

            {aba === 'publicacoes' && (

                <section className="contratacoes-content">


                    {/* -----------------------------------------
                       TÍTULO
                    ----------------------------------------- */}

                    <div className="section-title">

                        <div>

                            <h2>
                                Minhas publicações
                            </h2>

                            <p>
                                Serviços publicados por você
                            </p>

                        </div>


                        <div className="section-title-acoes">

                            <span className="count">

                                {
                                    publicacoes.length
                                }

                            </span>


                            <button
                                type="button"
                                className="btn-nova-publicacao"
                                onClick={
                                    abrirNovaPublicacao
                                }
                            >

                                <span>
                                    +
                                </span>

                                Nova publicação

                            </button>

                        </div>

                    </div>


                    {/* -----------------------------------------
                       LOADING
                    ----------------------------------------- */}

                    {carregando && (

                        <div className="contratacoes-loading">

                            Carregando publicações...

                        </div>

                    )}


                    {/* -----------------------------------------
                       ERRO
                    ----------------------------------------- */}

                    {!carregando &&
                        erro && (

                            <div className="contratacoes-error">

                                {erro}

                            </div>

                        )}


                    {/* -----------------------------------------
                       VAZIO
                    ----------------------------------------- */}

                    {!carregando &&
                        !erro &&
                        publicacoes.length === 0 && (

                            <div className="contratacoes-empty">


                                <div className="empty-icon">
                                    📋
                                </div>


                                <h2>
                                    Nenhuma publicação
                                </h2>


                                <p>
                                    Você ainda não publicou nenhum serviço.
                                </p>


                                <button
                                    type="button"
                                    className="btn-nova-publicacao"
                                    onClick={
                                        abrirNovaPublicacao
                                    }
                                >

                                    <span>
                                        +
                                    </span>

                                    Criar primeira publicação

                                </button>

                            </div>

                        )}


                    {/* -----------------------------------------
                       LISTA DE PUBLICAÇÕES
                    ----------------------------------------- */}

                    {!carregando &&
                        !erro &&
                        publicacoes.length > 0 && (

                            <div className="contratacoes-list">

                                {publicacoes.map(
                                    (publicacao) => {


                                        const codigoStatus =
                                            publicacao.status?.codigo ??
                                            '';


                                        const nomeStatus =
                                            publicacao.status?.nome ??
                                            codigoStatus ??
                                            'Sem status';


                                        return (

                                            <article
                                                key={
                                                    publicacao.id
                                                }
                                                className="contratacao-publicacao-card"
                                            >


                                                {/* CABEÇALHO */}

                                                <div className="contratacao-card-header">

                                                    <div>

                                                        <h3>
                                                            {
                                                                publicacao.titulo
                                                            }
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

                                                        {
                                                            nomeStatus
                                                        }

                                                    </span>

                                                </div>


                                                {/* META */}

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


                                                {/* DESCRIÇÃO */}

                                                <div className="contratacao-card-descricao">

                                                    {
                                                        publicacao.descricao
                                                    }

                                                </div>


                                                {/* AÇÕES */}

                                                <div className="publicacao-acoes-contratacao">


                                                    <button
                                                        type="button"
                                                        className="btn-editar-publicacao"
                                                        onClick={() =>
                                                            abrirEdicao(
                                                                publicacao
                                                            )
                                                        }
                                                    >
                                                        ✏️ Editar
                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="btn-negociacoes-publicacao"
                                                        onClick={() =>
                                                            abrirNegociacoes(
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
                                                            cancelarPublicacaoHandler(
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
                                )}

                            </div>

                        )}

                </section>

            )}


            {/* =================================================
               ABA: CONTRATAÇÕES
            ================================================= */}

            {aba === 'contratacoes' && (

                <section className="contratacoes-content">


                    {/* -----------------------------------------
                       TÍTULO
                    ----------------------------------------- */}

                    <div className="section-title">

                        <div>

                            <h2>
                                Minhas contratações
                            </h2>

                            <p>
                                Serviços que você contratou
                            </p>

                        </div>


                        <div className="section-title-acoes">

                            <span className="count">

                                {
                                    trabalhos.length
                                }

                            </span>

                        </div>

                    </div>


                    {/* -----------------------------------------
                       CARREGANDO
                    ----------------------------------------- */}

                    {carregandoTrabalhos && (

                        <div className="contratacoes-loading">

                            Carregando contratações...

                        </div>

                    )}


                    {/* -----------------------------------------
                       ERRO
                    ----------------------------------------- */}

                    {!carregandoTrabalhos &&
                        erroTrabalhos && (

                            <div className="contratacoes-error">

                                <strong>
                                    Não foi possível carregar
                                    suas contratações.
                                </strong>

                                <p>
                                    {erroTrabalhos}
                                </p>


                                <button
                                    type="button"
                                    onClick={
                                        carregarTrabalhos
                                    }
                                >
                                    Tentar novamente
                                </button>

                            </div>

                        )}


                    {/* -----------------------------------------
                       NENHUMA CONTRATAÇÃO
                    ----------------------------------------- */}

                    {!carregandoTrabalhos &&
                        !erroTrabalhos &&
                        trabalhos.length === 0 && (

                            <div className="contratacoes-empty">


                                <div className="empty-icon">
                                    🤝
                                </div>


                                <h2>
                                    Nenhuma contratação
                                </h2>


                                <p>
                                    Suas contratações aparecerão
                                    aqui quando uma proposta for
                                    aceita e o pagamento for
                                    confirmado.
                                </p>

                            </div>

                        )}


                    {/* -----------------------------------------
                       LISTA DE CONTRATAÇÕES
                    ----------------------------------------- */}

                    {!carregandoTrabalhos &&
                        !erroTrabalhos &&
                        trabalhos.length > 0 && (

                            <Trabalhos
                                trabalhos={trabalhos}
                                papel="CONTRATANTE"
                                onAtualizado={carregarTrabalhos}
                            />

                        )}

                </section>

            )}


            {/* =================================================
               MODAL DE PUBLICAÇÃO
            ================================================= */}

            {publicacaoEditando !== null && (

                <Publicacao

                    modo="form"

                    publicacao={
                        publicacaoEditando.id
                            ? publicacaoEditando
                            : null
                    }

                    onClose={
                        fecharEdicao
                    }

                    onSaved={
                        handlePublicacaoSalva
                    }

                />

            )}


            {/* =================================================
               MODAL DE NEGOCIAÇÕES
            ================================================= */}

            {publicacaoNegociacoes !== null && (

                <NegociacoesModal

                    publicacao={
                        publicacaoNegociacoes
                    }

                    onClose={
                        fecharNegociacoes
                    }

                />

            )}

        </main>
    );
}


/* =============================================================
   FORMATAR VALOR
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


/* =============================================================
   FORMATAR DATA
============================================================= */

function formatarData(data) {

    if (!data) {

        return 'Não informada';

    }


    const valor =
        String(data);


    /*
     * Laravel pode retornar:
     *
     * 2026-09-18T00:00:00.000000Z
     *
     * Pegamos somente a parte
     * referente à data.
     */

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