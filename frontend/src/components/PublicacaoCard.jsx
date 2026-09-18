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

    /*
     * Laravel pode retornar:
     *
     * 2026-09-18T00:00:00.000000Z
     *
     * Pegamos somente a parte da data.
     */

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

    /*
     * O backend agora retorna o status como objeto:
     *
     * status: {
     *     id: 1,
     *     codigo: "ATIVO",
     *     nome: "Ativo"
     * }
     *
     * Por isso usamos codigo para regras
     * e nome para exibição.
     */

    const statusCodigo =
        publicacao.status?.codigo ?? '';

    const statusNome =
        publicacao.status?.nome ??
        statusCodigo ??
        'Sem status';


    return (
        <article className="publicacao-card">


            {/* ==========================================
                CABEÇALHO
            ========================================== */}

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


            {/* ==========================================
                CORPO
            ========================================== */}

            <div className="publicacao-card-body">

                <p className="publicacao-descricao">
                    {publicacao.descricao}
                </p>


                <div className="publicacao-info">


                    {/* VALOR */}

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


                    {/* DATA */}

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


                    {/* LOCAL */}

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


                {/* ==========================================
                    CONTRATANTE
                ========================================== */}

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


            {/* ==========================================
                AÇÕES
            ========================================== */}

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
                    disabled={statusCodigo !== 'ATIVO'}
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
                    disabled={statusCodigo !== 'ATIVO'}
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
                    disabled={statusCodigo !== 'ATIVO'}
                >
                    💰 Proposta
                </button>

            </div>

        </article>
    );
}
