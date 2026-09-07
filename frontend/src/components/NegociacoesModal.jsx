import { useEffect, useState } from 'react';

import {
    getNegociacoes,
    getNegociacao,
    interagirNegociacao,
    aceitarNegociacao,
    recusarNegociacao,
} from '../services/negociacaoService';

import {
    informarPagamento,
} from '../services/pagamentoService';

import '../styles/negociacoes-modal.css';

export default function NegociacoesModal({
    publicacao,
    onClose,
}) {
    const [negociacoes, setNegociacoes] = useState([]);

    const [
        negociacaoSelecionada,
        setNegociacaoSelecionada,
    ] = useState(null);

    const [carregando, setCarregando] =
        useState(true);

    const [
        carregandoDetalhes,
        setCarregandoDetalhes,
    ] = useState(false);

    const [processando, setProcessando] =
        useState(false);

    const [erro, setErro] = useState('');

    const [mensagem, setMensagem] =
        useState('');

    const [tipoResposta, setTipoResposta] =
        useState('DUVIDA');

    const [valorProposto, setValorProposto] =
        useState('');

    /*
     * Controle visual da tela de pagamento.
     */
    const [exibindoPagamento, setExibindoPagamento] =
        useState(false);

    /*
     * ============================================================
     * CARREGAR NEGOCIAÇÕES
     * ============================================================
     */

    useEffect(() => {
        carregarNegociacoes();
    }, []);

    async function carregarNegociacoes() {
        try {
            setCarregando(true);
            setErro('');

            const response =
                await getNegociacoes();

            const dados =
                response?.data ?? response;

            const lista = Array.isArray(dados)
                ? dados
                : [];

            const relacionadas =
                lista.filter(
                    (negociacao) =>
                        Number(
                            negociacao.id_publicacao
                        ) === Number(publicacao.id)
                );

            setNegociacoes(relacionadas);
        } catch (error) {
            console.error(
                'Erro ao carregar negociações:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível carregar as negociações.'
            );
        } finally {
            setCarregando(false);
        }
    }

    /*
     * ============================================================
     * ABRIR NEGOCIAÇÃO
     * ============================================================
     */

    async function abrirNegociacao(
        negociacao
    ) {
        try {
            setCarregandoDetalhes(true);
            setErro('');
            setExibindoPagamento(false);

            const response =
                await getNegociacao(
                    negociacao.id_negociacao
                );

            const dados =
                response?.data ?? response;

            setNegociacaoSelecionada(dados);

            /*
             * Se a negociação já estiver aguardando pagamento
             * ou processando pagamento, abrimos diretamente
             * a tela de pagamento.
             *
             * Isso também permite que o usuário feche e
             * reabra o modal sem perder o fluxo.
             */
            const codigoStatus =
                obterCodigoStatus(dados);

            if (
                codigoStatus ===
                'AGUARDANDO_PAGAMENTO' ||
                codigoStatus ===
                'PROCESSANDO_PAGAMENTO'
            ) {
                setExibindoPagamento(true);
            }

            limparFormulario();
        } catch (error) {
            console.error(
                'Erro ao carregar negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível carregar a negociação.'
            );
        } finally {
            setCarregandoDetalhes(false);
        }
    }

    /*
     * ============================================================
     * NAVEGAÇÃO
     * ============================================================
     */

    function voltarParaLista() {
        setNegociacaoSelecionada(null);
        setExibindoPagamento(false);
        limparFormulario();
        carregarNegociacoes();
    }

    function voltarParaNegociacao() {
        setExibindoPagamento(false);
        setErro('');
    }

    /*
     * ============================================================
     * FORMULÁRIO
     * ============================================================
     */

    function limparFormulario() {
        setMensagem('');
        setValorProposto('');
        setTipoResposta('DUVIDA');
    }

    /*
     * ============================================================
     * FORMATAÇÃO
     * ============================================================
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

    /*
     * ============================================================
     * STATUS
     * ============================================================
     *
     * O backend retorna o relacionamento:
     *
     * status: {
     *     id,
     *     codigo,
     *     nome,
     *     descricao,
     *     ativo,
     *     ...
     * }
     *
     * Portanto nunca devemos renderizar diretamente:
     *
     * negociacao.status
     */

    function obterCodigoStatus(negociacao) {
        if (!negociacao) {
            return null;
        }

        if (
            typeof negociacao.status ===
            'string'
        ) {
            return negociacao.status;
        }

        return (
            negociacao.status?.codigo ||
            null
        );
    }

    function obterNomeStatus(negociacao) {
        if (!negociacao) {
            return 'Não informado';
        }

        if (
            negociacao.status &&
            typeof negociacao.status ===
            'object'
        ) {
            return (
                negociacao.status.nome ||
                formatarStatus(
                    negociacao.status.codigo
                )
            );
        }

        return formatarStatus(
            negociacao.status
        );
    }

    function formatarStatus(status) {
        const statusMap = {
            AGUARDANDO_INTERESSADO:
                'Aguardando interessado',

            AGUARDANDO_CONTRATANTE:
                'Aguardando contratante',

            AGUARDANDO_PAGAMENTO:
                'Aguardando pagamento',

            PROCESSANDO_PAGAMENTO:
                'Processando pagamento',

            FECHADA:
                'Fechada',

            ENCERRADA:
                'Encerrada',

            CANCELADA:
                'Cancelada',
        };

        return (
            statusMap[status] ||
            status ||
            'Não informado'
        );
    }

    function formatarTipo(tipo) {
        const tipos = {
            INTERESSE: 'Interesse',
            PROPOSTA: 'Proposta',
            DUVIDA: 'Dúvida',
        };

        return tipos[tipo] || tipo;
    }

    function formatarData(data) {
        if (!data) {
            return '';
        }

        const dataObjeto =
            new Date(data);

        if (
            Number.isNaN(
                dataObjeto.getTime()
            )
        ) {
            return data;
        }

        return dataObjeto.toLocaleString(
            'pt-BR'
        );
    }

    /*
     * ============================================================
     * INTERAÇÕES
     * ============================================================
     */

    function obterUltimaInteracao() {
        const interacoes =
            negociacaoSelecionada?.interacoes ||
            [];

        if (interacoes.length === 0) {
            return null;
        }

        return interacoes[
            interacoes.length - 1
        ];
    }

    function obterTipoUltimaInteracao() {
        const ultima =
            obterUltimaInteracao();

        return (
            ultima?.interacao?.tipo?.tipo ||
            null
        );
    }

    /*
     * ============================================================
     * REGRAS DE RESPOSTA
     * ============================================================
     *
     * O modal é utilizado pelo contratante.
     *
     * O contratante só pode interagir quando:
     *
     * AGUARDANDO_CONTRATANTE
     *
     * Depois que aceitar:
     *
     * AGUARDANDO_PAGAMENTO
     *
     * não existem mais ações de negociação.
     */

    function podeResponder() {
        if (!negociacaoSelecionada) {
            return false;
        }

        const status =
            obterCodigoStatus(
                negociacaoSelecionada
            );

        if (
            status !==
            'AGUARDANDO_CONTRATANTE'
        ) {
            return false;
        }

        return true;
    }

    /*
     * ============================================================
     * AÇÕES DISPONÍVEIS
     * ============================================================
     */

    function obterAcoesDisponiveis() {
        if (!podeResponder()) {
            return {
                aceitar: false,
                recusar: false,
                responder: false,
            };
        }

        const tipo =
            obterTipoUltimaInteracao();

        /*
         * INTERESSE
         *
         * Contratante pode:
         * - aceitar
         * - recusar
         */
        if (tipo === 'INTERESSE') {
            return {
                aceitar: true,
                recusar: true,
                responder: false,
            };
        }

        /*
         * PROPOSTA
         *
         * Contratante pode:
         * - aceitar
         * - recusar
         * - nova proposta
         * - dúvida
         */
        if (tipo === 'PROPOSTA') {
            return {
                aceitar: true,
                recusar: true,
                responder: true,
            };
        }

        /*
         * DÚVIDA
         *
         * Contratante pode:
         * - responder
         */
        if (tipo === 'DUVIDA') {
            return {
                aceitar: false,
                recusar: false,
                responder: true,
            };
        }

        return {
            aceitar: false,
            recusar: false,
            responder: false,
        };
    }

    /*
     * ============================================================
     * ATUALIZAR DETALHES
     * ============================================================
     */

    async function atualizarDetalhes() {
        if (!negociacaoSelecionada) {
            return;
        }

        const response =
            await getNegociacao(
                negociacaoSelecionada.id_negociacao
            );

        const dados =
            response?.data ?? response;

        setNegociacaoSelecionada(dados);
        limparFormulario();
    }

    /*
     * ============================================================
     * ACEITAR NEGOCIAÇÃO
     * ============================================================
     *
     * Fluxo:
     *
     * Contratante clica em aceitar
     *          ↓
     * Backend aceita
     *          ↓
     * Negociação = AGUARDANDO_PAGAMENTO
     *          ↓
     * Pagamento = AGUARDANDO_PAGAMENTO
     *          ↓
     * Abre tela de pagamento
     */

    async function handleAceitar() {
        if (
            !negociacaoSelecionada ||
            processando
        ) {
            return;
        }

        try {
            setProcessando(true);
            setErro('');

            await aceitarNegociacao(
                negociacaoSelecionada.id_negociacao
            );

            /*
             * Busca novamente a negociação para
             * receber o novo status e o pagamento
             * criado pelo backend.
             */
            const response =
                await getNegociacao(
                    negociacaoSelecionada.id_negociacao
                );

            const dados =
                response?.data ?? response;

            setNegociacaoSelecionada(dados);

            /*
             * Agora mostramos a tela de pagamento.
             */
            setExibindoPagamento(true);

        } catch (error) {
            console.error(
                'Erro ao aceitar negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível aceitar a negociação.'
            );
        } finally {
            setProcessando(false);
        }
    }

    /*
     * ============================================================
     * RECUSAR NEGOCIAÇÃO
     * ============================================================
     */

    async function handleRecusar() {
        if (
            !negociacaoSelecionada ||
            processando
        ) {
            return;
        }

        const confirmar =
            window.confirm(
                'Deseja recusar esta negociação?'
            );

        if (!confirmar) {
            return;
        }

        try {
            setProcessando(true);
            setErro('');

            await recusarNegociacao(
                negociacaoSelecionada.id_negociacao
            );

            await atualizarDetalhes();
            await carregarNegociacoes();

        } catch (error) {
            console.error(
                'Erro ao recusar negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível recusar a negociação.'
            );
        } finally {
            setProcessando(false);
        }
    }

    /*
     * ============================================================
     * RESPONDER NEGOCIAÇÃO
     * ============================================================
     */

    async function handleResponder() {
        if (
            !negociacaoSelecionada ||
            processando
        ) {
            return;
        }

        if (!mensagem.trim()) {
            setErro(
                'Digite uma mensagem para responder.'
            );

            return;
        }

        if (
            tipoResposta === 'PROPOSTA' &&
            (
                valorProposto === '' ||
                Number(valorProposto) <= 0
            )
        ) {
            setErro(
                'Informe um valor válido para a proposta.'
            );

            return;
        }

        try {
            setProcessando(true);
            setErro('');

            const dados = {
                tipo: tipoResposta,
                mensagem: mensagem.trim(),
            };

            if (
                tipoResposta ===
                'PROPOSTA'
            ) {
                dados.valor_proposto =
                    Number(valorProposto);
            }

            await interagirNegociacao(
                negociacaoSelecionada.id_negociacao,
                dados
            );

            await atualizarDetalhes();
            await carregarNegociacoes();

        } catch (error) {
            console.error(
                'Erro ao responder negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível enviar a resposta.'
            );
        } finally {
            setProcessando(false);
        }
    }

    /*
     * ============================================================
     * PAGAMENTO REALIZADO
     * ============================================================
     *
     * Fluxo:
     *
     * Contratante clica "Pagamento realizado"
     *          ↓
     * POST /negociacoes/{id}/pagamento/informar
     *          ↓
     * Pagamento = AGUARDANDO_PROCESSAMENTO
     *          ↓
     * Negociação = PROCESSANDO_PAGAMENTO
     *          ↓
     * Fecha a tela de pagamento
     *          ↓
     * Atualiza a negociação
     *
     * A validação do pagamento será feita
     * posteriormente de forma manual no banco.
     */

    async function handlePagamentoRealizado() {
        if (
            !negociacaoSelecionada ||
            processando
        ) {
            return;
        }

        try {
            setProcessando(true);
            setErro('');

            await informarPagamento(
                negociacaoSelecionada.id_negociacao
            );

            /*
             * Busca novamente os dados para manter
             * o estado atualizado.
             */
            const response =
                await getNegociacao(
                    negociacaoSelecionada.id_negociacao
                );

            const dados =
                response?.data ?? response;

            setNegociacaoSelecionada(dados);

            /*
             * Fecha a tela de pagamento.
             */
            setExibindoPagamento(false);

            /*
             * Atualiza a lista.
             */
            await carregarNegociacoes();

        } catch (error) {
            console.error(
                'Erro ao informar pagamento:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível informar o pagamento.'
            );
        } finally {
            setProcessando(false);
        }
    }

    const acoes =
        obterAcoesDisponiveis();

    const tipoUltimaInteracao =
        obterTipoUltimaInteracao();

    /*
     * ============================================================
     * TELA DE PAGAMENTO
     * ============================================================
     */

    if (
        negociacaoSelecionada &&
        exibindoPagamento
    ) {
        const statusPagamento =
            obterCodigoStatus(
                negociacaoSelecionada
            );

        return (
            <div
                className="negociacoes-modal-overlay"
                onMouseDown={onClose}
            >
                <div
                    className="negociacoes-modal"
                    onMouseDown={(event) =>
                        event.stopPropagation()
                    }
                >

                    <header className="negociacoes-modal-header">

                        <div>

                            <h2>
                                Pagamento
                            </h2>

                            <p>
                                {publicacao.titulo}
                            </p>

                        </div>

                        <button
                            type="button"
                            className="negociacoes-modal-fechar"
                            onClick={onClose}
                        >
                            ×
                        </button>

                    </header>

                    <section className="negociacao-pagamento">

                        <button
                            type="button"
                            className="negociacao-voltar"
                            onClick={
                                voltarParaNegociacao
                            }
                            disabled={processando}
                        >
                            ← Voltar para negociação
                        </button>

                        <div className="pagamento-titulo">

                            <h3>
                                Pagamento via PIX
                            </h3>

                            <p>
                                Para confirmar a contratação,
                                realize o pagamento do valor
                                acordado.
                            </p>

                        </div>

                        <div className="pagamento-resumo">

                            <div>

                                <span>
                                    Serviço
                                </span>

                                <strong>
                                    {
                                        publicacao.titulo
                                    }
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Contratado
                                </span>

                                <strong>
                                    {
                                        negociacaoSelecionada
                                            .interessado
                                            ?.name ||
                                        negociacaoSelecionada
                                            .interessado
                                            ?.nome ||
                                        'Usuário'
                                    }
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Valor da negociação
                                </span>

                                <strong className="pagamento-valor">

                                    {formatarValor(
                                        negociacaoSelecionada
                                            .valor_trabalho ??
                                        publicacao.valor_estimado
                                    )}

                                </strong>

                            </div>

                        </div>

                        <div className="pagamento-status">

                            <span className="pagamento-status-indicador">
                                ⏳
                            </span>

                            <div>

                                <strong>
                                    {statusPagamento ===
                                        'PROCESSANDO_PAGAMENTO'
                                        ? 'Pagamento informado'
                                        : 'Aguardando pagamento'}
                                </strong>

                                <span>
                                    {statusPagamento ===
                                        'PROCESSANDO_PAGAMENTO'
                                        ? 'O pagamento foi informado e está aguardando processamento.'
                                        : 'Realize o pagamento via PIX e depois informe que o pagamento foi realizado.'}
                                </span>

                            </div>

                        </div>

                        {statusPagamento ===
                            'AGUARDANDO_PAGAMENTO' && (

                                <div className="pagamento-qrcode-container">

                                    <h3>
                                        Escaneie o QR Code
                                    </h3>

                                    {/*
                                 * QR Code FICTÍCIO.
                                 *
                                 * Será substituído pelo QR Code
                                 * real gerado pelo backend.
                                 */}

                                    <div
                                        className="pagamento-qrcode-ficticio"
                                        aria-label="QR Code fictício"
                                    >

                                        <div className="qr-canto qr-canto-1">
                                            <span />
                                        </div>

                                        <div className="qr-canto qr-canto-2">
                                            <span />
                                        </div>

                                        <div className="qr-canto qr-canto-3">
                                            <span />
                                        </div>

                                        <div className="qr-pontos">

                                            {Array.from(
                                                { length: 49 },
                                                (_, index) => (
                                                    <span
                                                        key={index}
                                                        className={
                                                            (
                                                                index * 7 +
                                                                3
                                                            ) % 5 !== 0
                                                                ? 'ativo'
                                                                : ''
                                                        }
                                                    />
                                                )
                                            )}

                                        </div>

                                    </div>

                                    <p className="pagamento-qrcode-aviso">
                                        QR Code fictício para
                                        demonstração.
                                    </p>

                                </div>
                            )}

                        {statusPagamento ===
                            'AGUARDANDO_PAGAMENTO' && (

                                <div className="pagamento-pix">

                                    <span>
                                        Chave PIX
                                    </span>

                                    <strong>
                                        job-pagamento@teste.com
                                    </strong>

                                    <small>
                                        Chave fictícia para demonstração
                                    </small>

                                </div>
                            )}

                        <div className="pagamento-aviso">

                            <strong>
                                🔒 Pagamento seguro
                            </strong>

                            <span>
                                A contratação somente será
                                confirmada após a identificação
                                do pagamento.
                            </span>

                        </div>

                        {erro && (
                            <div className="negociacao-erro-acao">
                                {erro}
                            </div>
                        )}

                        {statusPagamento ===
                            'AGUARDANDO_PAGAMENTO' && (

                                <button
                                    type="button"
                                    className="btn-pagamento-realizado"
                                    onClick={
                                        handlePagamentoRealizado
                                    }
                                    disabled={processando}
                                >
                                    {processando
                                        ? 'Processando...'
                                        : 'Pagamento realizado'}
                                </button>
                            )}

                        <button
                            type="button"
                            className="btn-pagamento-voltar"
                            onClick={
                                voltarParaNegociacao
                            }
                            disabled={processando}
                        >
                            Voltar
                        </button>

                    </section>

                </div>
            </div>
        );
    }

    /*
     * ============================================================
     * LISTA / DETALHES
     * ============================================================
     */

    return (
        <div
            className="negociacoes-modal-overlay"
            onMouseDown={onClose}
        >
            <div
                className="negociacoes-modal"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                <header className="negociacoes-modal-header">

                    <div>

                        <h2>
                            {negociacaoSelecionada
                                ? 'Negociação'
                                : 'Negociações'}
                        </h2>

                        <p>
                            {publicacao.titulo}
                        </p>

                    </div>

                    <button
                        type="button"
                        className="negociacoes-modal-fechar"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </header>

                {negociacaoSelecionada ? (

                    <section className="negociacao-detalhes">

                        <button
                            type="button"
                            className="negociacao-voltar"
                            onClick={
                                voltarParaLista
                            }
                        >
                            ← Voltar para negociações
                        </button>

                        <div className="negociacao-resumo">

                            <div>

                                <span>
                                    Interessado
                                </span>

                                <strong>
                                    {
                                        negociacaoSelecionada
                                            .interessado
                                            ?.name ||
                                        negociacaoSelecionada
                                            .interessado
                                            ?.nome ||
                                        'Usuário'
                                    }
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {obterNomeStatus(
                                        negociacaoSelecionada
                                    )}
                                </strong>

                            </div>

                            <div>

                                <span>
                                    Valor
                                </span>

                                <strong>
                                    {formatarValor(
                                        negociacaoSelecionada
                                            .valor_trabalho
                                    )}
                                </strong>

                            </div>

                        </div>

                        <div className="negociacao-historico">

                            <h3>
                                Histórico
                            </h3>

                            {(
                                negociacaoSelecionada
                                    .interacoes ||
                                []
                            ).length === 0 ? (

                                <p className="negociacao-sem-interacoes">
                                    Nenhuma interação encontrada.
                                </p>

                            ) : (

                                (
                                    negociacaoSelecionada
                                        .interacoes ||
                                    []
                                ).map(
                                    (
                                        item
                                    ) => {

                                        const interacao =
                                            item.interacao;

                                        return (

                                            <article
                                                key={
                                                    item.id_negociacao_interacao
                                                }
                                                className="negociacao-interacao"
                                            >

                                                <div className="negociacao-interacao-header">

                                                    <strong>
                                                        {interacao
                                                            ?.remetente
                                                            ?.name ||
                                                            interacao
                                                                ?.remetente
                                                                ?.nome ||
                                                            'Usuário'}
                                                    </strong>

                                                    <span>
                                                        {formatarData(
                                                            interacao?.created_at
                                                        )}
                                                    </span>

                                                </div>

                                                <div className="negociacao-interacao-tipo">

                                                    {formatarTipo(
                                                        interacao
                                                            ?.tipo
                                                            ?.tipo
                                                    )}

                                                </div>

                                                {interacao?.mensagem && (

                                                    <p>
                                                        {
                                                            interacao.mensagem
                                                        }
                                                    </p>

                                                )}

                                                {interacao
                                                    ?.valor_proposto !==
                                                    null &&
                                                    interacao
                                                        ?.valor_proposto !==
                                                    undefined && (

                                                        <strong className="negociacao-interacao-valor">

                                                            Proposta:{' '}

                                                            {formatarValor(
                                                                interacao.valor_proposto
                                                            )}

                                                        </strong>

                                                    )}

                                            </article>

                                        );
                                    }
                                )

                            )}

                        </div>

                        {(acoes.aceitar ||
                            acoes.recusar ||
                            acoes.responder) && (

                                <div className="negociacao-acoes">

                                    <div className="negociacao-acoes-titulo">

                                        <h3>
                                            Sua vez
                                        </h3>

                                        <span>
                                            Última interação:{' '}
                                            {formatarTipo(
                                                tipoUltimaInteracao
                                            )}
                                        </span>

                                    </div>

                                    {(acoes.aceitar ||
                                        acoes.recusar) && (

                                            <div className="negociacao-botoes-principais">

                                                {acoes.aceitar && (

                                                    <button
                                                        type="button"
                                                        className="btn-negociacao-aceitar"
                                                        onClick={
                                                            handleAceitar
                                                        }
                                                        disabled={
                                                            processando
                                                        }
                                                    >
                                                        {processando
                                                            ? 'Processando...'
                                                            : '✓ Aceitar'}
                                                    </button>

                                                )}

                                                {acoes.recusar && (

                                                    <button
                                                        type="button"
                                                        className="btn-negociacao-recusar"
                                                        onClick={
                                                            handleRecusar
                                                        }
                                                        disabled={
                                                            processando
                                                        }
                                                    >
                                                        {processando
                                                            ? 'Processando...'
                                                            : '✕ Recusar'}
                                                    </button>

                                                )}

                                            </div>

                                        )}

                                    {acoes.responder && (

                                        <div className="negociacao-resposta">

                                            {tipoUltimaInteracao ===
                                                'PROPOSTA' && (

                                                    <div className="negociacao-resposta-aviso">

                                                        O interessado enviou uma proposta.
                                                        Você pode aceitar, recusar,
                                                        enviar uma nova proposta
                                                        ou tirar uma dúvida.

                                                    </div>

                                                )}

                                            {tipoUltimaInteracao ===
                                                'DUVIDA' && (

                                                    <div className="negociacao-resposta-aviso">

                                                        O interessado enviou uma dúvida.
                                                        Envie uma resposta para continuar
                                                        a negociação.

                                                    </div>

                                                )}

                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="tipo-resposta">
                                                    Tipo da resposta
                                                </label>

                                                <select
                                                    id="tipo-resposta"
                                                    value={
                                                        tipoResposta
                                                    }
                                                    onChange={(
                                                        event
                                                    ) => {

                                                        setTipoResposta(
                                                            event.target.value
                                                        );

                                                        if (
                                                            event
                                                                .target
                                                                .value !==
                                                            'PROPOSTA'
                                                        ) {
                                                            setValorProposto(
                                                                ''
                                                            );
                                                        }

                                                    }}
                                                    disabled={
                                                        processando
                                                    }
                                                >

                                                    {tipoUltimaInteracao ===
                                                        'PROPOSTA' && (

                                                            <option value="PROPOSTA">
                                                                Nova proposta
                                                            </option>

                                                        )}

                                                    <option value="DUVIDA">
                                                        Dúvida
                                                    </option>

                                                </select>

                                            </div>

                                            {tipoResposta ===
                                                'PROPOSTA' && (

                                                    <div className="negociacao-form-grupo">

                                                        <label htmlFor="valor-proposto">
                                                            Novo valor
                                                        </label>

                                                        <input
                                                            id="valor-proposto"
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={
                                                                valorProposto
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setValorProposto(
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="R$ 0,00"
                                                            disabled={
                                                                processando
                                                            }
                                                        />

                                                    </div>

                                                )}

                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="mensagem-resposta">
                                                    Mensagem
                                                </label>

                                                <textarea
                                                    id="mensagem-resposta"
                                                    value={
                                                        mensagem
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setMensagem(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Digite sua resposta..."
                                                    rows="4"
                                                    maxLength="5000"
                                                    disabled={
                                                        processando
                                                    }
                                                />

                                            </div>

                                            <button
                                                type="button"
                                                className="btn-negociacao-responder"
                                                onClick={
                                                    handleResponder
                                                }
                                                disabled={
                                                    processando
                                                }
                                            >
                                                {processando
                                                    ? 'Enviando...'
                                                    : 'Enviar resposta'}
                                            </button>

                                        </div>

                                    )}

                                </div>

                            )}

                        {!acoes.aceitar &&
                            !acoes.recusar &&
                            !acoes.responder && (

                                <div className="negociacao-sem-acoes">

                                    <strong>
                                        {obterNomeStatus(
                                            negociacaoSelecionada
                                        )}
                                    </strong>

                                    <span>
                                        Não há ações disponíveis
                                        para esta negociação no momento.
                                    </span>

                                </div>

                            )}

                        {erro && (

                            <div className="negociacao-erro-acao">
                                {erro}
                            </div>

                        )}

                    </section>

                ) : (

                    <section className="negociacoes-lista">

                        {carregando && (

                            <div className="negociacoes-loading">
                                Carregando negociações...
                            </div>

                        )}

                        {!carregando &&
                            erro && (

                                <div className="negociacoes-error">
                                    {erro}
                                </div>

                            )}

                        {!carregando &&
                            !erro &&
                            negociacoes.length ===
                            0 && (

                                <div className="negociacoes-empty">

                                    <div>
                                        🤝
                                    </div>

                                    <h3>
                                        Nenhuma negociação
                                    </h3>

                                    <p>
                                        Esta publicação ainda não possui negociações.
                                    </p>

                                </div>

                            )}

                        {!carregando &&
                            !erro &&
                            negociacoes.length >
                            0 && (

                                <div className="negociacoes-cards">

                                    {negociacoes.map(
                                        (
                                            negociacao
                                        ) => (

                                            <article
                                                key={
                                                    negociacao.id_negociacao
                                                }
                                                className="negociacao-card"
                                            >

                                                <div className="negociacao-card-header">

                                                    <div>

                                                        <h3>
                                                            {negociacao
                                                                .interessado
                                                                ?.name ||
                                                                negociacao
                                                                    .interessado
                                                                    ?.nome ||
                                                                'Interessado'}
                                                        </h3>

                                                        <span>
                                                            Interessado
                                                        </span>

                                                    </div>

                                                    <span className="negociacao-status">

                                                        {obterNomeStatus(
                                                            negociacao
                                                        )}

                                                    </span>

                                                </div>

                                                <div className="negociacao-card-info">

                                                    <div>

                                                        <span>
                                                            Valor
                                                        </span>

                                                        <strong>
                                                            {formatarValor(
                                                                negociacao
                                                                    .valor_trabalho
                                                            )}
                                                        </strong>

                                                    </div>

                                                    <div>

                                                        <span>
                                                            Interações
                                                        </span>

                                                        <strong>
                                                            {
                                                                (
                                                                    negociacao
                                                                        .interacoes ||
                                                                    []
                                                                ).length
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>

                                                <button
                                                    type="button"
                                                    className="btn-abrir-negociacao"
                                                    onClick={() =>
                                                        abrirNegociacao(
                                                            negociacao
                                                        )
                                                    }
                                                >
                                                    Abrir negociação
                                                </button>

                                            </article>

                                        ))}

                                </div>

                            )}

                    </section>

                )}

                {carregandoDetalhes && (

                    <div className="negociacoes-detalhes-loading">
                        Carregando negociação...
                    </div>

                )}

            </div>
        </div>
    );
}