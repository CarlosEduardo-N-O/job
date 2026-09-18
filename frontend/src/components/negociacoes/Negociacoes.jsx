import { useEffect, useState } from 'react';

import {
    getNegociacoes,
    getNegociacao,
    interagirNegociacao,
    aceitarNegociacao,
    recusarNegociacao,
} from '../../services/negociacaoService';

import {
    informarPagamento,
} from '../../services/pagamentoService';

import NegociacaoLista from './NegociacaoLista';
import NegociacaoDetalhes from './NegociacaoDetalhes';
import NegociacaoPagamento from './NegociacaoPagamento';

import {
    normalizarNegociacao,
    obterContexto,
    obterAcoes,
    obterInteracoesPermitidas,
    obterConfiguracaoTipo,
} from './negociacaoControle';

import "../../styles/negociacoes.css";

export default function Negociacoes({
    publicacao: publicacaoProp,
    negociacao: negociacaoProp,
    onClose,
}) {
    const publicacao = publicacaoProp ?? negociacaoProp?.publicacao ?? null;
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
        exibindoPagamento,
        setExibindoPagamento,
    ] = useState(false);


    /*
     * ============================================================
     * CARREGAR NEGOCIAÇÕES
     * ============================================================
     */

    useEffect(() => {
        if (negociacaoProp) {
            abrirNegociacao(negociacaoProp);
            return;
        }

        if (publicacao?.id) {
            carregarNegociacoes();
        }
    }, [publicacao?.id, negociacaoProp?.id_negociacao]);


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

    async function abrirNegociacao(negociacao) {
        try {
            setCarregandoDetalhes(true);
            setErro('');
            setExibindoPagamento(false);

            const idNegociacao =
                negociacao?.id_negociacao ??
                negociacao?.id;

            if (!idNegociacao) {
                throw new Error(
                    'ID da negociação não encontrado.'
                );
            }

            const response =
                await getNegociacao(idNegociacao);

            const detalhes =
                normalizarNegociacao(response);

            setNegociacaoSelecionada(detalhes);

        } catch (error) {
            console.error(
                'Erro ao carregar negociação:',
                error
            );

            setErro(
                error?.response?.data?.message ||
                error?.message ||
                'Não foi possível carregar a negociação.'
            );

        } finally {
            setCarregandoDetalhes(false);
        }
    }


    /*
     * ============================================================
     * ATUALIZAR NEGOCIAÇÃO
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

            const atualizada =
                normalizarNegociacao(
                    response
                );

            setNegociacaoSelecionada(
                atualizada
            );

            return atualizada;

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
     * NAVEGAÇÃO
     * ============================================================
     */

    function voltarParaLista() {
        setNegociacaoSelecionada(null);
        setExibindoPagamento(false);
        setErro('');
    }


    async function voltarParaNegociacao() {
        setExibindoPagamento(false);
        setErro('');

        await atualizarDetalhes();
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

            const atualizada =
                await atualizarDetalhes();

            if (atualizada) {
                const acoesAtualizadas =
                    obterAcoes(atualizada);

                if (
                    acoesAtualizadas.pagamento
                ) {
                    setExibindoPagamento(true);
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
     * INTERAÇÃO
     * ============================================================
     */

    async function handleResponder(dados) {
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
                dados?.tipo || ''
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

        const mensagem =
            String(
                dados?.mensagem || ''
            ).trim();

        const valor =
            dados?.valor_proposto;

        if (
            mensagemObrigatoria &&
            !mensagem
        ) {
            setErro(
                'Digite uma mensagem.'
            );

            return;
        }

        if (
            valorObrigatorio &&
            (
                valor === '' ||
                valor === null ||
                valor === undefined ||
                Number(valor) <= 0
            )
        ) {
            setErro(
                'Informe um valor válido para a proposta.'
            );

            return;
        }

        try {
            setProcessando(true);

            const payload = {
                tipo,
                mensagem:
                    mensagem || null,
            };

            if (
                valorObrigatorio ||
                tipo === 'PROPOSTA'
            ) {
                payload.valor_proposto =
                    Number(valor);
            }

            await interagirNegociacao(
                negociacaoSelecionada
                    .id_negociacao,
                payload
            );

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
     * PAGAMENTO
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

            setExibindoPagamento(false);

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
     * PAGAMENTO
     * ============================================================
     */

    if (
        negociacaoSelecionada &&
        exibindoPagamento
    ) {
        return (
            <NegociacaoPagamento
                publicacao={publicacao}
                negociacao={negociacaoSelecionada}
                processando={processando}
                erro={erro}
                onClose={onClose}
                onVoltar={voltarParaNegociacao}
                onPagamentoRealizado={
                    handlePagamentoRealizado
                }
            />
        );
    }


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
                            {publicacao?.titulo ??
                                negociacaoSelecionada?.publicacao?.titulo ??
                                negociacaoProp?.publicacao?.titulo ??
                                'Negociação'}
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
                    <NegociacaoDetalhes
                        publicacao={publicacao}
                        negociacao={
                            negociacaoSelecionada
                        }
                        processando={processando}
                        erro={erro}
                        onVoltar={
                            voltarParaLista
                        }
                        onAceitar={
                            handleAceitar
                        }
                        onRecusar={
                            handleRecusar
                        }
                        onResponder={
                            handleResponder
                        }
                        onPagamento={() =>
                            setExibindoPagamento(
                                true
                            )
                        }
                    />
                ) : (
                    <NegociacaoLista
                        negociacoes={negociacoes}
                        carregando={carregando}
                        erro={erro}
                        carregandoDetalhes={
                            carregandoDetalhes
                        }
                        onAbrir={
                            abrirNegociacao
                        }
                    />
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