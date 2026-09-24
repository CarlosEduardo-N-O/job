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
import MinhasPublicacoes from '../components/publicacoes/MinhasPublicacoes';

import '../styles/publicacoes.css';
import '../styles/negociacoes.css';
import '../styles/trabalhos.css';
import '../styles/contratacoes.css';


export default function Contratacoes() {

    /* =====================================================
       PUBLICAÇÕES
    ===================================================== */

    const [publicacoes, setPublicacoes] = useState([]);


    /* =====================================================
       TRABALHOS / CONTRATAÇÕES
    ===================================================== */

    const [trabalhos, setTrabalhos] = useState([]);

    const [carregandoTrabalhos, setCarregandoTrabalhos] =
        useState(false);

    const [erroTrabalhos, setErroTrabalhos] =
        useState('');


    /* =====================================================
       ABA ATUAL
    ===================================================== */

    const [aba, setAba] = useState('publicacoes');


    /* =====================================================
       ESTADO DAS PUBLICAÇÕES
    ===================================================== */

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState('');


    /* =====================================================
       CONTROLE GERAL DE ATUALIZAÇÃO
    ===================================================== */

    const [atualizandoTudo, setAtualizandoTudo] =
        useState(false);


    /* =====================================================
       MODAL DE EDIÇÃO / CRIAÇÃO
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
       CARREGAR PUBLICAÇÕES
    ===================================================== */

    async function carregarPublicacoes() {

        try {

            setCarregando(true);
            setErro('');


            const response =
                await getMinhasPublicacoes();


            let dados =
                response?.data ?? response;


            /*
             * Caso venha uma estrutura adicional:
             *
             * {
             *     data: {
             *         data: [...]
             *     }
             */

            if (
                dados &&
                !Array.isArray(dados) &&
                Array.isArray(dados.data)
            ) {

                dados = dados.data;

            }


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
       CARREGAR TRABALHOS / CONTRATAÇÕES
    ===================================================== */

    async function carregarTrabalhos() {

        try {

            setCarregandoTrabalhos(true);
            setErroTrabalhos('');


            const response =
                await getContratacoes();


            let dados =
                response?.data ?? response;


            /*
             * Caso venha uma estrutura adicional:
             *
             * {
             *     data: {
             *         data: [...]
             *     }
             */

            if (
                dados &&
                !Array.isArray(dados) &&
                Array.isArray(dados.data)
            ) {

                dados = dados.data;

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


            setErroTrabalhos(mensagem);

        } finally {

            setCarregandoTrabalhos(false);

        }

    }


    /* =====================================================
       RECARREGAR TUDO
    ===================================================== */

    async function recarregarTudo() {

        /*
         * Evita disparar várias atualizações
         * simultaneamente.
         */

        if (atualizandoTudo) {

            return;

        }


        try {

            setAtualizandoTudo(true);


            await Promise.all([
                carregarPublicacoes(),
                carregarTrabalhos(),
            ]);

        } catch (error) {

            console.error(
                'Erro ao atualizar as listas:',
                error
            );

        } finally {

            setAtualizandoTudo(false);

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

        setPublicacaoEditando(publicacao);

    }


    /* =====================================================
       FECHAR FORMULÁRIO
    ===================================================== */

    async function fecharEdicao() {

        /*
         * Fecha o modal imediatamente.
         */

        setPublicacaoEditando(null);


        /*
         * Atualiza as listas ao voltar do formulário.
         *
         * Isso garante que qualquer alteração feita
         * na publicação, inclusive anexos, seja refletida
         * na tela.
         */

        await recarregarTudo();

    }


    /* =====================================================
       ABRIR NEGOCIAÇÕES
    ===================================================== */

    function abrirNegociacoes(publicacao) {

        setPublicacaoNegociacoes(publicacao);

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

    async function handlePublicacaoSalva() {

        try {

            /*
             * O formulário já concluiu o salvamento.
             *
             * Buscamos novamente os dados diretamente
             * do backend para garantir que:
             *
             * - publicação nova apareça;
             * - edição seja atualizada;
             * - anexos sejam considerados;
             * - status e relacionamentos estejam atualizados.
             */

            await recarregarTudo();

        } catch (error) {

            console.error(
                'Erro ao atualizar listas após salvar publicação:',
                error
            );

        } finally {

            /*
             * Garante que o modal seja fechado mesmo
             * depois do salvamento.
             */

            setPublicacaoEditando(null);

        }

    }


    /* =====================================================
       CANCELAR PUBLICAÇÃO
    ===================================================== */

    async function cancelarPublicacaoHandler(publicacao) {

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
             * Depois do cancelamento, buscamos novamente
             * as publicações no backend.
             *
             * Isso evita manter informações antigas
             * no estado local.
             */

            await recarregarTudo();

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

                <div className="contratacoes-tabs">

                    {/* =============================================
                       MINHAS PUBLICAÇÕES
                    ============================================= */}

                    <button
                        type="button"
                        className={
                            aba === 'publicacoes'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba('publicacoes')
                        }
                    >
                        Minhas publicações
                    </button>


                    {/* =============================================
                       CONTRATAÇÕES
                    ============================================= */}

                    <button
                        type="button"
                        className={
                            aba === 'contratacoes'
                                ? 'tab active'
                                : 'tab'
                        }
                        onClick={() =>
                            setAba('contratacoes')
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


                    {/* =========================================
                       TÍTULO
                    ========================================= */}

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
                                {publicacoes.length}
                            </span>


                            {/* =====================================
                               ATUALIZAR
                            ===================================== */}

                            <button
                                type="button"
                                className="btn-atualizar"
                                onClick={recarregarTudo}
                                disabled={
                                    atualizandoTudo ||
                                    carregando ||
                                    carregandoTrabalhos
                                }
                                title="Atualizar listas"
                            >

                                {atualizandoTudo
                                    ? '↻ Atualizando...'
                                    : '↻ Atualizar'}

                            </button>


                            {/* =====================================
                               NOVA PUBLICAÇÃO
                            ===================================== */}

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


                    {/* =========================================
                       LOADING
                    ========================================= */}

                    {carregando && (

                        <div className="contratacoes-loading">

                            Carregando publicações...

                        </div>

                    )}


                    {/* =========================================
                       ERRO
                    ========================================= */}

                    {!carregando && erro && (

                        <div className="contratacoes-error">

                            {erro}

                            <button
                                type="button"
                                onClick={carregarPublicacoes}
                            >
                                Tentar novamente
                            </button>

                        </div>

                    )}


                    {/* =========================================
                       VAZIO
                    ========================================= */}

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


                    {/* =========================================
                       LISTA DE PUBLICAÇÕES
                    ========================================= */}

                    {!carregando &&
                        !erro &&
                        publicacoes.length > 0 && (

                            <MinhasPublicacoes
                                publicacoes={publicacoes}
                                onEditar={abrirEdicao}
                                onNegociacoes={abrirNegociacoes}
                                onCancelar={
                                    cancelarPublicacaoHandler
                                }
                            />

                        )}

                </section>

            )}


            {/* =================================================
               ABA: CONTRATAÇÕES
            ================================================= */}

            {aba === 'contratacoes' && (

                <section className="contratacoes-content">


                    {/* =========================================
                       TÍTULO
                    ========================================= */}

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
                                {trabalhos.length}
                            </span>


                            {/* =====================================
                               ATUALIZAR
                            ===================================== */}

                            <button
                                type="button"
                                className="btn-atualizar"
                                onClick={recarregarTudo}
                                disabled={
                                    atualizandoTudo ||
                                    carregando ||
                                    carregandoTrabalhos
                                }
                                title="Atualizar listas"
                            >

                                {atualizandoTudo
                                    ? '↻ Atualizando...'
                                    : '↻ Atualizar'}

                            </button>

                        </div>

                    </div>


                    {/* =========================================
                       CARREGANDO
                    ========================================= */}

                    {carregandoTrabalhos && (

                        <div className="contratacoes-loading">

                            Carregando contratações...

                        </div>

                    )}


                    {/* =========================================
                       ERRO
                    ========================================= */}

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


                    {/* =========================================
                       NENHUMA CONTRATAÇÃO
                    ========================================= */}

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


                    {/* =========================================
                       LISTA DE CONTRATAÇÕES
                    ========================================= */}

                    {!carregandoTrabalhos &&
                        !erroTrabalhos &&
                        trabalhos.length > 0 && (

                            <Trabalhos
                                trabalhos={trabalhos}
                                papel="CONTRATANTE"
                                onAtualizado={
                                    carregarTrabalhos
                                }
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