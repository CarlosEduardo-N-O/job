import {
    formatarValor,
    obterInteracoes,
    obterNomeStatus,
    obterNomeUsuario,
} from './negociacaoControle';

import PublicacaoAnexos from '../publicacoes/PublicacaoAnexos';

export default function NegociacaoCard({
    negociacao,
    disabled,
    onAbrir,
    mostrarAnexos = false,
}) {
    const publicacao =
        negociacao?.publicacao ??
        negociacao?.publicacao_relacionada ??
        null;

    const valorContrato = Number(
        negociacao?.valor_trabalho || 0
    );

    const valorTaxa = Number(
        negociacao?.valor_taxa ?? 0
    );

    const valorTotal = Number(
        negociacao?.valor_total ??
        (valorContrato + valorTaxa)
    );

    const taxaPercentual = Number(
        negociacao?.taxa_percentual ?? 0
    );

    const possuiTaxa =
        negociacao?.valor_taxa !== null &&
        negociacao?.valor_taxa !== undefined;

    return (
        <article className="negociacao-card">

            <div className="negociacao-card-header">

                <div>

                    <h3>
                        {obterNomeUsuario(
                            negociacao?.interessado,
                            'Interessado'
                        )}
                    </h3>

                    <span>
                        Interessado
                    </span>

                </div>

                <span className="negociacao-status">
                    {obterNomeStatus(negociacao)}
                </span>

            </div>

            {mostrarAnexos && publicacao && (
                <PublicacaoAnexos
                    publicacao={publicacao}
                />
            )}

            <div className="negociacao-card-info">

                <div>
                    <span>
                        Valor do contrato
                    </span>

                    <strong>
                        {formatarValor(valorContrato)}
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

            {possuiTaxa && (
                <div className="negociacao-card-total">

                    <div className="negociacao-card-total-info">

                        <span>
                            Total que o contratante paga
                        </span>

                        <small>
                            Contrato + taxa de intermediação JOB
                            {taxaPercentual > 0 &&
                                ` (${taxaPercentual
                                    .toFixed(2)
                                    .replace('.', ',')}%)`}
                        </small>

                    </div>

                    <strong>
                        {formatarValor(valorTotal)}
                    </strong>

                </div>
            )}

            <button
                type="button"
                className="btn-abrir-negociacao"
                onClick={() =>
                    onAbrir(negociacao)
                }
                disabled={disabled}
            >
                Abrir negociação
            </button>

        </article>
    );
}