import { useEffect, useState } from 'react';

import {
    getMinhasPublicacoes,
    excluirPublicacao,
} from '../services/publicacaoService';

import PublicacaoFormModal from '../components/PublicacaoFormModal';

import '../styles/contratacoes.css';

export default function Contratacoes() {

    const [publicacoes, setPublicacoes] = useState([]);

    const [aba, setAba] = useState('publicacoes');

    const [carregando, setCarregando] = useState(true);

    const [erro, setErro] = useState('');

    const [
        publicacaoEditando,
        setPublicacaoEditando,
    ] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | Carregar publicações
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        carregarPublicacoes();
    }, []);

    async function carregarPublicacoes() {
        try {
            setCarregando(true);
            setErro('');

            const response = await getMinhasPublicacoes();

            const dados = response?.data ?? response;

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


    /*
    |--------------------------------------------------------------------------
    | Nova publicação
    |--------------------------------------------------------------------------
    */

    function abrirNovaPublicacao() {
        setPublicacaoEditando({});
    }


    /*
    |--------------------------------------------------------------------------
    | Editar publicação
    |--------------------------------------------------------------------------
    */

    function abrirEdicao(publicacao) {
        setPublicacaoEditando(publicacao);
    }


    /*
    |--------------------------------------------------------------------------
    | Fechar modal
    |--------------------------------------------------------------------------
    */

    function fecharEdicao() {
        setPublicacaoEditando(null);
    }


    /*
    |--------------------------------------------------------------------------
    | Publicação salva
    |--------------------------------------------------------------------------
    */

    function handlePublicacaoSalva(
        publicacaoSalva
    ) {

        if (!publicacaoSalva) {
            carregarPublicacoes();
            return;
        }

        setPublicacoes((anterior) => {

            const existe = anterior.some(
                (publicacao) =>
                    publicacao.id ===
                    publicacaoSalva.id
            );

            /*
            |--------------------------------------------------------------
            | Nova publicação
            |--------------------------------------------------------------
            */

            if (!existe) {
                return [
                    publicacaoSalva,
                    ...anterior,
                ];
            }

            /*
            |--------------------------------------------------------------
            | Publicação atualizada
            |--------------------------------------------------------------
            */

            return anterior.map(
                (publicacao) =>
                    publicacao.id ===
                    publicacaoSalva.id
                        ? publicacaoSalva
                        : publicacao
            );
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Cancelar publicação
    |--------------------------------------------------------------------------
    */

    async function cancelarPublicacao(
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

            await excluirPublicacao(
                publicacao.id
            );

            setPublicacoes(
                (anterior) =>
                    anterior.filter(
                        (item) =>
                            item.id !==
                            publicacao.id
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


    /*
    |--------------------------------------------------------------------------
    | Renderização
    |--------------------------------------------------------------------------
    */

    return (
        <main className="contratacoes-page">

            {/* ========================================================== */}
            {/* CABEÇALHO                                                  */}
            {/* ========================================================== */}

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


            {/* ========================================================== */}
            {/* ABAS                                                        */}
            {/* ========================================================== */}

            <div className="contratacoes-tabs">

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


            {/* ========================================================== */}
            {/* ABA — MINHAS PUBLICAÇÕES                                    */}
            {/* ========================================================== */}

            {aba === 'publicacoes' && (

                <section className="contratacoes-content">

                    {/* -------------------------------------------------- */}
                    {/* TÍTULO + BOTÃO NOVA PUBLICAÇÃO                     */}
                    {/* -------------------------------------------------- */}

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

                            <button
                                type="button"
                                className="btn-nova-publicacao"
                                onClick={
                                    abrirNovaPublicacao
                                }
                            >
                                <span>+</span>

                                Nova publicação
                            </button>

                        </div>

                    </div>


                    {/* -------------------------------------------------- */}
                    {/* CARREGANDO                                          */}
                    {/* -------------------------------------------------- */}

                    {carregando && (

                        <div className="contratacoes-loading">
                            Carregando publicações...
                        </div>

                    )}


                    {/* -------------------------------------------------- */}
                    {/* ERRO                                                 */}
                    {/* -------------------------------------------------- */}

                    {!carregando && erro && (

                        <div className="contratacoes-error">
                            {erro}
                        </div>

                    )}


                    {/* -------------------------------------------------- */}
                    {/* VAZIO                                                */}
                    {/* -------------------------------------------------- */}

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
                                    <span>+</span>
                                    Criar primeira publicação
                                </button>

                            </div>

                        )}


                    {/* -------------------------------------------------- */}
                    {/* LISTA DE PUBLICAÇÕES                                */}
                    {/* -------------------------------------------------- */}

                    {!carregando &&
                        !erro &&
                        publicacoes.length > 0 && (

                            <div className="contratacoes-list">

                                {publicacoes.map(
                                    (publicacao) => (

                                        <article
                                            key={
                                                publicacao.id
                                            }
                                            className="contratacao-publicacao-card"
                                        >

                                            {/* ---------------------- */}
                                            {/* CABEÇALHO DO CARD       */}
                                            {/* ---------------------- */}

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


                                            {/* ---------------------- */}
                                            {/* INFORMAÇÕES             */}
                                            {/* ---------------------- */}

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


                                            {/* ---------------------- */}
                                            {/* DESCRIÇÃO               */}
                                            {/* ---------------------- */}

                                            <div className="contratacao-card-descricao">

                                                {
                                                    publicacao.descricao
                                                }

                                            </div>


                                            {/* ---------------------- */}
                                            {/* AÇÕES                   */}
                                            {/* ---------------------- */}

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
                                                    className="btn-cancelar-publicacao"
                                                    onClick={() =>
                                                        cancelarPublicacao(
                                                            publicacao
                                                        )
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


            {/* ========================================================== */}
            {/* ABA — CONTRATAÇÕES                                         */}
            {/* ========================================================== */}

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


            {/* ========================================================== */}
            {/* MODAL NOVA / EDITAR PUBLICAÇÃO                             */}
            {/* ========================================================== */}

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

        </main>
    );
}


/*
|--------------------------------------------------------------------------
| Formatação
|--------------------------------------------------------------------------
*/

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