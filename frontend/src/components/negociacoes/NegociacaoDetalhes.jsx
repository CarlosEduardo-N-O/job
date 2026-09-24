import {
    obterAcoes,
    obterCodigoStatus,
    obterContexto,
    obterInteracoes,
    obterNomeStatus,
    obterTipoUltimaInteracao,
} from './negociacaoControle';

import NegociacaoHistorico from './NegociacaoHistorico';
import NegociacaoAcoes from './NegociacaoAcoes';

export default function NegociacaoDetalhes({
    publicacao,
    negociacao,
    processando,
    erro,
    onVoltar,
    onAceitar,
    onRecusar,
    onResponder,
    onPagamento,
}) {
    const contexto = obterContexto(negociacao);

    const acoes = obterAcoes(negociacao);

    const tiposPermitidos =
        negociacao?.opcoes_interacao ||
        negociacao?.contexto?.opcoes_interacao ||
        negociacao?.acoes?.opcoes_interacao ||
        negociacao?.contexto?.acoes?.opcoes_interacao ||
        negociacao?.interacoes_permitidas ||
        [];

    const interacoes = obterInteracoes(negociacao);

    const tipoUltimaInteracao =
        obterTipoUltimaInteracao(negociacao);

    const valorContrato = Number(
        negociacao?.valor_trabalho || 0
    );

    const taxaPercentual = Number(
        negociacao?.taxa_percentual ?? 0
    );

    const valorTaxa = Number(
        negociacao?.valor_taxa ?? 0
    );

    const valorTotal = Number(
        negociacao?.valor_total ??
        (valorContrato + valorTaxa)
    );

    const possuiTaxa =
        negociacao?.valor_taxa !== null &&
        negociacao?.valor_taxa !== undefined;

    const formatarMoeda = (valor) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valor);

    return (
        <section className="negociacao-detalhes">

            <button
                type="button"
                className="negociacao-voltar"
                onClick={onVoltar}
                disabled={processando}
            >
                ← Voltar para negociações
            </button>

            <div className="negociacao-resumo">

                <div>
                    <span>
                        Interessado
                    </span>

                    <strong>
                        {negociacao?.interessado?.name ||
                            negociacao?.interessado?.nome ||
                            'Usuário'}
                    </strong>
                </div>

                <div>
                    <span>
                        Contratante
                    </span>

                    <strong>
                        {negociacao?.contratante?.name ||
                            negociacao?.contratante?.nome ||
                            'Usuário'}
                    </strong>
                </div>

                <div>
                    <span>
                        Seu papel
                    </span>

                    <strong>
                        {contexto.papel_usuario === 'INTERESSADO'
                            ? 'Interessado'
                            : contexto.papel_usuario === 'CONTRATANTE'
                                ? 'Contratante'
                                : 'Não informado'}
                    </strong>
                </div>

                <div>
                    <span>
                        Status
                    </span>

                    <strong>
                        {obterNomeStatus(negociacao)}
                    </strong>
                </div>

            </div>

            {/* =====================================================
                RESUMO FINANCEIRO
            ===================================================== */}

            <div className="negociacao-financeiro">

                <div className="negociacao-financeiro-header">

                    <div>
                        <strong>
                            Resumo financeiro
                        </strong>

                        <span>
                            Valores desta negociação
                        </span>
                    </div>

                </div>

                <div className="negociacao-financeiro-linhas">

                    <div className="negociacao-financeiro-linha">

                        <span>
                            Valor do contrato
                        </span>

                        <strong>
                            {formatarMoeda(valorContrato)}
                        </strong>

                    </div>

                    {possuiTaxa && (
                        <div className="negociacao-financeiro-linha">

                            <span>
                                Taxa de intermediação JOB
                                {taxaPercentual > 0 &&
                                    ` (${taxaPercentual
                                        .toFixed(2)
                                        .replace('.', ',')}%)`}
                            </span>

                            <strong>
                                + {formatarMoeda(valorTaxa)}
                            </strong>

                        </div>
                    )}

                </div>

                {possuiTaxa && (
                    <div className="negociacao-financeiro-total">

                        <div>
                            <strong>
                                Valor total
                            </strong>

                            <span>
                                Valor do contrato + taxa de intermediação
                            </span>
                        </div>

                        <strong>
                            {formatarMoeda(valorTotal)}
                        </strong>

                    </div>
                )}

            </div>

            <NegociacaoHistorico
                interacoes={interacoes}
            />

            <NegociacaoAcoes
                publicacao={publicacao}
                negociacao={negociacao}
                contexto={contexto}
                acoes={acoes}
                tiposPermitidos={tiposPermitidos}
                tipoUltimaInteracao={tipoUltimaInteracao}
                processando={processando}
                erro={erro}
                onAceitar={onAceitar}
                onRecusar={onRecusar}
                onResponder={onResponder}
                onPagamento={onPagamento}
            />

            {!acoes.aceitar &&
                !acoes.recusar &&
                !acoes.interagir &&
                !acoes.pagamento && (

                    <div className="negociacao-sem-acoes">

                        <strong>
                            {obterNomeStatus(negociacao)}
                        </strong>

                        <span>
                            {contexto.vez === 'INTERESSADO'
                                ? 'Aguardando o interessado realizar a próxima ação.'

                                : contexto.vez === 'CONTRATANTE'
                                    ? 'Aguardando o contratante realizar a próxima ação.'

                                    : obterCodigoStatus(negociacao) ===
                                        'AGUARDANDO_PAGAMENTO'
                                        ? 'A negociação foi aceita e está aguardando o pagamento.'

                                        : obterCodigoStatus(negociacao) ===
                                            'PROCESSANDO_PAGAMENTO'
                                            ? 'O pagamento foi informado e está em processamento.'

                                            : obterCodigoStatus(negociacao) ===
                                                'FECHADA'
                                                ? 'Esta negociação já foi concluída.'

                                                : obterCodigoStatus(negociacao) ===
                                                    'ENCERRADA'
                                                    ? 'Esta negociação foi encerrada.'

                                                    : obterCodigoStatus(negociacao) ===
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
                            {obterNomeStatus(negociacao)}
                        </strong>

                        <span>
                            A negociação permite interação,
                            mas nenhuma opção de interação
                            foi informada pelo servidor.
                        </span>

                    </div>
                )}

        </section>
    );
}