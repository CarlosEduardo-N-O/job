import { useEffect, useState } from 'react';

import {
    getMinhasNegociacoes,
} from '../services/negociacaoService';

import {
    getMeusTrabalhos,
} from '../services/trabalhoService';

import Negociacoes
    from '../components/negociacoes/Negociacoes';

import TrabalhoCard
    from '../components/trabalhos/TrabalhoCard';

import "../styles/trabalhos.css";


export default function Trabalhos() {

    /* ============================================================
       NEGOCIAÇÕES
       ============================================================ */

    const [negociacoes, setNegociacoes] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState('');

    const [
        negociacaoSelecionada,
        setNegociacaoSelecionada,
    ] = useState(null);


    /* ============================================================
       TRABALHOS
       Usuário como CONTRATADO
       ============================================================ */

    const [trabalhos, setTrabalhos] =
        useState([]);

    const [carregandoTrabalhos, setCarregandoTrabalhos] =
        useState(false);

    const [erroTrabalhos, setErroTrabalhos] =
        useState('');


    /* ============================================================
       ABA ATUAL
       ============================================================ */

    const [aba, setAba] =
        useState('negociacoes');


    /* ============================================================
       CARREGAMENTO INICIAL
       ============================================================ */

    useEffect(() => {

        carregarNegociacoes();

    }, []);


    /* ============================================================
       CARREGAR TRABALHOS AO ABRIR A ABA
       ============================================================ */

    useEffect(() => {

        if (aba === 'trabalhos') {

            carregarTrabalhos();

        }

    }, [aba]);


    /* ============================================================
       CARREGAR NEGOCIAÇÕES
       ============================================================ */

    async function carregarNegociacoes() {

        try {

            setCarregando(true);
            setErro('');

            const response =
                await getMinhasNegociacoes();

            const dados =
                Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : [];

            setNegociacoes(dados);

        } catch (error) {

            console.error(
                'Erro ao carregar negociações:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível carregar suas negociações.'
            );

        } finally {

            setCarregando(false);

        }
    }


    /* ============================================================
       CARREGAR TRABALHOS
       GET /api/trabalhos/meus
       Usuário é o CONTRATADO
       ============================================================ */

    async function carregarTrabalhos() {

        try {

            setCarregandoTrabalhos(true);
            setErroTrabalhos('');

            const response =
                await getMeusTrabalhos();

            let dados =
                response?.data ??
                response;

            /*
             * Trata também respostas no formato:
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
                'Erro ao carregar trabalhos:',
                error
            );

            setErroTrabalhos(
                error?.response?.data?.message ||
                Object.values(
                    error?.response?.data?.errors || {}
                ).flat()[0] ||
                'Não foi possível carregar seus trabalhos.'
            );

        } finally {

            setCarregandoTrabalhos(false);

        }
    }


    /* ============================================================
       ABRIR NEGOCIAÇÃO
       ============================================================ */

    function abrirNegociacao(negociacao) {

        if (
            !negociacao?.id_negociacao
        ) {

            console.error(
                'Negociação inválida:',
                negociacao
            );

            return;
        }

        setNegociacaoSelecionada(
            negociacao
        );
    }


    /* ============================================================
       FECHAR NEGOCIAÇÃO
       ============================================================ */

    function fecharNegociacao() {

        setNegociacaoSelecionada(
            null
        );

        carregarNegociacoes();

    }


    /* ============================================================
       FORMATAÇÃO
       ============================================================ */

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


    /* ============================================================
       STATUS DA NEGOCIAÇÃO
       ============================================================ */

    function obterNomeStatus(
        negociacao
    ) {

        if (!negociacao) {

            return 'Não informado';

        }

        if (
            negociacao.status &&
            typeof negociacao.status ===
            'object'
        ) {

            return (
                negociacao.status.nome ||
                formatarStatus(
                    negociacao.status.codigo
                )
            );

        }

        return formatarStatus(
            negociacao.status
        );

    }


    function formatarStatus(status) {

        const statusMap = {

            AGUARDANDO_INTERESSADO:
                'Aguardando interessado',

            AGUARDANDO_CONTRATANTE:
                'Aguardando contratante',

            AGUARDANDO_PAGAMENTO:
                'Aguardando pagamento',

            PROCESSANDO_PAGAMENTO:
                'Processando pagamento',

            FECHADA:
                'Fechada',

            ENCERRADA:
                'Encerrada',

            CANCELADA:
                'Cancelada',

        };

        return (
            statusMap[status] ||
            status ||
            'Não informado'
        );

    }


    /* ============================================================
       RENDER
       ============================================================ */

    return (

        <main className="contratacoes-page">

            {/* ====================================================
               CABEÇALHO / ABAS
            ==================================================== */}

            <header className="contratacoes-header">

                <div className="contratacoes-tabs">

                    <button
                        type="button"
                        className={
                            aba === 'negociacoes'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba('negociacoes')
                        }
                    >
                        Negociações
                    </button>


                    <button
                        type="button"
                        className={
                            aba === 'trabalhos'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba('trabalhos')
                        }
                    >
                        Trabalhos
                    </button>

                </div>

            </header>


            {/* ====================================================
               ABA NEGOCIAÇÕES
            ==================================================== */}

            {aba === 'negociacoes' && (

                <section className="contratacoes-content">

                    <div className="section-title">

                        <div>

                            <h2>
                                Minhas negociações
                            </h2>

                            <p>
                                Publicações nas quais você demonstrou interesse
                            </p>

                        </div>


                        <div className="section-title-acoes">

                            <span className="count">

                                {
                                    negociacoes.length
                                }

                            </span>

                        </div>

                    </div>


                    {/* LOADING */}

                    {carregando && (

                        <div className="contratacoes-loading">

                            Carregando negociações...

                        </div>

                    )}


                    {/* ERRO */}

                    {!carregando &&
                        erro && (

                            <div className="contratacoes-error">

                                {erro}

                            </div>

                        )}


                    {/* VAZIO */}

                    {!carregando &&
                        !erro &&
                        negociacoes.length === 0 && (

                            <div className="contratacoes-empty">

                                <div className="empty-icon">
                                    🤝
                                </div>

                                <h2>
                                    Nenhuma negociação
                                </h2>

                                <p>
                                    As publicações nas quais você
                                    demonstrar interesse aparecerão
                                    aqui quando uma negociação for criada.
                                </p>

                            </div>

                        )}


                    {/* LISTA */}

                    {!carregando &&
                        !erro &&
                        negociacoes.length > 0 && (

                            <div className="contratacoes-list">

                                {negociacoes.map(
                                    (negociacao) => {

                                        const publicacao =
                                            negociacao.publicacao;

                                        return (

                                            <article
                                                key={
                                                    negociacao.id_negociacao
                                                }
                                                className="contratacao-publicacao-card"
                                            >

                                                {/* CABEÇALHO */}

                                                <div className="contratacao-card-header">

                                                    <div>

                                                        <h3>
                                                            {
                                                                publicacao?.titulo ||
                                                                'Publicação'
                                                            }
                                                        </h3>


                                                        {publicacao?.categoria && (

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

                                                        {obterNomeStatus(
                                                            negociacao
                                                        )}

                                                    </span>

                                                </div>


                                                {/* META */}

                                                <div className="contratacao-card-meta">

                                                    <div>

                                                        <span>
                                                            Valor
                                                        </span>

                                                        <strong>

                                                            {formatarValor(
                                                                negociacao.valor_trabalho ??
                                                                publicacao?.valor_estimado
                                                            )}

                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Data
                                                        </span>

                                                        <strong>

                                                            {formatarData(
                                                                publicacao?.data_inicio
                                                            )}

                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Interações
                                                        </span>

                                                        <strong>

                                                            {
                                                                (
                                                                    negociacao.interacoes ||
                                                                    []
                                                                ).length
                                                            }

                                                        </strong>

                                                    </div>

                                                </div>


                                                {/* DESCRIÇÃO */}

                                                <div className="contratacao-card-descricao">

                                                    {
                                                        publicacao?.descricao ||
                                                        'Nenhuma descrição informada.'
                                                    }

                                                </div>


                                                {/* AÇÕES */}

                                                <div className="publicacao-acoes-contratacao">

                                                    <button
                                                        type="button"
                                                        className="btn-negociacoes-publicacao"
                                                        onClick={() =>
                                                            abrirNegociacao(
                                                                negociacao
                                                            )
                                                        }
                                                    >
                                                        🤝 Ver negociação
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


            {/* ====================================================
               ABA TRABALHOS
            ==================================================== */}

            {aba === 'trabalhos' && (

                <section className="contratacoes-content">

                    <div className="section-title">

                        <div>

                            <h2>
                                Meus trabalhos
                            </h2>

                            <p>
                                Serviços que você foi contratado
                                para realizar
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


                    {/* LOADING */}

                    {carregandoTrabalhos && (

                        <div className="contratacoes-loading">

                            Carregando trabalhos...

                        </div>

                    )}


                    {/* ERRO */}

                    {!carregandoTrabalhos &&
                        erroTrabalhos && (

                            <div className="contratacoes-error">

                                {erroTrabalhos}

                            </div>

                        )}


                    {/* VAZIO */}

                    {!carregandoTrabalhos &&
                        !erroTrabalhos &&
                        trabalhos.length === 0 && (

                            <div className="contratacoes-empty">

                                <div className="empty-icon">
                                    🔨
                                </div>

                                <h2>
                                    Nenhum trabalho
                                </h2>

                                <p>
                                    Seus trabalhos aparecerão aqui
                                    quando uma negociação for aceita.
                                </p>

                            </div>

                        )}


                    {/* LISTA DE TRABALHOS */}

                    {!carregandoTrabalhos &&
                        !erroTrabalhos &&
                        trabalhos.length > 0 && (

                            <div className="contratacoes-list">

                                {trabalhos.map(
                                    (trabalho) => (

                                        <TrabalhoCard
                                            key={
                                                trabalho.id_trabalho
                                            }

                                            trabalho={
                                                trabalho
                                            }

                                            onAtualizado={
                                                carregarTrabalhos
                                            }

                                        />

                                    )
                                )}

                            </div>

                        )}

                </section>

            )}


            {/* ====================================================
               MODAL DE NEGOCIAÇÃO
            ==================================================== */}

            {negociacaoSelecionada && (

                <Negociacoes

                    negociacao={
                        negociacaoSelecionada
                    }

                    onClose={
                        fecharNegociacao
                    }

                />

            )}

        </main>

    );

}