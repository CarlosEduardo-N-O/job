import { useEffect, useState } from 'react';

import {
    getNotificacoes,
    marcarNotificacaoComoLida,
    marcarTodasNotificacoesComoLidas,
    excluirNotificacao,
} from '../../services/notificacaoService';

export default function Notificacao({ onClose }) {
    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    // Filtro atual das notificações
    const [filtro, setFiltro] = useState('todas');

    async function carregarNotificacoes() {
        try {
            setCarregando(true);
            setErro(null);

            const response = await getNotificacoes();

            const pagina = response?.data;

            const lista = Array.isArray(pagina)
                ? pagina
                : pagina?.data ?? [];

            setNotificacoes(lista);
        } catch (error) {
            console.error(
                'Erro ao carregar notificações:',
                error
            );

            setErro(
                'Não foi possível carregar as notificações.'
            );
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregarNotificacoes();
    }, []);

    async function handleMarcarComoLida(notificacao) {
        if (notificacao.lida) {
            return;
        }

        try {
            await marcarNotificacaoComoLida(
                notificacao.id
            );

            setNotificacoes((listaAtual) =>
                listaAtual.map((item) => {
                    if (item.id === notificacao.id) {
                        return {
                            ...item,
                            lida: true,
                        };
                    }

                    return item;
                })
            );
        } catch (error) {
            console.error(
                'Erro ao marcar notificação como lida:',
                error
            );
        }
    }

    async function handleMarcarTodasComoLidas() {
        if (!possuiNaoLidas) {
            return;
        }

        try {
            await marcarTodasNotificacoesComoLidas();

            setNotificacoes((listaAtual) =>
                listaAtual.map((item) => ({
                    ...item,
                    lida: true,
                }))
            );
        } catch (error) {
            console.error(
                'Erro ao marcar todas as notificações como lidas:',
                error
            );
        }
    }

    async function handleExcluir(notificacaoId) {
        try {
            await excluirNotificacao(notificacaoId);

            setNotificacoes((listaAtual) =>
                listaAtual.filter(
                    (item) =>
                        item.id !== notificacaoId
                )
            );
        } catch (error) {
            console.error(
                'Erro ao excluir notificação:',
                error
            );
        }
    }

    function formatarData(data) {
        if (!data) {
            return '';
        }

        const dataFormatada = new Date(data);

        if (
            Number.isNaN(
                dataFormatada.getTime()
            )
        ) {
            return '';
        }

        return dataFormatada.toLocaleString(
            'pt-BR',
            {
                dateStyle: 'short',
                timeStyle: 'short',
            }
        );
    }

    /*
     * Quantidade de notificações não lidas
     */
    const quantidadeNaoLidas = notificacoes.filter(
        (notificacao) => !notificacao.lida
    ).length;

    const possuiNaoLidas =
        quantidadeNaoLidas > 0;

    /*
     * Lista exibida conforme o filtro selecionado
     */
    const notificacoesFiltradas =
        filtro === 'nao-lidas'
            ? notificacoes.filter(
                  (notificacao) =>
                      !notificacao.lida
              )
            : notificacoes;

    return (
        <div
            className="notificacao-overlay"
            onClick={onClose}
        >
            <div
                className="notificacao-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                {/* =========================================================
                    CABEÇALHO
                   ========================================================= */}

                <div className="notificacao-header">
                    <h2>
                        Notificações
                    </h2>

                    <div className="notificacao-header-acoes">
                        {possuiNaoLidas && (
                            <button
                                type="button"
                                className="notificacao-marcar-todas"
                                onClick={
                                    handleMarcarTodasComoLidas
                                }
                            >
                                Marcar todas como lidas
                            </button>
                        )}

                        <button
                            type="button"
                            className="notificacao-fechar"
                            aria-label="Fechar notificações"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* =========================================================
                    FILTROS
                   ========================================================= */}

                <div className="notificacao-filtros">
                    <button
                        type="button"
                        className={`notificacao-filtro ${
                            filtro === 'todas'
                                ? 'ativo'
                                : ''
                        }`}
                        onClick={() =>
                            setFiltro('todas')
                        }
                    >
                        Todas

                        <span>
                            {notificacoes.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`notificacao-filtro ${
                            filtro === 'nao-lidas'
                                ? 'ativo'
                                : ''
                        }`}
                        onClick={() =>
                            setFiltro('nao-lidas')
                        }
                    >
                        Não lidas

                        <span>
                            {quantidadeNaoLidas}
                        </span>
                    </button>
                </div>

                {/* =========================================================
                    CONTEÚDO
                   ========================================================= */}

                <div className="notificacao-conteudo">

                    {/* CARREGANDO */}
                    {carregando && (
                        <div className="notificacao-vazia">
                            <p>
                                Carregando notificações...
                            </p>
                        </div>
                    )}

                    {/* ERRO */}
                    {!carregando && erro && (
                        <div className="notificacao-vazia">
                            <p>
                                {erro}
                            </p>
                        </div>
                    )}

                    {/* SEM NOTIFICAÇÕES PARA O FILTRO ATUAL */}
                    {!carregando &&
                        !erro &&
                        notificacoesFiltradas.length === 0 && (
                            <div className="notificacao-vazia">
                                <p>
                                    {filtro === 'nao-lidas'
                                        ? 'Nenhuma notificação não lida.'
                                        : 'Nenhuma notificação no momento.'}
                                </p>
                            </div>
                        )}

                    {/* LISTA */}
                    {!carregando &&
                        !erro &&
                        notificacoesFiltradas.length > 0 && (
                            <div className="notificacao-lista">
                                {notificacoesFiltradas.map(
                                    (notificacao) => {
                                        const classeItem =
                                            notificacao.lida
                                                ? 'notificacao-item lida'
                                                : 'notificacao-item nao-lida';

                                        return (
                                            <div
                                                key={notificacao.id}
                                                className={classeItem}
                                                onClick={() =>
                                                    handleMarcarComoLida(
                                                        notificacao
                                                    )
                                                }
                                            >
                                                <div className="notificacao-item-conteudo">
                                                    <div className="notificacao-item-topo">
                                                        <h3>
                                                            {
                                                                notificacao.titulo
                                                            }
                                                        </h3>

                                                        {!notificacao.lida && (
                                                            <span className="notificacao-indicador">
                                                                Nova
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p>
                                                        {
                                                            notificacao.mensagem
                                                        }
                                                    </p>

                                                    <span className="notificacao-data">
                                                        {formatarData(
                                                            notificacao.created_at
                                                        )}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="notificacao-excluir"
                                                    aria-label="Excluir notificação"
                                                    onClick={(
                                                        event
                                                    ) => {
                                                        event.stopPropagation();

                                                        handleExcluir(
                                                            notificacao.id
                                                        );
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}