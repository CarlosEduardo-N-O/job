import { useEffect, useState } from 'react';

import {
    getNegociacao,
    interagirNegociacao,
    aceitarNegociacao,
    recusarNegociacao,
} from '../services/negociacaoService';

import '../styles/negociacoes-modal.css';

export default function TrabalhosNegociacaoModal({
    negociacao,
    onClose,
}) {
    const [
        negociacaoSelecionada,
        setNegociacaoSelecionada,
    ] = useState(null);

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        processando,
        setProcessando,
    ] = useState(false);

    const [
        erro,
        setErro,
    ] = useState('');

    const [
        mensagem,
        setMensagem,
    ] = useState('');

    const [
        tipoResposta,
        setTipoResposta,
    ] = useState('DUVIDA');

    const [
        valorProposto,
        setValorProposto,
    ] = useState('');

    const [
        exibindoInteracoes,
        setExibindoInteracoes,
    ] = useState(false);


    /*
     * ============================================================
     * CARREGAR NEGOCIAÇÃO
     * ============================================================
     */

    useEffect(() => {
        if (!negociacao?.id_negociacao) {
            return;
        }

        carregarNegociacao();
    }, [negociacao]);


    async function carregarNegociacao() {
        try {
            setCarregando(true);
            setErro('');

            const response =
                await getNegociacao(
                    negociacao.id_negociacao
                );

            const dados =
                response?.data ?? response;

            setNegociacaoSelecionada(dados);

            limparFormulario();

            /*
             * Sempre que abrir/recarregar a negociação,
             * o histórico começa fechado.
             */
            setExibindoInteracoes(false);

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
            setCarregando(false);
        }
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
     * STATUS
     * ============================================================
     */

    function obterCodigoStatus(negociacaoAtual) {
        if (!negociacaoAtual) {
            return null;
        }

        if (
            typeof negociacaoAtual.status ===
            'string'
        ) {
            return negociacaoAtual.status;
        }

        return (
            negociacaoAtual.status?.codigo ||
            null
        );
    }


    function obterNomeStatus(negociacaoAtual) {
        if (!negociacaoAtual) {
            return 'Não informado';
        }

        if (
            negociacaoAtual.status &&
            typeof negociacaoAtual.status ===
            'object'
        ) {
            return (
                negociacaoAtual.status.nome ||
                formatarStatus(
                    negociacaoAtual.status.codigo
                )
            );
        }

        return formatarStatus(
            negociacaoAtual.status
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


    function formatarTipo(tipo) {
        const tipos = {
            INTERESSE: 'Interesse',
            PROPOSTA: 'Proposta',
            DUVIDA: 'Dúvida',
        };

        return (
            tipos[tipo] ||
            tipo ||
            'Interação'
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

        return (
            interacoes[
                interacoes.length - 1
            ]
        );
    }


    function obterTipoUltimaInteracao() {
        const ultima =
            obterUltimaInteracao();

        return (
            ultima
                ?.interacao
                ?.tipo
                ?.tipo ||
            null
        );
    }


    /*
     * ============================================================
     * REGRAS DO INTERESSADO
     * ============================================================
     *
     * O interessado somente pode agir quando:
     *
     * AGUARDANDO_INTERESSADO
     *
     * Quando recebe uma PROPOSTA:
     *
     * - aceitar
     * - recusar
     * - nova proposta
     * - dúvida
     *
     * Quando recebe uma DÚVIDA:
     *
     * - responder dúvida
     *
     * Quando a última interação for INTERESSE:
     *
     * - não há nova ação
     *
     * ============================================================
     */

    function podeResponder() {
        if (!negociacaoSelecionada) {
            return false;
        }

        return (
            obterCodigoStatus(
                negociacaoSelecionada
            ) ===
            'AGUARDANDO_INTERESSADO'
        );
    }


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
         * O contratante enviou uma proposta.
         */
        if (tipo === 'PROPOSTA') {
            return {
                aceitar: true,
                recusar: true,
                responder: true,
            };
        }

        /*
         * O contratante enviou uma dúvida.
         */
        if (tipo === 'DUVIDA') {
            return {
                aceitar: false,
                recusar: false,
                responder: true,
            };
        }

        /*
         * Interesse não gera nova ação
         * para o próprio interessado.
         */
        if (tipo === 'INTERESSE') {
            return {
                aceitar: false,
                recusar: false,
                responder: false,
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
     * ATUALIZAR NEGOCIAÇÃO
     * ============================================================
     */

    async function atualizarNegociacao() {
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
     * ACEITAR
     * ============================================================
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

            await atualizarNegociacao();

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
     * RECUSAR
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

            await atualizarNegociacao();

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
     * RESPONDER
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

            await atualizarNegociacao();

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
     * AÇÕES DISPONÍVEIS
     * ============================================================
     */

    const acoes =
        obterAcoesDisponiveis();

    const tipoUltimaInteracao =
        obterTipoUltimaInteracao();


    /*
     * ============================================================
     * MODAL
     * ============================================================
     */

    return (
        <div
            className="negociacoes-modal-overlay"
            onMouseDown={onClose}
        >
            <div
                className="negociacoes-modal trabalhos-negociacao-modal"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                <header className="negociacoes-modal-header">

                    <div>

                        <h2>
                            Negociação
                        </h2>

                        <p>
                            {
                                negociacaoSelecionada
                                    ?.publicacao
                                    ?.titulo ||
                                negociacao
                                    ?.publicacao
                                    ?.titulo ||
                                'Negociação'
                            }
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


                {carregando && (

                    <div className="negociacoes-detalhes-loading">
                        Carregando negociação...
                    </div>

                )}


                {!carregando &&
                    erro &&
                    !negociacaoSelecionada && (

                        <div className="negociacoes-error">
                            {erro}
                        </div>

                    )}


                {!carregando &&
                    negociacaoSelecionada && (

                        <section className="negociacao-detalhes">

                            {/* ==================================================
                                RESUMO DA NEGOCIAÇÃO
                            ================================================== */}

                            <div className="negociacao-resumo">

                                <div>

                                    <span>
                                        Contratante
                                    </span>

                                    <strong>
                                        {
                                            negociacaoSelecionada
                                                .contratante
                                                ?.name ||
                                            negociacaoSelecionada
                                                .contratante
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


                            {/* ==================================================
                                INFORMAÇÕES DA PUBLICAÇÃO
                            ================================================== */}

                            {negociacaoSelecionada
                                .publicacao && (

                                    <div className="negociacao-historico">

                                        <h3>
                                            Publicação
                                        </h3>

                                        <article className="negociacao-interacao">

                                            <div className="negociacao-interacao-header">

                                                <strong>
                                                    {
                                                        negociacaoSelecionada
                                                            .publicacao
                                                            .titulo
                                                    }
                                                </strong>

                                            </div>


                                            {negociacaoSelecionada
                                                .publicacao
                                                .categoria && (

                                                <div className="negociacao-interacao-tipo">

                                                    {
                                                        negociacaoSelecionada
                                                            .publicacao
                                                            .categoria
                                                            .nome
                                                    }

                                                </div>

                                            )}


                                            <p>
                                                {
                                                    negociacaoSelecionada
                                                        .publicacao
                                                        .descricao ||
                                                    'Nenhuma descrição informada.'
                                                }
                                            </p>

                                        </article>

                                    </div>

                                )}


                            {/* ==================================================
                                BOTÃO VER INTERAÇÕES
                            ================================================== */}

                            <button
                                type="button"
                                className="btn-ver-interacoes"
                                onClick={() =>
                                    setExibindoInteracoes(
                                        !exibindoInteracoes
                                    )
                                }
                            >
                                {exibindoInteracoes
                                    ? 'Ocultar interações'
                                    : 'Ver interações'}
                            </button>


                            {/* ==================================================
                                HISTÓRICO
                            ================================================== */}

                            {exibindoInteracoes && (

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
                                            (item) => {

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
                                                                {
                                                                    interacao
                                                                        ?.remetente
                                                                        ?.name ||
                                                                    interacao
                                                                        ?.remetente
                                                                        ?.nome ||
                                                                    'Usuário'
                                                                }
                                                            </strong>

                                                            <span>
                                                                {formatarData(
                                                                    interacao
                                                                        ?.created_at
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
                                                                    interacao
                                                                        .mensagem
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
                                                                    interacao
                                                                        .valor_proposto
                                                                )}

                                                            </strong>

                                                        )}

                                                    </article>

                                                );
                                            }
                                        )

                                    )}

                                </div>

                            )}


                            {/* ==================================================
                                AÇÕES DO INTERESSADO
                            ================================================== */}

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
                                            {
                                                formatarTipo(
                                                    tipoUltimaInteracao
                                                )
                                            }
                                        </span>

                                    </div>


                                    {/* ==================================================
                                        BOTÕES PRINCIPAIS
                                    ================================================== */}

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


                                    {/* ==================================================
                                        RESPOSTA
                                    ================================================== */}

                                    {acoes.responder && (

                                        <div className="negociacao-resposta">

                                            {tipoUltimaInteracao ===
                                                'PROPOSTA' && (

                                                <div className="negociacao-resposta-aviso">

                                                    O contratante enviou uma proposta.
                                                    Você pode aceitar, recusar,
                                                    enviar uma nova proposta
                                                    ou tirar uma dúvida.

                                                </div>

                                            )}


                                            {tipoUltimaInteracao ===
                                                'DUVIDA' && (

                                                <div className="negociacao-resposta-aviso">

                                                    O contratante enviou uma dúvida.
                                                    Envie uma resposta para continuar
                                                    a negociação.

                                                </div>

                                            )}


                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="tipo-resposta-interessado">

                                                    Tipo da resposta

                                                </label>


                                                <select
                                                    id="tipo-resposta-interessado"
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
                                                            event.target.value !==
                                                            'PROPOSTA'
                                                        ) {
                                                            setValorProposto('');
                                                        }

                                                        setErro('');

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

                                                    <label htmlFor="valor-proposto-interessado">

                                                        Novo valor

                                                    </label>


                                                    <input
                                                        id="valor-proposto-interessado"
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={
                                                            valorProposto
                                                        }
                                                        onChange={(
                                                            event
                                                        ) => {

                                                            setValorProposto(
                                                                event.target.value
                                                            );

                                                            setErro('');

                                                        }}
                                                        placeholder="R$ 0,00"
                                                        disabled={
                                                            processando
                                                        }
                                                    />

                                                </div>

                                            )}


                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="mensagem-resposta-interessado">

                                                    Mensagem

                                                </label>


                                                <textarea
                                                    id="mensagem-resposta-interessado"
                                                    value={
                                                        mensagem
                                                    }
                                                    onChange={(
                                                        event
                                                    ) => {

                                                        setMensagem(
                                                            event.target.value
                                                        );

                                                        setErro('');

                                                    }}
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


                            {/* ==================================================
                                SEM AÇÕES
                            ================================================== */}

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
                                            A negociação pode ser visualizada,
                                            mas não há ações disponíveis
                                            para você neste momento.
                                        </span>

                                    </div>

                                )}


                            {erro && (

                                <div className="negociacao-erro-acao">
                                    {erro}
                                </div>

                            )}

                        </section>

                    )}

            </div>
        </div>
    );
}