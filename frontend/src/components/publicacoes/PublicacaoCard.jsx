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

    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatarData(data) {
    if (!data) {
        return 'Não informada';
    }

    const valor = String(data);

    const dataParte = valor.split('T')[0];

    const partes = dataParte.split('-');

    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
}

export default function PublicacaoCard({
    publicacao,
    onInteracao,
}) {
    const statusCodigo =
        publicacao.status?.codigo ?? '';

    const statusNome =
        publicacao.status?.nome ??
        statusCodigo ??
        'Sem status';

    return (
        <article className="publicacao-card">

            <div className="publicacao-card-header">

                <div>

                    <h2>
                        {publicacao.titulo}
                    </h2>

                    {publicacao.categoria && (
                        <span className="publicacao-categoria">
                            {publicacao.categoria.nome}
                        </span>
                    )}

                </div>

                <span className="publicacao-status">
                    {statusNome}
                </span>

            </div>

            <div className="publicacao-card-body">

                <p className="publicacao-descricao">
                    {publicacao.descricao}
                </p>

                <div className="publicacao-info">

                    <div>
                        <span>
                            Valor estimado
                        </span>

                        <strong>
                            {formatarValor(
                                publicacao.valor_estimado
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Data
                        </span>

                        <strong>
                            {formatarData(
                                publicacao.data_inicio
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Local
                        </span>

                        <strong>
                            {publicacao.cidade ||
                                'Não informado'}

                            {publicacao.estado
                                ? ` - ${publicacao.estado}`
                                : ''}
                        </strong>
                    </div>

                </div>

                {publicacao.contratante && (
                    <div className="publicacao-contratante">

                        <span>
                            Contratante
                        </span>

                        <strong>
                            {
                                publicacao
                                    .contratante
                                    .name
                            }
                        </strong>

                    </div>
                )}

            </div>

            <div className="publicacao-acoes">

                <button
                    type="button"
                    className="acao-interesse"
                    onClick={() =>
                        onInteracao(
                            publicacao,
                            'INTERESSE'
                        )
                    }
                    disabled={
                        statusCodigo !== 'ATIVO'
                    }
                >
                    ❤️ Interesse
                </button>

                <button
                    type="button"
                    className="acao-duvida"
                    onClick={() =>
                        onInteracao(
                            publicacao,
                            'DUVIDA'
                        )
                    }
                    disabled={
                        statusCodigo !== 'ATIVO'
                    }
                >
                    ❓ Dúvida
                </button>

                <button
                    type="button"
                    className="acao-proposta"
                    onClick={() =>
                        onInteracao(
                            publicacao,
                            'PROPOSTA'
                        )
                    }
                    disabled={
                        statusCodigo !== 'ATIVO'
                    }
                >
                    💰 Proposta
                </button>

            </div>

        </article>
    );
}