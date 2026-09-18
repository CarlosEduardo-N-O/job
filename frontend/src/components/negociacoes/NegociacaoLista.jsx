import NegociacaoCard from './NegociacaoCard';

export default function NegociacaoLista({
    negociacoes,
    carregando,
    erro,
    carregandoDetalhes,
    onAbrir,
}) {
    return (
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
                negociacoes.length === 0 && (
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
                negociacoes.length > 0 && (
                    <div className="negociacoes-cards">

                        {negociacoes.map(
                            (negociacao) => (
                                <NegociacaoCard
                                    key={
                                        negociacao
                                            .id_negociacao
                                    }
                                    negociacao={
                                        negociacao
                                    }
                                    disabled={
                                        carregandoDetalhes
                                    }
                                    onAbrir={
                                        onAbrir
                                    }
                                />
                            )
                        )}

                    </div>
                )}

        </section>
    );
}