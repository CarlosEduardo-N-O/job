import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PublicacaoCard from '../components/publicacoes/Publicacao';
import OutrasPublicacoes from '../components/publicacoes/OutrasPublicacoes';
import InteracaoModal from '../components/home/HomeInteracao';

import {
    getPublicacoes,
    getOutrasPublicacoes,
    criarInteracao,
} from '../services/publicacaoService';

import '../styles/home.css';


export default function Home() {

    const navigate = useNavigate();


    const [publicacoes, setPublicacoes] =
        useState([]);

    const [outrasPublicacoes, setOutrasPublicacoes] =
        useState([]);

    const [temCategorias, setTemCategorias] =
        useState(true);

    const [loading, setLoading] =
        useState(true);

    const [atualizando, setAtualizando] =
        useState(false);

    const [error, setError] =
        useState('');

    const [erroOutrasPublicacoes, setErroOutrasPublicacoes] =
        useState(false);

    const [publicacaoSelecionada, setPublicacaoSelecionada] =
        useState(null);

    const [tipoInteracao, setTipoInteracao] =
        useState(null);

    const [enviando, setEnviando] =
        useState(false);

    const [erroInteracao, setErroInteracao] =
        useState('');


    /* =========================================================
       CARREGAMENTO INICIAL
    ========================================================= */

    useEffect(() => {

        carregarPublicacoes();

    }, []);


    /* =========================================================
       CARREGAR PUBLICAÇÕES
    ========================================================= */

    async function carregarPublicacoes() {

        setLoading(true);

        setError('');

        setErroOutrasPublicacoes(false);


        /* =====================================================
           PUBLICAÇÕES DAS CATEGORIAS DO USUÁRIO
        ===================================================== */

        try {

            const response =
                await getPublicacoes();


            const dados =
                response?.data ??
                response ??
                [];


            setPublicacoes(
                Array.isArray(dados)
                    ? dados
                    : []
            );

        } catch (error) {

            console.error(
                'Erro ao carregar oportunidades:',
                error
            );


            setPublicacoes([]);


            setError(
                'Não foi possível carregar as oportunidades.'
            );

        }


        /* =====================================================
           OUTRAS PUBLICAÇÕES
        ===================================================== */

        try {

            const response =
                await getOutrasPublicacoes();


            setTemCategorias(
                response?.tem_categorias === true
            );


            const dados =
                response?.data ??
                [];


            setOutrasPublicacoes(
                Array.isArray(dados)
                    ? dados
                    : []
            );

        } catch (error) {

            console.error(
                'Erro ao carregar outras publicações:',
                error
            );


            setOutrasPublicacoes([]);

            setErroOutrasPublicacoes(true);

        }


        setLoading(false);
    }


    /* =========================================================
       ATUALIZAR
    ========================================================= */

    async function atualizarPublicacoes() {

        if (
            atualizando ||
            loading
        ) {
            return;
        }


        try {

            setAtualizando(true);

            await carregarPublicacoes();

        } catch (error) {

            console.error(
                'Erro ao atualizar publicações:',
                error
            );

        } finally {

            setAtualizando(false);

        }

    }


    /* =========================================================
       ABRIR INTERAÇÃO
    ========================================================= */

    function abrirInteracao(
        publicacao,
        tipo
    ) {

        setPublicacaoSelecionada(
            publicacao
        );

        setTipoInteracao(
            tipo
        );

        setErroInteracao('');

    }


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    function fecharModal() {

        if (enviando) {
            return;
        }


        setPublicacaoSelecionada(null);

        setTipoInteracao(null);

        setErroInteracao('');

    }


    /* =========================================================
       ENVIAR INTERAÇÃO
    ========================================================= */

    async function enviarInteracao(
        dados
    ) {

        if (
            !publicacaoSelecionada ||
            enviando
        ) {
            return;
        }


        setEnviando(true);

        setErroInteracao('');


        try {

            await criarInteracao(
                publicacaoSelecionada.id,
                dados
            );


            setPublicacaoSelecionada(null);

            setTipoInteracao(null);


            await carregarPublicacoes();

        } catch (error) {

            console.error(
                'Erro ao enviar interação:',
                error
            );


            const mensagem =
                error.response?.data?.message ||
                'Não foi possível enviar sua interação.';


            setErroInteracao(
                mensagem
            );

        } finally {

            setEnviando(false);

        }

    }


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <main className="home-page">


            {/* =================================================
               CABEÇALHO
            ================================================== */}

            <header className="home-header">

                <div>

                    <h1>
                        Oportunidades para você
                    </h1>

                    <p>
                        Encontre trabalhos que combinam
                        com suas categorias.
                    </p>

                </div>


                <button
                    type="button"
                    className="btn-atualizar"
                    onClick={
                        atualizarPublicacoes
                    }
                    disabled={
                        atualizando ||
                        loading
                    }
                    title="Atualizar oportunidades"
                >

                    {atualizando
                        ? '↻ Atualizando...'
                        : '↻ Atualizar'}

                </button>

            </header>


            <section className="timeline">


                {/* =================================================
                   LOADING
                ================================================== */}

                {loading && (

                    <div className="home-loading">

                        <div className="loading-spinner" />

                        <span>
                            Carregando oportunidades...
                        </span>

                    </div>

                )}


                {/* =================================================
                   ERRO DAS OPORTUNIDADES PRINCIPAIS
                ================================================== */}

                {!loading &&
                    error && (

                        <div className="home-error">

                            <strong>
                                Não foi possível carregar
                                as oportunidades.
                            </strong>

                            <p>
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    carregarPublicacoes
                                }
                                disabled={loading}
                            >
                                Tentar novamente
                            </button>

                        </div>

                    )}


                {/* =================================================
                   USUÁRIO SEM CATEGORIAS
                ================================================== */}

                {!loading &&
                    !error &&
                    !temCategorias && (

                        <div className="sem-categorias">

                            <div className="sem-categorias-header">

                                <div className="sem-categorias-icon">
                                    📋
                                </div>

                                <div>

                                    <h2>
                                        Você está pronto para contratar
                                    </h2>

                                    <p>
                                        Como você não selecionou uma categoria entendemos que você só quer contratar. Escolha uma das opções abaixo
                                        para continuar usando o JOB.
                                    </p>

                                </div>

                            </div>


                            <div className="sem-categorias-opcoes">


                                {/* =================================
                                   CRIAR PUBLICAÇÃO
                                ================================== */}

                                <div className="sem-categorias-card">

                                    <div className="sem-categorias-card-conteudo">

                                        <h3>
                                            Precisa contratar?
                                        </h3>

                                        <p>
                                            Publique o serviço que
                                            você precisa e encontre
                                            alguém para realizá-lo.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        className="sem-categorias-botao"
                                        onClick={() => {
                                            navigate(
                                                '/contratacoes',
                                                {
                                                    state: {
                                                        abrirNovaPublicacao: true,
                                                    },
                                                }
                                            );
                                        }}
                                    >
                                        Criar publicação
                                    </button>

                                </div>


                                {/* =================================
                                   MINHAS CONTRATAÇÕES
                                ================================== */}

                                <div className="sem-categorias-card">

                                    <div className="sem-categorias-card-conteudo">

                                        <h3>
                                            Já está contratando?
                                        </h3>

                                        <p>
                                            Acompanhe suas publicações
                                            e veja o andamento das suas
                                            contratações.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        className="sem-categorias-botao"
                                        onClick={() => {
                                            window.location.href =
                                                '/contratacoes';
                                        }}
                                    >
                                        Minhas contratações
                                    </button>

                                </div>

                            </div>

                        </div>

                    )}


                {/* =================================================
                   COM CATEGORIAS, MAS SEM OPORTUNIDADES
                ================================================== */}

                {!loading &&
                    !error &&
                    temCategorias &&
                    publicacoes.length === 0 && (

                        <div className="empty-state">

                            <div className="empty-state-icon">
                                📋
                            </div>

                            <h2>
                                Não temos serviços para você
                                no momento
                            </h2>

                            <p>
                                Enquanto isso, confira
                                outros serviços publicados
                                no JOB.
                            </p>
                        </div>

                    )}


                {/* =================================================
                   PUBLICAÇÕES DAS CATEGORIAS DO USUÁRIO
                ================================================== */}

                {!loading &&
                    !error &&
                    publicacoes.map(
                        (publicacao) => (

                            <PublicacaoCard
                                key={
                                    publicacao.id
                                }
                                publicacao={
                                    publicacao
                                }
                                onInteracao={
                                    abrirInteracao
                                }
                            />

                        )
                    )}


                {/* =================================================
                   OUTROS SERVIÇOS
                ================================================== */}

                {!loading &&
                    !error &&
                    !erroOutrasPublicacoes &&
                    outrasPublicacoes.length > 0 && (

                        <section
                            className="outras-publicacoes"
                        >

                            <header
                                className="outras-publicacoes-header"
                            >

                                <h2>
                                    Outros serviços no JOB
                                </h2>

                                <p>
                                    Veja outras publicações
                                    feitas por usuários da
                                    plataforma.
                                </p>

                            </header>


                            <div
                                className="outras-publicacoes-lista"
                            >

                                {outrasPublicacoes.map(
                                    (publicacao) => (

                                        <OutrasPublicacoes
                                            key={
                                                publicacao.id
                                            }
                                            publicacao={
                                                publicacao
                                            }
                                        />

                                    )
                                )}

                            </div>

                        </section>

                    )}

            </section>


            {/* =====================================================
               MODAL DE INTERAÇÃO
            ====================================================== */}

            {publicacaoSelecionada &&
                tipoInteracao && (

                    <InteracaoModal
                        publicacao={
                            publicacaoSelecionada
                        }
                        tipo={
                            tipoInteracao
                        }
                        onClose={
                            fecharModal
                        }
                        onSubmit={
                            enviarInteracao
                        }
                        loading={
                            enviando
                        }
                        error={
                            erroInteracao
                        }
                    />

                )}

        </main>
    );
}