import { useEffect, useState } from 'react';

import PublicacaoCard from '../components/PublicacaoCard';
import InteracaoModal from '../components/InteracaoModal';

import {
    getPublicacoes,
    criarInteracao,
} from '../services/publicacaoService';

import '../styles/home.css';

export default function Home() {
    const [publicacoes, setPublicacoes] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [publicacaoSelecionada, setPublicacaoSelecionada] =
        useState(null);

    const [tipoInteracao, setTipoInteracao] = useState(null);

    const [enviando, setEnviando] = useState(false);

    const [erroInteracao, setErroInteracao] = useState('');

    useEffect(() => {
        carregarPublicacoes();
    }, []);

    async function carregarPublicacoes() {
        setLoading(true);
        setError('');

        try {
            const response = await getPublicacoes();

            const dados =
                response?.data ?? response ?? [];

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

            setError(
                'Não foi possível carregar os trabalhos.'
            );
        } finally {
            setLoading(false);
        }
    }

    function abrirInteracao(publicacao, tipo) {
        setPublicacaoSelecionada(publicacao);
        setTipoInteracao(tipo);
        setErroInteracao('');
    }

    function fecharModal() {
        if (enviando) {
            return;
        }

        setPublicacaoSelecionada(null);
        setTipoInteracao(null);
        setErroInteracao('');
    }

    async function enviarInteracao(dados) {
        if (!publicacaoSelecionada || enviando) {
            return;
        }

        setEnviando(true);
        setErroInteracao('');

        try {
            await criarInteracao(
                publicacaoSelecionada.id,
                dados
            );

            /*
             * A publicação deixa o Home imediatamente.
             *
             * O backend também garante essa regra através
             * da negociação criada para o usuário.
             */
            setPublicacoes((publicacoesAtuais) =>
                publicacoesAtuais.filter(
                    (publicacao) =>
                        publicacao.id !==
                        publicacaoSelecionada.id
                )
            );

            fecharModal();
        } catch (error) {
            console.error(
                'Erro ao enviar interação:',
                error
            );

            const mensagem =
                error.response?.data?.message ||
                'Não foi possível enviar sua interação.';

            setErroInteracao(mensagem);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="home-page">

            <header className="home-header">
                <h1>
                    Oportunidades para você
                </h1>

                <p>
                    Encontre trabalhos que combinam
                    com suas categorias.
                </p>
            </header>

            <section className="timeline">

                {loading && (
                    <div className="home-loading">

                        <div className="loading-spinner" />

                        <span>
                            Carregando oportunidades...
                        </span>

                    </div>
                )}

                {!loading && error && (
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
                            onClick={carregarPublicacoes}
                        >
                            Tentar novamente
                        </button>

                    </div>
                )}

                {!loading &&
                    !error &&
                    publicacoes.length === 0 && (
                        <div className="empty-state">

                            <div className="empty-state-icon">
                                📋
                            </div>

                            <h2>
                                Nenhuma oportunidade
                            </h2>

                            <p>
                                No momento não existem
                                trabalhos disponíveis
                                para você.
                            </p>

                        </div>
                    )}

                {!loading &&
                    !error &&
                    publicacoes.map((publicacao) => (
                        <PublicacaoCard
                            key={publicacao.id}
                            publicacao={publicacao}
                            onInteracao={
                                abrirInteracao
                            }
                        />
                    ))}

            </section>

            {publicacaoSelecionada &&
                tipoInteracao && (
                    <InteracaoModal
                        publicacao={
                            publicacaoSelecionada
                        }
                        tipo={tipoInteracao}
                        onClose={fecharModal}
                        onSubmit={
                            enviarInteracao
                        }
                        loading={enviando}
                        error={erroInteracao}
                    />
                )}

        </main>
    );
}