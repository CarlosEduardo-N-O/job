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
    const contexto =
        obterContexto(
            negociacao
        );

    const acoes =
        obterAcoes(
            negociacao
        );

    const tiposPermitidos =
        negociacao?.opcoes_interacao ||
        negociacao?.contexto?.opcoes_interacao ||
        negociacao?.acoes?.opcoes_interacao ||
        negociacao?.contexto?.acoes?.opcoes_interacao ||
        negociacao?.interacoes_permitidas ||
        [];

    const interacoes =
        obterInteracoes(
            negociacao
        );

    const tipoUltimaInteracao =
        obterTipoUltimaInteracao(
            negociacao
        );

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
                        {
                            negociacao
                                ?.interessado
                                ?.name ||
                            negociacao
                                ?.interessado
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
                            negociacao
                                ?.contratante
                                ?.name ||
                            negociacao
                                ?.contratante
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
                            negociacao
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        Valor
                    </span>

                    <strong>
                        {new Intl.NumberFormat(
                            'pt-BR',
                            {
                                style: 'currency',
                                currency: 'BRL',
                            }
                        ).format(
                            Number(
                                negociacao
                                    ?.valor_trabalho || 0
                            )
                        )}
                    </strong>
                </div>

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
                tipoUltimaInteracao={
                    tipoUltimaInteracao
                }
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
                            {obterNomeStatus(
                                negociacao
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
                                        negociacao
                                    ) ===
                                        'AGUARDANDO_PAGAMENTO'
                                        ? 'A negociação foi aceita e está aguardando o pagamento.'

                                        : obterCodigoStatus(
                                            negociacao
                                        ) ===
                                            'PROCESSANDO_PAGAMENTO'
                                            ? 'O pagamento foi informado e está em processamento.'

                                            : obterCodigoStatus(
                                                negociacao
                                            ) ===
                                                'FECHADA'
                                                ? 'Esta negociação já foi concluída.'

                                                : obterCodigoStatus(
                                                    negociacao
                                                ) ===
                                                    'ENCERRADA'
                                                    ? 'Esta negociação foi encerrada.'

                                                    : obterCodigoStatus(
                                                        negociacao
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
                                negociacao
                            )}
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