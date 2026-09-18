import { useState } from 'react';

import {
    interagirTrabalho,
    TIPOS_INTERACAO_TRABALHO,
} from '../../services/trabalhoService';

import {
    podeConcluirTrabalho,
    podeDesistirTrabalho,
    podeConfirmarTrabalho,
    podeContestarTrabalho,
} from './TrabalhoControle';


export default function TrabalhoInteracao({
    trabalho,
    papel,
    onAtualizado,
}) {

    /*
     * =========================================================
     * ESTADO
     * =========================================================
     */

    const [processando, setProcessando] =
        useState(false);

    const [confirmacao, setConfirmacao] =
        useState(null);

    const [mensagemErro, setMensagemErro] =
        useState('');

    const [mensagemSucesso, setMensagemSucesso] =
        useState('');


    /*
     * =========================================================
     * DADOS
     * =========================================================
     */

    const trabalhoId =
        trabalho?.id_trabalho ??
        trabalho?.id ??
        null;


    const status =
        trabalho?.status ?? {};


    const statusCodigo =
        typeof status === 'object'
            ? status?.codigo ?? ''
            : status ?? '';


    const papelNormalizado =
        String(papel)
            .trim()
            .toUpperCase();


    const ehContratante =
        papelNormalizado === 'CONTRATANTE';


    /*
     * =========================================================
     * EXECUTAR INTERAÇÃO
     * =========================================================
     */

    async function executarInteracao(
        tipo,
        mensagem,
        mensagemSucessoAcao
    ) {

        if (
            processando ||
            !trabalhoId
        ) {
            return;
        }


        try {

            setMensagemErro('');
            setMensagemSucesso('');
            setConfirmacao(null);
            setProcessando(true);


            await interagirTrabalho(
                trabalhoId,
                {
                    id_interacao_tipo: tipo,
                    mensagem,
                }
            );


            setMensagemSucesso(
                mensagemSucessoAcao
            );


            await onAtualizado?.();

        } catch (error) {

            console.error(
                'Erro ao interagir com trabalho:',
                error
            );


            const mensagem =
                error?.response?.data?.message ||
                Object.values(
                    error?.response?.data?.errors || {}
                ).flat()[0] ||
                'Não foi possível realizar esta ação.';


            setMensagemErro(
                mensagem
            );

        } finally {

            setProcessando(false);

        }
    }


    /*
     * =========================================================
     * ABRIR CONFIRMAÇÃO
     * =========================================================
     */

    function abrirConfirmacao(config) {

        if (processando) {
            return;
        }


        setMensagemErro('');
        setMensagemSucesso('');


        setConfirmacao(config);

    }


    /*
     * =========================================================
     * CONTRATADO — CONCLUIR
     * =========================================================
     */

    function solicitarConclusao() {

        abrirConfirmacao({

            tipo:
                TIPOS_INTERACAO_TRABALHO
                    .SERVICO_CONCLUIDO,

            titulo:
                'Concluir serviço?',

            mensagem:
                'Confirme que o serviço foi realizado. O contratante será solicitado a confirmar a conclusão.',

            textoBotao:
                'Sim, concluir serviço',

            classeBotao:
                'btn-confirmar-trabalho',

            mensagemEnvio:
                'Serviço concluído pelo contratado.',

            mensagemSucesso:
                'Serviço informado como concluído com sucesso.',

        });

    }


    /*
     * =========================================================
     * CONTRATADO — DESISTIR
     * =========================================================
     */

    function solicitarDesistenciaContratado() {

        abrirConfirmacao({

            tipo:
                TIPOS_INTERACAO_TRABALHO
                    .DESISTENCIA_CONTRATADO,

            titulo:
                'Desistir do trabalho?',

            mensagem:
                'Ao confirmar, a desistência será registrada e o trabalho poderá seguir para o próximo fluxo definido pelo sistema.',

            textoBotao:
                'Sim, desistir',

            classeBotao:
                'btn-desistir-trabalho',

            mensagemEnvio:
                'Desistência solicitada pelo contratado.',

            mensagemSucesso:
                'Desistência registrada com sucesso.',

        });

    }


    /*
     * =========================================================
     * CONTRATANTE — CONFIRMAR
     * =========================================================
     */

    function solicitarConfirmacaoServico() {

        abrirConfirmacao({

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
     * CONTRATANTE — CONTESTAR
     * =========================================================
     */

    function solicitarContestacaoServico() {

        abrirConfirmacao({

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
     * CONTRATANTE — DESISTIR
     * =========================================================
     */

    function solicitarDesistenciaContratante() {

        abrirConfirmacao({

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
     * CONFIRMAR AÇÃO
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
     * REGRAS DE NEGÓCIO
     * =========================================================
     */

    const podeConcluir =
        !ehContratante &&
        podeConcluirTrabalho(
            statusCodigo
        );


    const podeDesistir =
        podeDesistirTrabalho(
            statusCodigo,
            papelNormalizado
        );


    const podeConfirmar =
        ehContratante &&
        podeConfirmarTrabalho(
            statusCodigo
        );


    const podeContestar =
        ehContratante &&
        podeContestarTrabalho(
            statusCodigo
        );


    const possuiAcoes =
        podeConcluir ||
        podeDesistir ||
        podeConfirmar ||
        podeContestar;


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <>

            {/* =================================================
                MENSAGEM DE SUCESSO
            ================================================= */}

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
            ================================================= */}

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
            ================================================= */}

            {possuiAcoes && (

                <div className="trabalho-acoes">


                    {/* -----------------------------------------
                        CONTRATADO — CONCLUIR
                    ----------------------------------------- */}

                    {podeConcluir && (

                        <button
                            type="button"
                            className="btn-confirmar-trabalho"
                            onClick={
                                solicitarConclusao
                            }
                            disabled={processando}
                        >

                            {processando
                                ? 'Processando...'
                                : '✓ Concluir serviço'}

                        </button>

                    )}


                    {/* -----------------------------------------
                        CONTRATANTE — CONFIRMAR
                    ----------------------------------------- */}

                    {podeConfirmar && (

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
                        CONTRATANTE — CONTESTAR
                    ----------------------------------------- */}

                    {podeContestar && (

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
                    ----------------------------------------- */}

                    {podeDesistir && (

                        <button
                            type="button"
                            className="btn-desistir-trabalho"
                            onClick={
                                ehContratante
                                    ? solicitarDesistenciaContratante
                                    : solicitarDesistenciaContratado
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
            ================================================= */}

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
                        aria-labelledby="trabalho-confirmacao-titulo"
                    >

                        <div className="trabalho-confirmacao-conteudo">

                            <h4 id="trabalho-confirmacao-titulo">

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

        </>
    );
}
