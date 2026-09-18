import {
    formatarData,
    formatarTipo,
    formatarValor,
} from './negociacaoControle';

export default function NegociacaoHistorico({
    interacoes,
}) {
    return (
        <div className="negociacao-historico">

            <h3>
                Histórico
            </h3>


            {interacoes.length === 0 ? (

                <p className="negociacao-sem-interacoes">
                    Nenhuma interação encontrada.
                </p>

            ) : (

                interacoes.map(
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
                                    item
                                        ?.id_negociacao_interacao ||
                                    interacao
                                        ?.id_interacao ||
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
    );
}