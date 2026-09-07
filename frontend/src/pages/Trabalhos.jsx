import { useEffect, useState } from 'react';

import {
    getMinhasNegociacoes,
} from '../services/negociacaoService';

import TrabalhosNegociacaoModal
    from '../components/TrabalhosNegociacaoModal';

import '../styles/contratacoes.css';

export default function Trabalhos() {

    const [negociacoes, setNegociacoes] =
        useState([]);

    const [aba, setAba] =
        useState('negociacoes');

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState('');

    const [
        negociacaoSelecionada,
        setNegociacaoSelecionada,
    ] = useState(null);


    useEffect(() => {
        carregarNegociacoes();
    }, []);


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


    function abrirNegociacao(
        negociacao
    ) {

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


    function fecharNegociacao() {

        setNegociacaoSelecionada(
            null
        );

        carregarNegociacoes();
    }


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

        const partes =
            String(data).split('-');

        if (
            partes.length === 3
        ) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        return data;
    }


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


    return (

        <main className="contratacoes-page">

            <header className="contratacoes-header">

                <div>

                    <h1>
                        Trabalhos
                    </h1>

                    <p>
                        Gerencie suas negociações e trabalhos
                    </p>

                </div>

            </header>


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


                    {carregando && (

                        <div className="contratacoes-loading">
                            Carregando negociações...
                        </div>

                    )}


                    {!carregando &&
                        erro && (

                            <div className="contratacoes-error">
                                {erro}
                            </div>

                        )}


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
                                    As publicações nas quais você demonstrar interesse aparecerão aqui quando uma negociação for criada.
                                </p>

                            </div>

                        )}


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
                                                                    negociacao
                                                                        .interacoes ||
                                                                    []
                                                                ).length
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                <div className="contratacao-card-descricao">

                                                    {
                                                        publicacao?.descricao ||
                                                        'Nenhuma descrição informada.'
                                                    }

                                                </div>


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


            {aba === 'trabalhos' && (

                <section className="contratacoes-content">

                    <div className="contratacoes-empty">

                        <div className="empty-icon">
                            🔨
                        </div>

                        <h2>
                            Nenhum trabalho
                        </h2>

                        <p>
                            Seus trabalhos aparecerão aqui quando uma negociação for aceita.
                        </p>

                    </div>

                </section>

            )}


            {negociacaoSelecionada && (

                <TrabalhosNegociacaoModal
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