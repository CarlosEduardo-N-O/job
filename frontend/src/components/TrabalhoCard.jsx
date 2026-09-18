import { useState } from 'react';

import {
    interagirTrabalho,
    TIPOS_INTERACAO_TRABALHO,
} from '../services/trabalhoService';

export default function TrabalhoCard({
    trabalho,
    onAtualizado,
}) {
    const [processando, setProcessando] = useState(false);

    const [confirmacao, setConfirmacao] = useState(null);
    const [mensagemErro, setMensagemErro] = useState('');
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    const publicacao = trabalho?.publicacao;
    const status = trabalho?.status;

    /*
     * =========================================================
     * PAGAMENTO
     * =========================================================
     *
     * O backend pode retornar:
     *
     * pagamento: {...}
     *
     * ou:
     *
     * pagamentos: [
     *     {...}
     * ]
     *
     * Utilizamos o pagamento mais recente.
     */

    const pagamento =
        trabalho?.pagamento ??
        trabalho?.pagamentos?.[0] ??
        null;

    const pagamentoStatus =
        pagamento?.status;

    /*
     * =========================================================
     * FORMATAÇÃO
     * =========================================================
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

        const valor = String(data);

        const partes = valor
            .split('T')[0]
            .split('-');

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        return data;
    }

    /*
     * =========================================================
     * STATUS DO TRABALHO
     * =========================================================
     */

    function formatarStatus(statusCodigo) {
        const statusMap = {
            PENDENTE:
                'Aguardando realização',

            AGUARDANDO_CONFIRMACAO:
                'Aguardando confirmação',

            CONCLUIDO:
                'Concluído',

            EM_AVALIACAO:
                'Em avaliação',

            DESISTENCIA:
                'Desistência',

            ESTORNADO:
                'Estornado',

            CANCELADO:
                'Cancelado',
        };

        return (
            statusMap[statusCodigo] ||
            statusCodigo ||
            'Não informado'
        );
    }

    function obterNomeStatus() {
        if (
            status &&
            typeof status === 'object'
        ) {
            return (
                status.nome ||
                formatarStatus(status.codigo)
            );
        }

        return formatarStatus(status);
    }

    function obterClasseStatus() {
        const codigo = status?.codigo;

        return [
            'trabalho-status',
            `trabalho-status-${String(
                codigo || 'sem_status'
            ).toLowerCase()}`,
        ].join(' ');
    }

    /*
     * =========================================================
     * STATUS DO PAGAMENTO
     * =========================================================
     */

    function formatarStatusPagamento(statusCodigo) {
        const statusMap = {
            AGUARDANDO_PROCESSAMENTO:
                'Aguardando processamento',

            PROCESSANDO:
                'Processando pagamento',

            PAGO:
                'Pagamento realizado',

            ESTORNADO:
                'Pagamento estornado',

            NAO_PROCESSADO:
                'Pagamento não processado',

            CANCELADO:
                'Pagamento cancelado',
        };

        return (
            statusMap[statusCodigo] ||
            statusCodigo ||
            'Não informado'
        );
    }

    function obterNomeStatusPagamento() {
        if (
            pagamentoStatus &&
            typeof pagamentoStatus === 'object'
        ) {
            return (
                pagamentoStatus.nome ||
                formatarStatusPagamento(
                    pagamentoStatus.codigo
                )
            );
        }

        return formatarStatusPagamento(
            pagamentoStatus
        );
    }

    function obterIconePagamento() {
        const codigo =
            pagamentoStatus?.codigo;

        const icones = {
            AGUARDANDO_PROCESSAMENTO: '◷',
            PROCESSANDO: '↻',
            PAGO: '✓',
            ESTORNADO: '↩',
            NAO_PROCESSADO: '!',
            CANCELADO: '×',
        };

        return icones[codigo] || '•';
    }

    /*
     * =========================================================
     * INTERAÇÕES
     * =========================================================
     */

    async function executarInteracao(
        tipo,
        mensagem
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

            setMensagemSucesso(
                tipo ===
                    TIPOS_INTERACAO_TRABALHO.SERVICO_CONCLUIDO
                    ? 'Serviço informado como concluído com sucesso.'
                    : 'Desistência registrada com sucesso.'
            );

            if (onAtualizado) {
                await onAtualizado();
            }

        } catch (error) {
            console.error(
                'Erro ao interagir com trabalho:',
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
     * SOLICITAR CONCLUSÃO
     * =========================================================
     */

    function solicitarConclusao() {
        setMensagemErro('');
        setMensagemSucesso('');

        setConfirmacao({
            tipo:
                TIPOS_INTERACAO_TRABALHO.SERVICO_CONCLUIDO,

            titulo:
                'Concluir serviço?',

            mensagem:
                'Confirme que o serviço foi realizado. O contratante será solicitado a confirmar a conclusão.',

            textoBotao:
                'Sim, concluir serviço',

            classeBotao:
                'btn-confirmar-trabalho',
        });
    }

    /*
     * =========================================================
     * SOLICITAR DESISTÊNCIA
     * =========================================================
     */

    function solicitarDesistencia() {
        setMensagemErro('');
        setMensagemSucesso('');

        setConfirmacao({
            tipo:
                TIPOS_INTERACAO_TRABALHO.DESISTENCIA_CONTRATADO,

            titulo:
                'Desistir do trabalho?',

            mensagem:
                'Ao confirmar, a desistência será registrada e o trabalho poderá seguir para o próximo fluxo definido pelo sistema.',

            textoBotao:
                'Sim, desistir',

            classeBotao:
                'btn-desistir-trabalho',
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
            confirmacao.tipo ===
                TIPOS_INTERACAO_TRABALHO.SERVICO_CONCLUIDO
                ? 'Serviço concluído pelo contratado.'
                : 'Desistência solicitada pelo contratado.'
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
     * REGRAS
     * =========================================================
     */

    function podeConcluir() {
        return (
            status?.codigo ===
            'PENDENTE'
        );
    }

    function podeDesistir() {
        return (
            status?.codigo ===
            'PENDENTE'
        );
    }

    /*
     * =========================================================
     * LOCAL
     * =========================================================
     */

    const local =
        publicacao?.cidade ||
        publicacao?.estado
            ? [
                publicacao?.cidade,
                publicacao?.estado,
            ]
                .filter(Boolean)
                .join(' - ')
            : 'Não informado';

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
                        {publicacao?.titulo || 'Trabalho'}
                    </h3>

                    {publicacao?.categoria?.nome && (
                        <span className="trabalho-categoria">
                            {publicacao.categoria.nome}
                        </span>
                    )}

                </div>

                <span className={obterClasseStatus()}>
                    {obterNomeStatus()}
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
                            trabalho?.data_inicio ??
                            publicacao?.data_inicio
                        )}
                    </strong>

                </div>


                {/* ---------------------------------------------
                    CONTRATANTE
                ---------------------------------------------- */}

                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        Contratante
                    </span>

                    <strong>
                        {trabalho?.contratante?.name ||
                            'Não informado'}
                    </strong>

                </div>

            </div>


            {/* =================================================
                PAGAMENTO
            ================================================== */}

            <div className="trabalho-pagamento">

                <div className="trabalho-pagamento-info">

                    <div className="trabalho-pagamento-icon">
                        {obterIconePagamento()}
                    </div>

                    <div className="trabalho-pagamento-texto">

                        <span>
                            Pagamento
                        </span>

                        <strong>
                            {pagamento
                                ? obterNomeStatusPagamento()
                                : 'Não informado'}
                        </strong>

                    </div>

                </div>

                {pagamento?.valor !== undefined &&
                    pagamento?.valor !== null && (

                        <strong className="trabalho-pagamento-valor">

                            {formatarValor(
                                pagamento.valor
                            )}

                        </strong>

                    )}

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

            <div className="trabalho-local">

                <div className="trabalho-local-label">

                    <span>
                        Local
                    </span>

                </div>

                <strong>
                    {local}
                </strong>

            </div>


            {/* =================================================
                AVISO DE CONFIRMAÇÃO
            ================================================== */}

            {status?.codigo ===
                'AGUARDANDO_CONFIRMACAO' && (

                <div className="trabalho-aviso">

                    <strong>
                        Serviço informado como concluído
                    </strong>

                    <span>
                        Aguardando a confirmação do contratante.
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

            {(podeConcluir() ||
                podeDesistir()) && (

                <div className="trabalho-acoes">

                    {podeConcluir() && (

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

                    {podeDesistir() && (

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
                                : 'Desistir'}
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

        </article>
    );
}