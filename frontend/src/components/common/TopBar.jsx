import { useEffect, useState } from 'react';

import Perfil from './Perfil';
import Notificacao from './Notificacao';

import {
    getNotificacoes,
} from '../../services/notificacaoService';

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="4"
            />

            <path
                d="M4 21c0-4 3.5-7 8-7s8 3 8 7"
            />
        </svg>
    );
}

function NotificationIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            />

            <path
                d="M10 21h4"
            />
        </svg>
    );
}

export default function TopBar() {

    const [
        perfilAberto,
        setPerfilAberto,
    ] = useState(false);

    const [
        notificacoesAbertas,
        setNotificacoesAbertas,
    ] = useState(false);

    const [
        notificacoesNaoLidas,
        setNotificacoesNaoLidas,
    ] = useState(0);

    /*
     * =========================================================
     * BUSCAR NOTIFICAÇÕES NÃO LIDAS
     * =========================================================
     */
    async function carregarNotificacoes() {
        try {

            const resposta =
                await getNotificacoes();

            /*
             * Aceita tanto:
             *
             * resposta.data
             *
             * quanto:
             *
             * resposta.data.data
             *
             * dependendo de como o service estiver retornando.
             */
            const lista =
                Array.isArray(resposta)
                    ? resposta
                    : Array.isArray(resposta?.data)
                        ? resposta.data
                        : Array.isArray(resposta?.data?.data)
                            ? resposta.data.data
                            : [];

            const quantidadeNaoLidas =
                lista.filter(
                    (notificacao) =>
                        !notificacao.lida
                ).length;

            setNotificacoesNaoLidas(
                quantidadeNaoLidas
            );

        } catch (error) {

            console.error(
                'Erro ao carregar notificações:',
                error
            );

            /*
             * Em caso de erro não exibimos
             * uma quantidade incorreta.
             */
            setNotificacoesNaoLidas(0);
        }
    }

    /*
     * =========================================================
     * CARREGAMENTO INICIAL
     * =========================================================
     */
    useEffect(() => {

        carregarNotificacoes();

        /*
         * Verifica novas notificações periodicamente.
         *
         * 30 segundos é suficiente para manter o sino
         * atualizado sem fazer requisições excessivas.
         */
        const intervalo =
            setInterval(
                carregarNotificacoes,
                30000
            );

        return () => {
            clearInterval(intervalo);
        };

    }, []);

    /*
     * =========================================================
     * PERFIL
     * =========================================================
     */
    function abrirPerfil() {
        setPerfilAberto(true);
    }

    function fecharPerfil() {
        setPerfilAberto(false);
    }

    /*
     * =========================================================
     * NOTIFICAÇÕES
     * =========================================================
     */
    function abrirNotificacoes() {

        setNotificacoesAbertas(true);

        /*
         * Atualiza a quantidade assim que o painel
         * de notificações for aberto.
         */
        carregarNotificacoes();
    }

    function fecharNotificacoes() {

        setNotificacoesAbertas(false);

        /*
         * Ao fechar o painel, atualiza novamente.
         *
         * Isso é importante porque o componente
         * Notificacao pode ter marcado notificações
         * como lidas.
         */
        carregarNotificacoes();
    }

    return (
        <>
            <header className="top-bar">

                <div className="top-bar-left">

                    <button
                        type="button"
                        className="top-bar-button"
                        aria-label="Abrir perfil"
                        title="Perfil"
                        onClick={abrirPerfil}
                    >
                        <UserIcon />
                    </button>

                </div>

                <div className="top-bar-right">

                    <button
                        type="button"
                        className="top-bar-button notification-button"
                        aria-label="Abrir notificações"
                        title="Notificações"
                        onClick={abrirNotificacoes}
                    >

                        <NotificationIcon />

                        {notificacoesNaoLidas > 0 && (
                            <span
                                className="notification-badge"
                                aria-label={`${notificacoesNaoLidas} notificações não lidas`}
                            >
                                {notificacoesNaoLidas > 99
                                    ? '99+'
                                    : notificacoesNaoLidas}
                            </span>
                        )}

                    </button>

                </div>

            </header>

            {perfilAberto && (
                <Perfil
                    onClose={fecharPerfil}
                />
            )}

            {notificacoesAbertas && (
                <Notificacao
                    onClose={fecharNotificacoes}
                />
            )}
        </>
    );
}