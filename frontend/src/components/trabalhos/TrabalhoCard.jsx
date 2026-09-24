import { useState } from 'react';

import {
    interagirTrabalho,
    TIPOS_INTERACAO_TRABALHO,
} from '../../services/trabalhoService';

import {
    formatarValor,
    formatarData,
    formatarStatusTrabalho,
    formatarStatusPagamento,
    podeConcluirTrabalho,
    podeDesistirTrabalho,
    podeConfirmarTrabalho,
    podeContestarTrabalho,
} from './TrabalhoControle';

import PublicacaoAnexos from '../publicacoes/PublicacaoAnexos';

import '../../styles/trabalhos.css';


export default function TrabalhoCard({
    trabalho,
    papel = 'CONTRATADO',
    onAtualizado,
}) {

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
     * DADOS DO TRABALHO
     * =========================================================
     */

    const publicacao =
        trabalho?.publicacao ?? {};

    const categoria =
        publicacao?.categoria ?? {};

    const status =
        trabalho?.status ?? {};

    const contratante =
        trabalho?.contratante ?? {};

    const contratado =
        trabalho?.contratado ?? {};


    /*
     * =========================================================
     * PAGAMENTO
     * =========================================================
     */

    const pagamento =
        trabalho?.pagamento ??
        trabalho?.pagamentos?.[0] ??
        null;

    const pagamentoStatus =
        pagamento?.status;


    /*
     * =========================================================
     * PAPEL DO USUÁRIO
     * =========================================================
     */

    const papelNormalizado =
        String(papel || '')
            .trim()
            .toUpperCase();

    const ehContratante =
        papelNormalizado === 'CONTRATANTE';


    /*
     * =========================================================
     * STATUS
     * =========================================================
     */

    const statusCodigo =
        typeof status === 'string'
            ? status
            : status?.codigo ?? '';

    const statusNome =
        typeof status === 'object'
            ? (
                status?.nome ||
                formatarStatusTrabalho(
                    statusCodigo
                )
            )
            : formatarStatusTrabalho(
                statusCodigo
            );


    const statusClasse = [
        'trabalho-status',
        `trabalho-status-${String(
            statusCodigo ||
            'sem_status'
        ).toLowerCase()}`,
    ].join(' ');


    /*
     * =========================================================
     * PESSOA RELACIONADA
     * =========================================================
     */

    const pessoaRelacionada =
        ehContratante
            ? contratado
            : contratante;

    const labelPessoa =
        ehContratante
            ? 'Contratado'
            : 'Contratante';


    /*
     * =========================================================
     * PUBLICAÇÃO
     * =========================================================
     */

    const titulo =
        publicacao?.titulo ||
        'Trabalho';

    const descricao =
        publicacao?.descricao ||
        'Nenhuma descrição informada.';

    const nomeCategoria =
        categoria?.nome ||
        'Sem categoria';


    /*
     * =========================================================
     * VALORES FINANCEIROS
     * =========================================================
     *
     * A composição financeira segue o mesmo padrão
     * utilizado nas negociações.
     *
     * valor_trabalho = valor do serviço
     * valor_taxa     = taxa de intermediação JOB
     * valor_total    = valor do serviço + taxa
     */

    const valorTrabalho =
        Number(
            trabalho?.valor_trabalho ??
            pagamento?.valor_trabalho ??
            publicacao?.valor_estimado ??
            0
        );

    const valorTaxa =
        Number(
            trabalho?.valor_taxa ??
            pagamento?.valor_taxa ??
            0
        );

    const valorTotal =
        Number(
            trabalho?.valor_total ??
            pagamento?.valor_total ??
            (
                valorTrabalho +
                valorTaxa
            )
        );

    const taxaPercentual =
        valorTrabalho > 0
            ? (
                (valorTaxa / valorTrabalho) *
                100
            )
            : 0;


    /*
     * Valor principal exibido no resumo.
     *
     * Contratante:
     *   total que será pago.
     *
     * Contratado:
     *   valor que receberá pelo serviço.
     */
    const valorPrincipal =
        ehContratante
            ? valorTotal
            : valorTrabalho;


    /*
     * =========================================================
     * DATA
     * =========================================================
     *
     * data_inicio do trabalho pode ser null.
     *
     * Nesse caso utilizamos a data da publicação.
     */

    const dataInicio =
        trabalho?.data_inicio ??
        publicacao?.data_inicio;


    const dataFim =
        trabalho?.data_fim ??
        publicacao?.data_fim;


    const horarioInicio =
        publicacao?.horario_inicio;


    /*
     * =========================================================
     * LOCAL
     * =========================================================
     */

    const possuiLocal =
        publicacao?.cidade ||
        publicacao?.estado;

    const local =
        possuiLocal
            ? [
                publicacao?.cidade,
                publicacao?.estado,
            ]
                .filter(Boolean)
                .join(' - ')
            : 'Não informado';


    const endereco =
        publicacao?.endereco_servico;


    /*
     * =========================================================
     * PAGAMENTO
     * =========================================================
     */

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
            typeof pagamentoStatus === 'object'
                ? pagamentoStatus?.codigo
                : pagamentoStatus;

        const icones = {

            AGUARDANDO_PROCESSAMENTO:
                '◷',

            PROCESSANDO:
                '↻',

            PAGO:
                '✓',

            ESTORNADO:
                '↩',

            NAO_PROCESSADO:
                '!',

            CANCELADO:
                '×',
        };

        return (
            icones[codigo] ||
            '•'
        );
    }


    /*
     * =========================================================
     * LIMPAR FEEDBACK
     * =========================================================
     */

    function limparFeedback() {

        setMensagemErro('');
        setMensagemSucesso('');

    }


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

        if (
            processando ||
            !trabalho?.id_trabalho
        ) {
            return;
        }

        try {

            setProcessando(true);

            limparFeedback();

            await interagirTrabalho(
                trabalho.id_trabalho,
                {
                    id_interacao_tipo:
                        tipo,

                    mensagem,
                }
            );

            setConfirmacao(null);

            setMensagemSucesso(
                sucesso
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

            setMensagemErro(
                mensagemErro
            );

        } finally {

            setProcessando(false);

        }
    }


    /*
     * =========================================================
     * CONCLUSÃO
     * =========================================================
     */

    function solicitarConclusao() {

        limparFeedback();

        if (ehContratante) {

            setConfirmacao({

                tipo:
                    TIPOS_INTERACAO_TRABALHO
                        .SERVICO_CONFIRMADO,

                titulo:
                    'Confirmar serviço?',

                mensagem:
                    'Confirme somente se o serviço foi realizado conforme combinado.',

                textoBotao:
                    'Sim, confirmar serviço',

                classeBotao:
                    'btn-confirmar-trabalho',

            });

            return;
        }


        setConfirmacao({

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

        });
    }


    /*
     * =========================================================
     * DESISTÊNCIA
     * =========================================================
     */

    function solicitarDesistencia() {

        limparFeedback();

        setConfirmacao({

            tipo:
                ehContratante
                    ? TIPOS_INTERACAO_TRABALHO
                        .DESISTENCIA_CONTRATANTE
                    : TIPOS_INTERACAO_TRABALHO
                        .DESISTENCIA_CONTRATADO,

            titulo:
                'Desistir do trabalho?',

            mensagem:
                ehContratante
                    ? 'Você está solicitando a desistência desta contratação.'
                    : 'Ao confirmar, a desistência será registrada e o trabalho seguirá o fluxo definido pelo sistema.',

            textoBotao:
                'Sim, desistir',

            classeBotao:
                'btn-desistir-trabalho',

        });
    }


    /*
     * =========================================================
     * CONTESTAR
     * =========================================================
     */

    function contestarTrabalho() {

        if (processando) {
            return;
        }

        executarInteracao(

            TIPOS_INTERACAO_TRABALHO
                .SERVICO_CONTESTADO,

            'O serviço não foi realizado conforme combinado.',

            'Contestação registrada com sucesso.'
        );
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


        if (
            confirmacao.tipo ===
            TIPOS_INTERACAO_TRABALHO
                .SERVICO_CONCLUIDO
        ) {

            await executarInteracao(

                confirmacao.tipo,

                'Serviço concluído pelo contratado.',

                'Serviço informado como concluído com sucesso.'
            );

            return;
        }


        if (
            confirmacao.tipo ===
            TIPOS_INTERACAO_TRABALHO
                .SERVICO_CONFIRMADO
        ) {

            await executarInteracao(

                confirmacao.tipo,

                'Serviço realizado conforme combinado.',

                'Serviço confirmado com sucesso.'
            );

            return;
        }


        if (
            confirmacao.tipo ===
            TIPOS_INTERACAO_TRABALHO
                .DESISTENCIA_CONTRATANTE
            ||
            confirmacao.tipo ===
            TIPOS_INTERACAO_TRABALHO
                .DESISTENCIA_CONTRATADO
        ) {

            await executarInteracao(

                confirmacao.tipo,

                ehContratante
                    ? 'Desistência solicitada pelo contratante.'
                    : 'Desistência solicitada pelo contratado.',

                'Desistência registrada com sucesso.'
            );
        }
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

    const podeConcluir =
        ehContratante
            ? false
            : podeConcluirTrabalho(
                statusCodigo
            );


    const podeDesistir =
        podeDesistirTrabalho(
            statusCodigo,
            papel
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
                        {titulo}
                    </h3>

                    <span className="trabalho-categoria">
                        {nomeCategoria}
                    </span>

                </div>


                <span className={statusClasse}>
                    {statusNome}
                </span>

            </header>


            <PublicacaoAnexos
                publicacao={publicacao}
            />


            {/* =================================================
                META
            ================================================== */}

            <div className="contratacao-trabalho-meta">

                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        {ehContratante
                            ? 'Total'
                            : 'Valor do serviço'}
                    </span>

                    <strong className="trabalho-meta-valor">
                        {formatarValor(
                            valorPrincipal
                        )}
                    </strong>

                </div>


                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        Data
                    </span>

                    <strong>
                        {formatarData(dataInicio)}
                    </strong>

                </div>


                <div className="trabalho-meta-item">

                    <span className="trabalho-meta-label">
                        {labelPessoa}
                    </span>

                    <strong>
                        {
                            pessoaRelacionada?.name ||
                            pessoaRelacionada?.nome ||
                            'Não informado'
                        }
                    </strong>

                </div>

            </div>


            {/* =================================================
                HORÁRIO
            ================================================== */}

            {(horarioInicio || dataFim) && (

                <div className="trabalho-detalhes-data">

                    {horarioInicio && (

                        <div className="trabalho-meta-item">

                            <span className="trabalho-meta-label">
                                Horário
                            </span>

                            <strong>
                                {horarioInicio}
                            </strong>

                        </div>

                    )}


                    {dataFim && (

                        <div className="trabalho-meta-item">

                            <span className="trabalho-meta-label">
                                Data final
                            </span>

                            <strong>
                                {formatarData(dataFim)}
                            </strong>

                        </div>

                    )}

                </div>

            )}


            {/* =================================================
                PAGAMENTO
            ================================================== */}

            {!ehContratante && (

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
                                {
                                    pagamento
                                        ? obterNomeStatusPagamento()
                                        : 'Não informado'
                                }
                            </strong>

                        </div>

                    </div>


                    {pagamento && (

                        <strong className="trabalho-pagamento-valor">

                            {formatarValor(
                                pagamento?.valor_trabalho ??
                                valorTrabalho
                            )}

                        </strong>

                    )}

                </div>

            )}


            {/* =================================================
                DESCRIÇÃO
            ================================================== */}

            <div className="contratacao-trabalho-descricao">

                <span className="trabalho-descricao-label">
                    Descrição
                </span>

                <p>
                    {descricao}
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

                {endereco && (

                    <span className="trabalho-endereco">
                        {endereco}
                    </span>

                )}

            </div>


            {/* =================================================
                AVISO
            ================================================== */}

            {statusCodigo ===
                'AGUARDANDO_CONFIRMACAO' && (

                    <div className="trabalho-aviso">

                        <strong>
                            Serviço informado como concluído
                        </strong>

                        <span>
                            {ehContratante
                                ? 'Verifique o serviço antes de confirmar ou contestar a conclusão.'
                                : 'Aguardando a confirmação do contratante.'}
                        </span>

                    </div>

                )}


            {/* =================================================
                SUCESSO
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
                ERRO
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

            {(podeConcluir ||
                podeConfirmar ||
                podeContestar ||
                podeDesistir) && (

                    <div className="trabalho-acoes">


                        {/* CONTRATADO */}

                        {!ehContratante && (

                            <>

                                {podeConcluir && (

                                    <button
                                        type="button"
                                        className="btn-confirmar-trabalho"
                                        onClick={
                                            solicitarConclusao
                                        }
                                        disabled={
                                            processando
                                        }
                                    >
                                        {processando
                                            ? 'Processando...'
                                            : '✓ Concluir serviço'}
                                    </button>

                                )}


                                {podeDesistir && (

                                    <button
                                        type="button"
                                        className="btn-desistir-trabalho"
                                        onClick={
                                            solicitarDesistencia
                                        }
                                        disabled={
                                            processando
                                        }
                                    >
                                        {processando
                                            ? 'Processando...'
                                            : 'Desistir'}
                                    </button>

                                )}

                            </>

                        )}


                        {/* CONTRATANTE */}

                        {ehContratante && (

                            <>

                                {podeConfirmar && (

                                    <button
                                        type="button"
                                        className="btn-confirmar-trabalho"
                                        onClick={
                                            solicitarConclusao
                                        }
                                        disabled={
                                            processando
                                        }
                                    >
                                        ✓ Confirmar serviço
                                    </button>

                                )}


                                {podeContestar && (

                                    <button
                                        type="button"
                                        className="btn-contestar-trabalho"
                                        onClick={
                                            contestarTrabalho
                                        }
                                        disabled={
                                            processando
                                        }
                                    >
                                        Contestar
                                    </button>

                                )}


                                {podeDesistir && (

                                    <button
                                        type="button"
                                        className="btn-desistir-trabalho"
                                        onClick={
                                            solicitarDesistencia
                                        }
                                        disabled={
                                            processando
                                        }
                                    >
                                        Desistir
                                    </button>

                                )}

                            </>

                        )}

                    </div>

                )}


            {/* =================================================
                MODAL
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
                                disabled={
                                    processando
                                }
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
                                disabled={
                                    processando
                                }
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