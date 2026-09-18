import { useState } from 'react';

import {
    interagirTrabalho,
    TIPOS_INTERACAO_TRABALHO,
} from '../services/trabalhoService';

export default function TrabalhoContratacaoCard({
    trabalho,
    onAtualizado,
}) {
    const [processando, setProcessando] = useState(false);

    const [confirmacao, setConfirmacao] = useState(null);
    const [mensagemErro, setMensagemErro] = useState('');
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    /*
     * =========================================================
     * DADOS
     * =========================================================
     */

    const statusCodigo =
        trabalho?.status?.codigo ?? '';

    const statusNome =
        trabalho?.status?.nome ||
        statusCodigo ||
        'Sem status';

    const publicacao =
        trabalho?.publicacao ?? {};

    const contratado =
        trabalho?.contratado ?? {};

    /*
     * =========================================================
     * REGRAS
     * =========================================================
     */

    const aguardandoConfirmacao =
        statusCodigo ===
        'AGUARDANDO_CONFIRMACAO';

    /*
     * O contratante pode desistir enquanto
     * o trabalho estiver pendente ou
     * aguardando confirmação.
     */

    const podeDesistir =
        statusCodigo === 'PENDENTE' ||
        statusCodigo ===
            'AGUARDANDO_CONFIRMACAO';

    /*
     * =========================================================
     * EXECUTAR INTERAÇÃO
     * =========================================================
     */

    async function executarInteracao(
        tipo,
        mensagem,
        sucesso
    ) {
        if (processando) {
            return;
        }

        try {
            setMensagemErro('');
            setMensagemSucesso('');
            setConfirmacao(null);
            setProcessando(true);

            await interagirTrabalho(
                trabalho.id_trabalho,
                {
                    id_interacao_tipo: tipo,
                    mensagem,
                }
            );

            setMensagemSucesso(sucesso);

            await onAtualizado?.();

        } catch (error) {
            console.error(
                'Erro ao interagir com contratação:',
                error
            );

            const mensagemErro =
                error?.response?.data?.message ||
                Object.values(
                    error?.response?.data?.errors || {}
                ).flat()[0] ||
                'Não foi possível realizar esta ação.';

            setMensagemErro(mensagemErro);

        } finally {
            setProcessando(false);
        }
    }

    /*
     * =========================================================
     * CONFIRMAR SERVIÇO
     * =========================================================
     */

    function solicitarConfirmacaoServico() {
        setMensagemErro('');
        setMensagemSucesso('');

        setConfirmacao({
            tipo:
                TIPOS_INTERACAO_TRABALHO
                    .SERVICO_CONFIRMADO,

            titulo:
                'Confirmar serviço?',

            mensagem:
                'Confirme que o serviço foi realizado conforme combinado. Essa confirmação será registrada no sistema.',

            textoBotao:
                'Sim, confirmar',

            classeBotao:
                'btn-confirmar-trabalho',

            mensagemEnvio:
                'Serviço realizado conforme combinado.',

            mensagemSucesso:
                'Serviço confirmado com sucesso.',
        });
    }

    /*
     * =========================================================
     * CONTESTAR SERVIÇO
     * =========================================================
     */

    function solicitarContestacaoServico() {
        setMensagemErro('');
        setMensagemSucesso('');

        setConfirmacao({
            tipo:
                TIPOS_INTERACAO_TRABALHO
                    .SERVICO_CONTESTADO,

            titulo:
                'Contestar serviço?',

            mensagem:
                'Informe a contestação somente se o serviço não tiver sido realizado conforme combinado. A situação será encaminhada para avaliação.',

            textoBotao:
                'Sim, contestar',

            classeBotao:
                'btn-contestar-trabalho',

            mensagemEnvio:
                'O serviço não foi realizado conforme combinado.',

            mensagemSucesso:
                'Serviço enviado para avaliação.',
        });
    }

    /*
     * =========================================================
     * DESISTIR
     * =========================================================
     */

    function solicitarDesistencia() {
        setMensagemErro('');
        setMensagemSucesso('');

        setConfirmacao({
            tipo:
                TIPOS_INTERACAO_TRABALHO
                    .DESISTENCIA_CONTRATANTE,

            titulo:
                'Desistir da contratação?',

            mensagem:
                'Deseja realmente desistir desta contratação? Essa ação será registrada no sistema.',

            textoBotao:
                'Sim, desistir',

            classeBotao:
                'btn-desistir-trabalho',

            mensagemEnvio:
                'Solicito a desistência desta contratação.',

            mensagemSucesso:
                'Desistência registrada com sucesso.',
        });
    }

    /*
     * =========================================================
     * CONFIRMAR AÇÃO DO MODAL
     * =========================================================
     */

    async function confirmarAcao() {
        if (
            !confirmacao ||
            processando
        ) {
            return;
        }

        await executarInteracao(
            confirmacao.tipo,
            confirmacao.mensagemEnvio,
            confirmacao.mensagemSucesso
        );
    }

    /*
     * =========================================================
     * CANCELAR CONFIRMAÇÃO
     * =========================================================
     */

    function cancelarConfirmacao() {
        if (processando) {
            return;
        }

        setConfirmacao(null);
    }

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <article className="contratacao-trabalho-card">

            {/* =================================================
                CABEÇALHO
            ================================================== */}

            <header className="contratacao-trabalho-header">

                <div className="trabalho-header-info">

                    <h3>
                        {publicacao.titulo || 'Contratação'}
                    </h3>

                    {publicacao?.categoria?.nome && (
                        <span className="trabalho-categoria">
                            {publicacao.categoria.nome}
                        </span>
                    )}

                </div>

                <span
                    className={[
                        'trabalho-status',
                        `trabalho-status-${String(
                            statusCodigo || 'sem_status'
                        ).toLowerCase()}`,
                    ].join(' ')}
                >
                    {statusNome}
                </span>

            </header>


            {/* =================================================
                INFORMAÇÕES PRINCIPAIS
            ================================================== */}

            <div className="contratacao-trabalho-meta">

                {/* ---------------------------------------------
                    VALOR
                ---------------------------------------------- */}

                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        Valor
                    </span>

                    <strong className="trabalho-meta-valor">
                        {formatarValor(
                            trabalho?.valor ??
                            publicacao?.valor_estimado
                        )}
                    </strong>

                </div>


                {/* ---------------------------------------------
                    DATA
                ---------------------------------------------- */}

                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        Data
                    </span>

                    <strong>
                        {formatarData(
                            publicacao?.data_inicio ??
                            trabalho?.data_inicio
                        )}
                    </strong>

                </div>


                {/* ---------------------------------------------
                    CONTRATADO
                ---------------------------------------------- */}

                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        Contratado
                    </span>

                    <strong>
                        {contratado?.name ||
                            'Não informado'}
                    </strong>

                </div>

            </div>


            {/* =================================================
                DESCRIÇÃO
            ================================================== */}

            <div className="contratacao-trabalho-descricao">

                <span className="trabalho-descricao-label">
                    Descrição
                </span>

                <p>
                    {publicacao?.descricao ||
                        'Nenhuma descrição informada.'}
                </p>

            </div>


            {/* =================================================
                LOCAL
            ================================================== */}

            {(publicacao?.cidade ||
                publicacao?.estado) && (

                <div className="trabalho-local">

                    <div className="trabalho-local-label">

                        <span>
                            Local
                        </span>

                    </div>

                    <strong>

                        {publicacao?.cidade || ''}

                        {publicacao?.cidade &&
                            publicacao?.estado
                            ? ' - '
                            : ''}

                        {publicacao?.estado || ''}

                    </strong>

                </div>

            )}


            {/* =================================================
                AVISO DE CONFIRMAÇÃO
            ================================================== */}

            {aguardandoConfirmacao && (

                <div className="trabalho-aviso">

                    <strong>
                        Serviço informado como concluído
                    </strong>

                    <span>
                        Verifique o serviço antes de confirmar
                        ou contestar a conclusão.
                    </span>

                </div>

            )}


            {/* =================================================
                MENSAGEM DE SUCESSO
            ================================================== */}

            {mensagemSucesso && (

                <div
                    className="trabalho-feedback trabalho-feedback-sucesso"
                    role="status"
                >

                    <div className="trabalho-feedback-conteudo">

                        <span className="trabalho-feedback-icone">
                            ✓
                        </span>

                        <span>
                            {mensagemSucesso}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="trabalho-feedback-fechar"
                        onClick={() =>
                            setMensagemSucesso('')
                        }
                        aria-label="Fechar mensagem"
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =================================================
                MENSAGEM DE ERRO
            ================================================== */}

            {mensagemErro && (

                <div
                    className="trabalho-feedback trabalho-feedback-erro"
                    role="alert"
                >

                    <div className="trabalho-feedback-conteudo">

                        <span className="trabalho-feedback-icone">
                            !
                        </span>

                        <span>
                            {mensagemErro}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="trabalho-feedback-fechar"
                        onClick={() =>
                            setMensagemErro('')
                        }
                        aria-label="Fechar mensagem"
                    >
                        ×
                    </button>

                </div>

            )}


            {/* =================================================
                AÇÕES
            ================================================== */}

            {(aguardandoConfirmacao ||
                podeDesistir) && (

                <div className="trabalho-acoes">

                    {/* -----------------------------------------
                        CONFIRMAR
                    ------------------------------------------ */}

                    {aguardandoConfirmacao && (

                        <button
                            type="button"
                            className="btn-confirmar-trabalho"
                            onClick={
                                solicitarConfirmacaoServico
                            }
                            disabled={processando}
                        >
                            {processando
                                ? 'Processando...'
                                : '✓ Confirmar serviço'}
                        </button>

                    )}


                    {/* -----------------------------------------
                        CONTESTAR
                    ------------------------------------------ */}

                    {aguardandoConfirmacao && (

                        <button
                            type="button"
                            className="btn-contestar-trabalho"
                            onClick={
                                solicitarContestacaoServico
                            }
                            disabled={processando}
                        >
                            {processando
                                ? 'Processando...'
                                : '⚠ Contestar serviço'}
                        </button>

                    )}


                    {/* -----------------------------------------
                        DESISTIR
                    ------------------------------------------ */}

                    {podeDesistir && (

                        <button
                            type="button"
                            className="btn-desistir-trabalho"
                            onClick={
                                solicitarDesistencia
                            }
                            disabled={processando}
                        >
                            {processando
                                ? 'Processando...'
                                : '✕ Desistir'}
                        </button>

                    )}

                </div>

            )}


            {/* =================================================
                MODAL DE CONFIRMAÇÃO
            ================================================== */}

            {confirmacao && (

                <div
                    className="trabalho-confirmacao-overlay"
                    role="presentation"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                                event.currentTarget &&
                            !processando
                        ) {
                            cancelarConfirmacao();
                        }

                    }}
                >

                    <div
                        className="trabalho-confirmacao-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contratacao-confirmacao-titulo"
                    >

                        <div className="trabalho-confirmacao-conteudo">

                            <h4 id="contratacao-confirmacao-titulo">
                                {confirmacao.titulo}
                            </h4>

                            <p>
                                {confirmacao.mensagem}
                            </p>

                        </div>


                        <div className="trabalho-confirmacao-acoes">

                            <button
                                type="button"
                                className="btn-cancelar-confirmacao"
                                onClick={
                                    cancelarConfirmacao
                                }
                                disabled={processando}
                            >
                                Cancelar
                            </button>


                            <button
                                type="button"
                                className={
                                    confirmacao.classeBotao
                                }
                                onClick={
                                    confirmarAcao
                                }
                                disabled={processando}
                            >
                                {processando
                                    ? 'Processando...'
                                    : confirmacao.textoBotao}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </article>
    );
}


/* =========================================================
   FORMATADORES
========================================================= */

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

    const valor = String(data);

    /*
     * Laravel pode retornar:
     *
     * 2026-09-18T00:00:00.000000Z
     */

    const dataParte =
        valor.split('T')[0];

    const partes =
        dataParte.split('-');

    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }

    return data;
}