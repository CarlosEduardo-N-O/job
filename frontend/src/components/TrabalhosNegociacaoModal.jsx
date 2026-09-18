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
    ] = useState('');

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

            limparFormulario(dados);

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
     * CONTEXTO DA NEGOCIAÇÃO
     * ============================================================
     *
     * O backend é responsável por informar:
     *
     * - papel_usuario
     * - vez
     * - pode_agir
     * - ultima_interacao
     *
     * Não fazemos mais a regra manualmente pelo status.
     */

    function obterContexto(
        negociacaoAtual = negociacaoSelecionada
    ) {
        return (
            negociacaoAtual?.contexto || {
                papel_usuario: null,
                vez: null,
                pode_agir: false,
                ultima_interacao: null,
            }
        );
    }


    /*
     * ============================================================
     * AÇÕES
     * ============================================================
     *
     * O backend define quais ações o usuário pode executar.
     *
     * Aceita tanto:
     *
     * negociacao.acoes
     *
     * quanto:
     *
     * negociacao.contexto.acoes
     */

    function obterAcoes(
        negociacaoAtual = negociacaoSelecionada
    ) {
        const contexto =
            obterContexto(negociacaoAtual);

        const acoes = {
            ...(contexto?.acoes || {}),
            ...(negociacaoAtual?.acoes || {}),
        };

        return {
            interagir:
                acoes.interagir === true,

            aceitar:
                acoes.aceitar === true,

            recusar:
                acoes.recusar === true,

            pagamento:
                acoes.pagamento === true ||
                acoes.pagar === true,
        };
    }


    /*
     * ============================================================
     * INTERAÇÕES PERMITIDAS
     * ============================================================
     *
     * O backend informa quais tipos podem ser enviados.
     *
     * Exemplo:
     *
     * [
     *     {
     *         tipo: "INTERESSE",
     *         mensagem_obrigatoria: false
     *     },
     *     {
     *         tipo: "PROPOSTA",
     *         valor_obrigatorio: true
     *     },
     *     {
     *         tipo: "DUVIDA",
     *         mensagem_obrigatoria: true
     *     }
     * ]
     */

    function obterInteracoesPermitidas(
        negociacaoAtual = negociacaoSelecionada
    ) {
        if (!negociacaoAtual) {
            return [];
        }

        const opcoes =
            negociacaoAtual?.opcoes_interacao ??
            negociacaoAtual?.contexto?.opcoes_interacao ??
            negociacaoAtual?.acoes?.opcoes_interacao ??
            negociacaoAtual?.contexto?.acoes?.opcoes_interacao ??
            negociacaoAtual?.interacoes_permitidas ??
            [];

        if (!Array.isArray(opcoes)) {
            return [];
        }

        return opcoes.map((item) => ({
            ...item,

            tipo:
                String(
                    item?.tipo ?? ''
                )
                    .trim()
                    .toUpperCase(),

            mensagem_obrigatoria:
                item?.mensagem_obrigatoria === true ||
                item?.campos?.mensagem?.obrigatorio === true,

            valor_obrigatorio:
                item?.valor_obrigatorio === true ||
                item?.campos?.valor_proposto?.obrigatorio === true,
        }));
    }


    /*
     * ============================================================
     * CONFIGURAÇÃO DO TIPO DE INTERAÇÃO
     * ============================================================
     */

    function obterConfiguracaoTipo(
        tipo,
        negociacaoAtual = negociacaoSelecionada
    ) {
        const tipos =
            obterInteracoesPermitidas(
                negociacaoAtual
            );

        const tipoNormalizado =
            String(tipo || '')
                .trim()
                .toUpperCase();

        return (
            tipos.find(
                (item) =>
                    item.tipo ===
                    tipoNormalizado
            ) || null
        );
    }


    /*
     * ============================================================
     * FORMULÁRIO
     * ============================================================
     */

    function limparFormulario(
        negociacaoAtual = negociacaoSelecionada
    ) {
        setMensagem('');
        setValorProposto('');

        const tipos =
            obterInteracoesPermitidas(
                negociacaoAtual
            );

        if (
            tipos.length > 0 &&
            tipos[0]?.tipo
        ) {
            setTipoResposta(
                String(
                    tipos[0].tipo
                ).toUpperCase()
            );
        } else {
            setTipoResposta('');
        }
    }


    /*
     * ============================================================
     * STATUS
     * ============================================================
     */

    function obterCodigoStatus(
        negociacaoAtual
    ) {
        if (!negociacaoAtual) {
            return null;
        }

        if (
            typeof negociacaoAtual.status ===
            'string'
        ) {
            return negociacaoAtual.status
                .trim()
                .toUpperCase();
        }

        return (
            negociacaoAtual.status?.codigo
                ?.trim()
                ?.toUpperCase() ||
            null
        );
    }


    function obterNomeStatus(
        negociacaoAtual
    ) {
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

        const codigo =
            typeof status === 'string'
                ? status.trim().toUpperCase()
                : status;

        return (
            statusMap[codigo] ||
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
            INTERESSE:
                'Interesse',

            PROPOSTA:
                'Proposta',

            DUVIDA:
                'Dúvida',

            RESPOSTA:
                'Resposta',

            ACEITE:
                'Aceite',
        };

        const tipoNormalizado =
            typeof tipo === 'string'
                ? tipo.trim().toUpperCase()
                : tipo;

        return (
            tipos[tipoNormalizado] ||
            tipo ||
            'Interação'
        );
    }


    /*
     * ============================================================
     * INTERAÇÕES
     * ============================================================
     */

    function obterInteracoes(
        negociacaoAtual = negociacaoSelecionada
    ) {
        const interacoes =
            negociacaoAtual?.interacoes;

        if (Array.isArray(interacoes)) {
            return interacoes;
        }

        if (
            Array.isArray(
                interacoes?.data
            )
        ) {
            return interacoes.data;
        }

        return [];
    }


    function obterUltimaInteracao(
        negociacaoAtual = negociacaoSelecionada
    ) {
        const interacoes =
            obterInteracoes(
                negociacaoAtual
            );

        if (interacoes.length === 0) {
            return null;
        }

        /*
         * Ordena por created_at para não depender
         * da ordem enviada pelo backend.
         */
        const ordenadas = [
            ...interacoes,
        ].sort(
            (a, b) => {
                const dataA =
                    new Date(
                        a?.interacao?.created_at ||
                        a?.created_at ||
                        0
                    ).getTime();

                const dataB =
                    new Date(
                        b?.interacao?.created_at ||
                        b?.created_at ||
                        0
                    ).getTime();

                return dataA - dataB;
            }
        );

        return (
            ordenadas[
                ordenadas.length - 1
            ] || null
        );
    }


    function obterTipoUltimaInteracao(
        negociacaoAtual = negociacaoSelecionada
    ) {
        /*
         * Primeiro confia no contexto enviado pelo backend.
         */
        const ultimaInformada =
            negociacaoAtual
                ?.contexto
                ?.ultima_interacao;

        if (
            typeof ultimaInformada ===
            'string'
        ) {
            return ultimaInformada
                .trim()
                .toUpperCase();
        }

        if (
            ultimaInformada &&
            typeof ultimaInformada ===
            'object' &&
            ultimaInformada.tipo
        ) {
            return String(
                ultimaInformada.tipo
            )
                .trim()
                .toUpperCase();
        }

        /*
         * Fallback para o histórico.
         */
        const ultima =
            obterUltimaInteracao(
                negociacaoAtual
            );

        const tipo =
            ultima?.interacao?.tipo?.tipo ||
            ultima?.tipo?.tipo ||
            ultima?.interacao?.tipo ||
            ultima?.tipo ||
            null;

        if (!tipo) {
            return null;
        }

        return String(tipo)
            .trim()
            .toUpperCase();
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

        limparFormulario(dados);
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

        const acoes =
            obterAcoes(
                negociacaoSelecionada
            );

        if (!acoes.aceitar) {
            setErro(
                'Você não pode aceitar esta negociação neste momento.'
            );

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

        const acoes =
            obterAcoes(
                negociacaoSelecionada
            );

        if (!acoes.recusar) {
            setErro(
                'Você não pode recusar esta negociação neste momento.'
            );

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
     * RESPONDER / INTERAGIR
     * ============================================================
     */

    async function handleResponder() {
        if (
            !negociacaoSelecionada ||
            processando
        ) {
            return;
        }

        setErro('');

        const acoes =
            obterAcoes(
                negociacaoSelecionada
            );

        if (!acoes.interagir) {
            setErro(
                'Você não pode interagir com esta negociação neste momento.'
            );

            return;
        }

        const tipo =
            String(
                tipoResposta || ''
            )
                .trim()
                .toUpperCase();

        if (!tipo) {
            setErro(
                'Selecione o tipo de interação.'
            );

            return;
        }

        /*
         * Confirma que o tipo escolhido está entre
         * as opções realmente liberadas pelo backend.
         */
        const configuracao =
            obterConfiguracaoTipo(
                tipo,
                negociacaoSelecionada
            );

        if (!configuracao) {
            setErro(
                'Este tipo de interação não está disponível para esta negociação.'
            );

            return;
        }

        const mensagemObrigatoria =
            configuracao.mensagem_obrigatoria === true;

        const valorObrigatorio =
            configuracao.valor_obrigatorio === true;

        if (
            mensagemObrigatoria &&
            !mensagem.trim()
        ) {
            setErro(
                'Digite uma mensagem para continuar.'
            );

            return;
        }

        if (
            valorObrigatorio &&
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

            const dados = {
                tipo,
                mensagem:
                    mensagem.trim() || null,
            };

            /*
             * Envia valor somente quando a configuração
             * do backend indicar que ele é necessário.
             */
            if (
                valorObrigatorio ||
                tipo === 'PROPOSTA'
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
                'Não foi possível enviar a interação.'
            );
        } finally {
            setProcessando(false);
        }
    }


    /*
     * ============================================================
     * DADOS PARA RENDERIZAÇÃO
     * ============================================================
     */

    const contexto =
        obterContexto(
            negociacaoSelecionada
        );

    const acoes =
        obterAcoes(
            negociacaoSelecionada
        );

    const tiposPermitidos =
        obterInteracoesPermitidas(
            negociacaoSelecionada
        );

    const tipoUltimaInteracao =
        obterTipoUltimaInteracao(
            negociacaoSelecionada
        );


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


                                    {obterInteracoes(
                                        negociacaoSelecionada
                                    ).length === 0 ? (

                                        <p className="negociacao-sem-interacoes">
                                            Nenhuma interação encontrada.
                                        </p>

                                    ) : (

                                        obterInteracoes(
                                            negociacaoSelecionada
                                        ).map(
                                            (item) => {

                                                const interacao =
                                                    item?.interacao ||
                                                    item;

                                                return (

                                                    <article
                                                        key={
                                                            item?.id_negociacao_interacao ||
                                                            interacao?.id_interacao ||
                                                            Math.random()
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
                                                                    ?.tipo ||
                                                                interacao
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
                                acoes.interagir) && (

                                <div className="negociacao-acoes">

                                    <div className="negociacao-acoes-titulo">

                                        <h3>
                                            {contexto?.pode_agir
                                                ? 'Sua vez'
                                                : 'Ações disponíveis'}
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
                                        INTERAÇÃO
                                    ================================================== */}

                                    {acoes.interagir &&
                                        tiposPermitidos.length > 0 && (

                                        <div className="negociacao-resposta">

                                            {tipoUltimaInteracao ===
                                                'PROPOSTA' && (

                                                <div className="negociacao-resposta-aviso">

                                                    O contratante enviou uma proposta.
                                                    As opções disponíveis foram definidas
                                                    pela negociação.

                                                </div>

                                            )}


                                            {tipoUltimaInteracao ===
                                                'DUVIDA' && (

                                                <div className="negociacao-resposta-aviso">

                                                    O contratante enviou uma dúvida.
                                                    Escolha uma das opções disponíveis
                                                    para continuar a negociação.

                                                </div>

                                            )}


                                            {tipoUltimaInteracao ===
                                                'RESPOSTA' && (

                                                <div className="negociacao-resposta-aviso">

                                                    O contratante respondeu à sua
                                                    interação. Você pode continuar
                                                    a negociação usando as opções
                                                    disponíveis abaixo.

                                                </div>

                                            )}


                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="tipo-resposta-interessado">

                                                    Tipo da interação

                                                </label>


                                                <select
                                                    id="tipo-resposta-interessado"
                                                    value={
                                                        tipoResposta
                                                    }
                                                    onChange={(
                                                        event
                                                    ) => {

                                                        const novoTipo =
                                                            event.target.value;

                                                        setTipoResposta(
                                                            novoTipo
                                                        );

                                                        const configuracao =
                                                            obterConfiguracaoTipo(
                                                                novoTipo,
                                                                negociacaoSelecionada
                                                            );

                                                        /*
                                                         * Se o novo tipo não usa
                                                         * valor, limpamos o valor anterior.
                                                         */
                                                        if (
                                                            !configuracao?.valor_obrigatorio &&
                                                            novoTipo !== 'PROPOSTA'
                                                        ) {
                                                            setValorProposto('');
                                                        }

                                                        setErro('');

                                                    }}
                                                    disabled={
                                                        processando
                                                    }
                                                >

                                                    {tiposPermitidos.map(
                                                        (item) => (

                                                            <option
                                                                key={
                                                                    item.tipo
                                                                }
                                                                value={
                                                                    item.tipo
                                                                }
                                                            >
                                                                {item.tipo ===
                                                                    'INTERESSE'
                                                                    ? 'Demonstrar interesse'
                                                                    : item.tipo ===
                                                                        'PROPOSTA'
                                                                        ? 'Enviar proposta'
                                                                        : item.tipo ===
                                                                            'DUVIDA'
                                                                            ? 'Nova dúvida'
                                                                            : item.tipo ===
                                                                                'RESPOSTA'
                                                                                ? 'Responder dúvida'
                                                                                : formatarTipo(
                                                                                    item.tipo
                                                                                )}
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            </div>


                                            {(() => {
                                                const configuracao =
                                                    obterConfiguracaoTipo(
                                                        tipoResposta,
                                                        negociacaoSelecionada
                                                    );

                                                const mostrarValor =
                                                    tipoResposta ===
                                                        'PROPOSTA' ||
                                                    configuracao
                                                        ?.campos
                                                        ?.valor_proposto
                                                        ?.visivel === true ||
                                                    configuracao
                                                        ?.valor_obrigatorio === true;

                                                if (!mostrarValor) {
                                                    return null;
                                                }

                                                return (

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

                                                );
                                            })()}


                                            {(() => {
                                                const configuracao =
                                                    obterConfiguracaoTipo(
                                                        tipoResposta,
                                                        negociacaoSelecionada
                                                    );

                                                const mostrarMensagem =
                                                    configuracao
                                                        ?.campos
                                                        ?.mensagem
                                                        ?.visivel !== false;

                                                if (!mostrarMensagem) {
                                                    return null;
                                                }

                                                return (

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

                                                );
                                            })()}


                                            <button
                                                type="button"
                                                className="btn-negociacao-responder"
                                                onClick={
                                                    handleResponder
                                                }
                                                disabled={
                                                    processando ||
                                                    !tipoResposta
                                                }
                                            >
                                                {processando
                                                    ? 'Enviando...'
                                                    : 'Enviar interação'}
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
                                !acoes.interagir && (

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


                            {acoes.interagir &&
                                tiposPermitidos.length === 0 && (

                                    <div className="negociacao-sem-acoes">

                                        <strong>
                                            {obterNomeStatus(
                                                negociacaoSelecionada
                                            )}
                                        </strong>

                                        <span>
                                            A negociação permite interação,
                                            mas nenhuma opção de interação
                                            foi informada pelo servidor.
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