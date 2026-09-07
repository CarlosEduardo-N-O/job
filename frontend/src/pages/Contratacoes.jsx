import { useEffect, useState } from 'react';

import {
    getMinhasPublicacoes,
    cancelarPublicacao,
} from '../services/publicacaoService';

import PublicacaoFormModal from '../components/PublicacaoFormModal';
import NegociacoesModal from '../components/NegociacoesModal';

import '../styles/contratacoes.css';

export default function Contratacoes() {

    const [publicacoes, setPublicacoes] = useState([]);

    const [aba, setAba] =
        useState('publicacoes');

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState('');

    const [
        publicacaoEditando,
        setPublicacaoEditando,
    ] = useState(null);

    const [
        publicacaoNegociacoes,
        setPublicacaoNegociacoes,
    ] = useState(null);

    useEffect(() => {
        carregarPublicacoes();
    }, []);

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

    function abrirNovaPublicacao() {
        setPublicacaoEditando({});
    }

    function abrirEdicao(publicacao) {
        setPublicacaoEditando(
            publicacao
        );
    }

    function fecharEdicao() {
        setPublicacaoEditando(null);
    }

    function abrirNegociacoes(publicacao) {
        setPublicacaoNegociacoes(
            publicacao
        );
    }

    function fecharNegociacoes() {
        setPublicacaoNegociacoes(null);
    }

    function handlePublicacaoSalva(
        publicacaoSalva
    ) {
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

                if (!existe) {
                    return [
                        publicacaoSalva,
                        ...anterior,
                    ];
                }

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

            setPublicacoes(
                (anterior) =>
                    anterior.map(
                        (item) =>
                            item.id ===
                            publicacao.id
                                ? {
                                    ...item,
                                    status: 'CANCELADO',
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

    return (
        <main className="contratacoes-page">

            <header className="contratacoes-header">
                <div>
                    <h1>
                        Contratações
                    </h1>

                    <p>
                        Gerencie suas publicações e contratações
                    </p>
                </div>
            </header>

            <div className="contratacoes-tabs">

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

            {aba === 'publicacoes' && (
                <section className="contratacoes-content">

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

                    {carregando && (
                        <div className="contratacoes-loading">
                            Carregando publicações...
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
                        publicacoes.length ===
                            0 && (
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

                    {!carregando &&
                        !erro &&
                        publicacoes.length >
                            0 && (
                            <div className="contratacoes-list">

                                {publicacoes.map(
                                    (
                                        publicacao
                                    ) => (
                                        <article
                                            key={
                                                publicacao.id
                                            }
                                            className="contratacao-publicacao-card"
                                        >

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
                                                        publicacao.status
                                                    }
                                                </span>

                                            </div>

                                            <div className="contratacao-card-meta">

                                                <div>
                                                    <span>
                                                        Valor
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

                                            <div className="contratacao-card-descricao">
                                                {
                                                    publicacao.descricao
                                                }
                                            </div>

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
                                                        publicacao.status !==
                                                        'ATIVO'
                                                    }
                                                >
                                                    ✕ Cancelar
                                                </button>

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>
                        )}

                </section>
            )}

            {aba === 'contratacoes' && (
                <section className="contratacoes-content">

                    <div className="contratacoes-empty">

                        <div className="empty-icon">
                            🤝
                        </div>

                        <h2>
                            Nenhuma contratação
                        </h2>

                        <p>
                            Suas contratações aparecerão aqui quando uma proposta for aceita.
                        </p>

                    </div>

                </section>
            )}

            {publicacaoEditando !== null && (
                <PublicacaoFormModal
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

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
}