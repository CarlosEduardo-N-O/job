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

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        carregandoDetalhes,
        setCarregandoDetalhes,
    ] = useState(false);

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
        exibindoPagamento,
        setExibindoPagamento,
    ] = useState(false);


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

            let lista = [];

            if (Array.isArray(dados)) {
                lista = dados;
            } else if (
                Array.isArray(dados?.data)
            ) {
                lista = dados.data;
            }

            const relacionadas =
                lista.filter(
                    (negociacao) =>
                        Number(
                            negociacao?.id_publicacao
                        ) === Number(
                            publicacao?.id
                        )
                );

            setNegociacoes(
                relacionadas
            );

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
     * NORMALIZAR NEGOCIAÇÃO
     * ============================================================
     *
     * Compatibilidade com respostas como:
     *
     * {
     *     data: {...}
     * }
     *
     * ou:
     *
     * {
     *     ...dados
     * }
     */

    function normalizarNegociacao(
        response
    ) {
        const dados =
            response?.data ?? response;

        if (
            dados?.data &&
            !Array.isArray(
                dados.data
            ) &&
            typeof dados.data === 'object'
        ) {
            return dados.data;
        }

        return dados;
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

            const negociacaoDetalhes =
                normalizarNegociacao(
                    response
                );

            setNegociacaoSelecionada(
                negociacaoDetalhes
            );

            limparFormulario(
                negociacaoDetalhes
            );

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

        limparFormulario(null);

        setErro('');

        carregarNegociacoes();
    }


    async function voltarParaNegociacao() {
        setExibindoPagamento(false);
        setErro('');

        await atualizarDetalhes();
    }


    /*
     * ============================================================
     * CONTEXTO DA API
     * ============================================================
     */

    function obterContexto(
        negociacao = negociacaoSelecionada
    ) {
        return (
            negociacao?.contexto || {
                papel_usuario: null,
                vez: null,
                pode_agir: false,
                ultima_interacao: null,
            }
        );
    }


    /*
     * ============================================================
     * AÇÕES DA API
     * ============================================================
     *
     * O backend é a fonte das regras.
     *
     * Aceita:
     *
     * negociacao.acoes
     *
     * ou:
     *
     * negociacao.contexto.acoes
     *
     * ============================================================
     */

    function obterAcoes(
        negociacao = negociacaoSelecionada
    ) {
        const contexto =
            obterContexto(
                negociacao
            );

        const acoes = {
            ...(contexto?.acoes || {}),
            ...(negociacao?.acoes || {}),
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
     * OPÇÕES DE INTERAÇÃO
     * ============================================================
     *
     * O backend determina quais tipos podem ser enviados.
     * ============================================================
     */

    function obterInteracoesPermitidas(
        negociacao = negociacaoSelecionada
    ) {
        if (!negociacao) {
            return [];
        }

        const opcoes =
            negociacao?.opcoes_interacao ??
            negociacao?.contexto?.opcoes_interacao ??
            negociacao?.acoes?.opcoes_interacao ??
            negociacao?.contexto?.acoes?.opcoes_interacao ??
            negociacao?.interacoes_permitidas ??
            [];

        if (!Array.isArray(opcoes)) {
            return [];
        }

        return opcoes
            .map((item) => ({
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
            }))
            .filter(
                (item) =>
                    Boolean(item.tipo)
            );
    }


    /*
     * ============================================================
     * CONFIGURAÇÃO DO TIPO
     * ============================================================
     */

    function obterConfiguracaoTipo(
        tipo,
        negociacao = negociacaoSelecionada
    ) {
        if (!tipo) {
            return null;
        }

        const tipos =
            obterInteracoesPermitidas(
                negociacao
            );

        const tipoNormalizado =
            String(tipo)
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
        negociacao = negociacaoSelecionada
    ) {
        setMensagem('');
        setValorProposto('');

        const tipos =
            obterInteracoesPermitidas(
                negociacao
            );

        if (
            tipos.length > 0 &&
            tipos[0]?.tipo
        ) {
            setTipoResposta(
                tipos[0].tipo
            );
        } else {
            setTipoResposta('');
        }
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

        const numero =
            Number(valor);

        if (
            Number.isNaN(numero)
        ) {
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
        if (!tipo) {
            return 'Não informado';
        }

        const tipoNormalizado =
            String(tipo)
                .trim()
                .toUpperCase();

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

        return (
            tipos[tipoNormalizado] ||
            tipo
        );
    }


    /*
     * ============================================================
     * STATUS
     * ============================================================
     */

    function obterCodigoStatus(
        negociacao
    ) {
        if (!negociacao) {
            return null;
        }

        let status = null;

        if (
            typeof negociacao.status ===
            'string'
        ) {
            status =
                negociacao.status;

        } else if (
            negociacao.status &&
            typeof negociacao.status ===
            'object'
        ) {
            status =
                negociacao.status.codigo ||
                negociacao.status.status ||
                null;
        }

        status =
            status ||
            negociacao.status_codigo ||
            negociacao.codigo_status ||
            negociacao.status_negociacao ||
            null;

        if (!status) {
            return null;
        }

        return String(status)
            .trim()
            .toUpperCase();
    }


    function obterNomeStatus(
        negociacao
    ) {
        if (
            negociacao?.status &&
            typeof negociacao.status ===
            'object' &&
            negociacao.status.nome
        ) {
            return negociacao.status.nome;
        }

        const codigo =
            obterCodigoStatus(
                negociacao
            );

        if (!codigo) {
            return 'Não informado';
        }

        return formatarStatus(codigo);
    }


    function formatarStatus(status) {
        const statusNormalizado =
            status
                ? String(status)
                    .trim()
                    .toUpperCase()
                : null;

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
            statusMap[
                statusNormalizado
            ] ||
            status ||
            'Não informado'
        );
    }


    /*
     * ============================================================
     * INTERAÇÕES
     * ============================================================
     */

    function obterInteracoes(
        negociacao = negociacaoSelecionada
    ) {
        if (!negociacao) {
            return [];
        }

        if (
            Array.isArray(
                negociacao.interacoes
            )
        ) {
            return negociacao.interacoes;
        }

        if (
            Array.isArray(
                negociacao.interacoes?.data
            )
        ) {
            return negociacao
                .interacoes
                .data;
        }

        return [];
    }


    function obterUltimaInteracao(
        negociacao = negociacaoSelecionada
    ) {
        const interacoes =
            obterInteracoes(
                negociacao
            );

        if (
            interacoes.length === 0
        ) {
            return null;
        }

        const ordenadas =
            [...interacoes].sort(
                (a, b) => {
                    const dataA =
                        new Date(
                            a?.interacao
                                ?.created_at ||
                            a?.created_at ||
                            0
                        ).getTime();

                    const dataB =
                        new Date(
                            b?.interacao
                                ?.created_at ||
                            b?.created_at ||
                            0
                        ).getTime();

                    return (
                        dataA - dataB
                    );
                }
            );

        return (
            ordenadas[
                ordenadas.length - 1
            ] || null
        );
    }


    function obterTipoUltimaInteracao(
        negociacao = negociacaoSelecionada
    ) {
        /*
         * Primeiro utiliza o contexto enviado pelo backend.
         */
        const ultimaInformada =
            negociacao
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
         * Fallback pelo histórico.
         */
        const ultima =
            obterUltimaInteracao(
                negociacao
            );

        if (!ultima) {
            return null;
        }

        const tipo =
            ultima?.interacao
                ?.tipo
                ?.tipo ||
            ultima?.tipo
                ?.tipo ||
            ultima?.interacao
                ?.tipo ||
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
     * ATUALIZAR DETALHES
     * ============================================================
     */

    async function atualizarDetalhes() {
        if (!negociacaoSelecionada) {
            return null;
        }

        try {
            const response =
                await getNegociacao(
                    negociacaoSelecionada
                        .id_negociacao
                );

            const negociacaoAtualizada =
                normalizarNegociacao(
                    response
                );

            setNegociacaoSelecionada(
                negociacaoAtualizada
            );

            limparFormulario(
                negociacaoAtualizada
            );

            return negociacaoAtualizada;

        } catch (error) {
            console.error(
                'Erro ao atualizar negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                'Não foi possível atualizar a negociação.'
            );

            return null;
        }
    }


    /*
     * ============================================================
     * ACEITAR NEGOCIAÇÃO
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
                'Esta negociação não pode ser aceita neste momento.'
            );

            return;
        }

        try {
            setProcessando(true);
            setErro('');

            await aceitarNegociacao(
                negociacaoSelecionada
                    .id_negociacao
            );

            const negociacaoAtualizada =
                await atualizarDetalhes();

            if (
                negociacaoAtualizada
            ) {
                const acoesAtualizadas =
                    obterAcoes(
                        negociacaoAtualizada
                    );

                if (
                    acoesAtualizadas.pagamento
                ) {
                    setExibindoPagamento(
                        true
                    );
                }
            }

            await carregarNegociacoes();

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

        const acoes =
            obterAcoes(
                negociacaoSelecionada
            );

        if (!acoes.recusar) {
            setErro(
                'Esta negociação não pode ser recusada neste momento.'
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
                negociacaoSelecionada
                    .id_negociacao
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
                'Não é possível enviar uma interação neste momento.'
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

        const configuracao =
            obterConfiguracaoTipo(
                tipo,
                negociacaoSelecionada
            );

        if (!configuracao) {
            setErro(
                'Este tipo de interação não está disponível neste momento.'
            );

            return;
        }

        const campos =
            configuracao.campos || {};

        const mensagemObrigatoria =
            campos?.mensagem?.obrigatorio === true ||
            configuracao.mensagem_obrigatoria === true;

        const valorObrigatorio =
            campos?.valor_proposto?.obrigatorio === true ||
            configuracao.valor_obrigatorio === true;

        if (
            mensagemObrigatoria &&
            !mensagem.trim()
        ) {
            setErro(
                'Digite uma mensagem.'
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
                    mensagem.trim() ||
                    null,
            };

            /*
             * O valor somente é enviado quando
             * realmente fizer sentido para a interação.
             */
            if (
                valorObrigatorio ||
                tipo === 'PROPOSTA'
            ) {
                dados.valor_proposto =
                    Number(
                        valorProposto
                    );
            }

            await interagirNegociacao(
                negociacaoSelecionada
                    .id_negociacao,
                dados
            );

            /*
             * O backend recalcula:
             *
             * - vez
             * - pode_agir
             * - acoes
             * - opcoes_interacao
             * - status
             * - ultima_interacao
             */
            await atualizarDetalhes();

            await carregarNegociacoes();

        } catch (error) {
            console.error(
                'Erro ao enviar interação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                error?.response?.data?.errors?.tipo?.[0] ||
                error?.response?.data?.errors?.mensagem?.[0] ||
                error?.response?.data?.errors?.valor_proposto?.[0] ||
                'Não foi possível enviar a interação.'
            );

        } finally {
            setProcessando(false);
        }
    }


    /*
     * ============================================================
     * PAGAMENTO REALIZADO
     * ============================================================
     */

    async function handlePagamentoRealizado() {
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

        if (!acoes.pagamento) {
            setErro(
                'O pagamento não está disponível para este usuário.'
            );

            return;
        }

        try {
            setProcessando(true);
            setErro('');

            await informarPagamento(
                negociacaoSelecionada
                    .id_negociacao
            );

            await atualizarDetalhes();

            setExibindoPagamento(
                false
            );

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


    /*
     * ============================================================
     * DADOS CALCULADOS
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

    const configuracaoTipoAtual =
        obterConfiguracaoTipo(
            tipoResposta,
            negociacaoSelecionada
        );

    const camposTipoAtual =
        configuracaoTipoAtual?.campos ||
        {};

    const mensagemObrigatoria =
        camposTipoAtual
            ?.mensagem
            ?.obrigatorio === true ||
        configuracaoTipoAtual
            ?.mensagem_obrigatoria === true;

    const valorObrigatorio =
        camposTipoAtual
            ?.valor_proposto
            ?.obrigatorio === true ||
        configuracaoTipoAtual
            ?.valor_obrigatorio === true;

    const mostrarMensagem =
        camposTipoAtual
            ?.mensagem
            ?.visivel !== false;

    const mostrarValor =
        tipoResposta === 'PROPOSTA' &&
        camposTipoAtual
            ?.valor_proposto
            ?.visivel !== false;


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
                            disabled={
                                processando
                            }
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
                                    {publicacao.titulo}
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
                                        publicacao
                                            .valor_estimado
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
                                            {
                                                length: 49,
                                            },
                                            (_, index) => (
                                                <span
                                                    key={
                                                        index
                                                    }
                                                    className={
                                                        (
                                                            index *
                                                            7 +
                                                            3
                                                        ) %
                                                            5 !==
                                                            0
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
                                disabled={
                                    processando ||
                                    !acoes.pagamento
                                }
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
                            disabled={
                                processando
                            }
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
                            disabled={
                                processando
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
                                    Seu papel
                                </span>

                                <strong>
                                    {contexto.papel_usuario ===
                                        'INTERESSADO'
                                        ? 'Interessado'
                                        : contexto.papel_usuario ===
                                            'CONTRATANTE'
                                            ? 'Contratante'
                                            : 'Não informado'}
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


                        {/* =================================================
                            HISTÓRICO
                           ================================================= */}

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
                                    (item, index) => {

                                        const interacao =
                                            item?.interacao ||
                                            item;

                                        const tipo =
                                            interacao
                                                ?.tipo
                                                ?.tipo ||
                                            interacao
                                                ?.tipo ||
                                            null;

                                        return (

                                            <article
                                                key={
                                                    item?.id_negociacao_interacao ||
                                                    interacao?.id_interacao ||
                                                    index
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
                                                                ?.created_at ||
                                                            item
                                                                ?.created_at
                                                        )}
                                                    </span>

                                                </div>


                                                <div className="negociacao-interacao-tipo">

                                                    {formatarTipo(
                                                        tipo
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


                        {/* =================================================
                            AÇÕES
                           ================================================= */}

                        {(
                            acoes.aceitar ||
                            acoes.recusar ||
                            acoes.interagir ||
                            acoes.pagamento
                        ) && (

                            <div className="negociacao-acoes">

                                <div className="negociacao-acoes-titulo">

                                    <h3>
                                        {contexto.pode_agir
                                            ? 'Sua vez'
                                            : 'Aguardando'}
                                    </h3>


                                    <span>

                                        {contexto.pode_agir
                                            ? 'Você pode realizar a próxima ação.'

                                            : contexto.vez ===
                                                'INTERESSADO'
                                                ? 'Aguardando o interessado.'

                                                : contexto.vez ===
                                                    'CONTRATANTE'
                                                    ? 'Aguardando o contratante.'

                                                    : obterCodigoStatus(
                                                        negociacaoSelecionada
                                                    ) ===
                                                        'AGUARDANDO_PAGAMENTO'
                                                        ? 'Aguardando pagamento.'

                                                        : 'Nenhuma ação pendente.'}

                                    </span>


                                    {tipoUltimaInteracao && (

                                        <span>
                                            Última interação:{' '}

                                            {formatarTipo(
                                                tipoUltimaInteracao
                                            )}
                                        </span>

                                    )}

                                </div>


                                {/* =================================================
                                    ACEITAR / RECUSAR
                                   ================================================= */}

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


                                {/* =================================================
                                    FORMULÁRIO DE INTERAÇÃO
                                   ================================================= */}

                                {acoes.interagir &&
                                    tiposPermitidos.length > 0 && (

                                    <div className="negociacao-resposta">

                                        <div className="negociacao-form-grupo">

                                            <label htmlFor="tipo-resposta">

                                                Tipo da interação

                                            </label>


                                            <select
                                                id="tipo-resposta"
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

                                                    setErro('');

                                                    const novaConfiguracao =
                                                        obterConfiguracaoTipo(
                                                            novoTipo,
                                                            negociacaoSelecionada
                                                        );

                                                    const novoValorObrigatorio =
                                                        novaConfiguracao
                                                            ?.campos
                                                            ?.valor_proposto
                                                            ?.obrigatorio === true ||
                                                        novaConfiguracao
                                                            ?.valor_obrigatorio === true;

                                                    if (
                                                        !novoValorObrigatorio &&
                                                        novoTipo !==
                                                            'PROPOSTA'
                                                    ) {
                                                        setValorProposto('');
                                                    }

                                                }}
                                                disabled={
                                                    processando
                                                }
                                            >

                                                {tiposPermitidos.map(
                                                    (
                                                        item
                                                    ) => (

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


                                        {mostrarValor && (

                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="valor-proposto">

                                                    Novo valor

                                                    {valorObrigatorio &&
                                                        ' *'}

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


                                        {mostrarMensagem &&
                                            tipoResposta !==
                                                'INTERESSE' && (

                                            <div className="negociacao-form-grupo">

                                                <label htmlFor="mensagem-resposta">

                                                    Mensagem

                                                    {mensagemObrigatoria &&
                                                        ' *'}

                                                </label>


                                                <textarea
                                                    id="mensagem-resposta"
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
                                                    placeholder={
                                                        tipoResposta ===
                                                            'RESPOSTA'
                                                            ? 'Digite a resposta para a dúvida...'
                                                            : tipoResposta ===
                                                                'DUVIDA'
                                                                ? 'Digite sua dúvida...'
                                                                : tipoResposta ===
                                                                    'PROPOSTA'
                                                                    ? 'Digite os detalhes da sua proposta...'
                                                                    : 'Digite sua mensagem...'
                                                    }
                                                    rows="4"
                                                    maxLength="5000"
                                                    disabled={
                                                        processando
                                                    }
                                                />

                                            </div>

                                        )}


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
                                                : tipoResposta ===
                                                    'INTERESSE'
                                                    ? 'Demonstrar interesse'
                                                    : tipoResposta ===
                                                        'RESPOSTA'
                                                        ? 'Responder dúvida'
                                                        : tipoResposta ===
                                                            'PROPOSTA'
                                                            ? 'Enviar proposta'
                                                            : tipoResposta ===
                                                                'DUVIDA'
                                                                ? 'Enviar dúvida'
                                                                : 'Enviar interação'}

                                        </button>

                                    </div>

                                )}


                                {/* =================================================
                                    PAGAMENTO
                                   ================================================= */}

                                {acoes.pagamento && (

                                    <div className="negociacao-pagamento-acao">

                                        <button
                                            type="button"
                                            className="btn-negociacao-aceitar"
                                            onClick={() =>
                                                setExibindoPagamento(
                                                    true
                                                )
                                            }
                                            disabled={
                                                processando
                                            }
                                        >
                                            💳 Realizar pagamento
                                        </button>

                                    </div>

                                )}

                            </div>

                        )}


                        {/* =================================================
                            SEM AÇÕES
                           ================================================= */}

                        {!acoes.aceitar &&
                            !acoes.recusar &&
                            !acoes.interagir &&
                            !acoes.pagamento && (

                            <div className="negociacao-sem-acoes">

                                <strong>
                                    {obterNomeStatus(
                                        negociacaoSelecionada
                                    )}
                                </strong>


                                <span>

                                    {contexto.vez ===
                                        'INTERESSADO'
                                        ? 'Aguardando o interessado realizar a próxima ação.'

                                        : contexto.vez ===
                                            'CONTRATANTE'
                                            ? 'Aguardando o contratante realizar a próxima ação.'

                                            : obterCodigoStatus(
                                                negociacaoSelecionada
                                            ) ===
                                                'AGUARDANDO_PAGAMENTO'
                                                ? 'A negociação foi aceita e está aguardando o pagamento.'

                                                : obterCodigoStatus(
                                                    negociacaoSelecionada
                                                ) ===
                                                    'PROCESSANDO_PAGAMENTO'
                                                    ? 'O pagamento foi informado e está em processamento.'

                                                    : obterCodigoStatus(
                                                        negociacaoSelecionada
                                                    ) ===
                                                        'FECHADA'
                                                        ? 'Esta negociação já foi concluída.'

                                                        : obterCodigoStatus(
                                                            negociacaoSelecionada
                                                        ) ===
                                                            'ENCERRADA'
                                                            ? 'Esta negociação foi encerrada.'

                                                            : obterCodigoStatus(
                                                                negociacaoSelecionada
                                                            ) ===
                                                                'CANCELADA'
                                                                ? 'Esta negociação foi cancelada.'

                                                                : 'Não há ações disponíveis para esta negociação no momento.'}

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
                                                negociacao
                                                    .id_negociacao
                                            }
                                            className="negociacao-card"
                                        >

                                            <div className="negociacao-card-header">

                                                <div>

                                                    <h3>
                                                        {
                                                            negociacao
                                                                .interessado
                                                                ?.name ||
                                                            negociacao
                                                                .interessado
                                                                ?.nome ||
                                                            'Interessado'
                                                        }
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
                                                            obterInteracoes(
                                                                negociacao
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
                                                disabled={
                                                    carregandoDetalhes
                                                }
                                            >
                                                Abrir negociação
                                            </button>

                                        </article>

                                    )
                                )}

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