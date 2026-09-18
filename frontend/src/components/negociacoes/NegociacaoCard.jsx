import {
    formatarValor,
    obterInteracoes,
    obterNomeStatus,
    obterNomeUsuario,
} from './negociacaoControle';

export default function NegociacaoCard({
    negociacao,
    disabled,
    onAbrir,
}) {
    return (
        <article className="negociacao-card">

            <div className="negociacao-card-header">

                <div>

                    <h3>
                        {obterNomeUsuario(
                            negociacao
                                ?.interessado,
                            'Interessado'
                        )}
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
                                ?.valor_trabalho
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
                    onAbrir(
                        negociacao
                    )
                }
                disabled={disabled}
            >
                Abrir negociação
            </button>

        </article>
    );
}