export function normalizarNegociacao(response) {
    const dados =
        response?.data ?? response;

    if (
        dados?.data &&
        !Array.isArray(dados.data) &&
        typeof dados.data === 'object'
    ) {
        return dados.data;
    }

    return dados;
}


export function obterContexto(
    negociacao
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


export function obterAcoes(
    negociacao
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


export function obterInteracoesPermitidas(
    negociacao
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


export function obterConfiguracaoTipo(
    tipo,
    negociacao
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


export function formatarValor(
    valor
) {
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


export function formatarData(
    data
) {
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


export function formatarTipo(
    tipo
) {
    if (!tipo) {
        return 'Não informado';
    }

    const tipoNormalizado =
        String(tipo)
            .trim()
            .toUpperCase();

    const tipos = {
        INTERESSE: 'Interesse',
        PROPOSTA: 'Proposta',
        DUVIDA: 'Dúvida',
        RESPOSTA: 'Resposta',
        ACEITE: 'Aceite',
    };

    return (
        tipos[tipoNormalizado] ||
        tipo
    );
}


export function obterCodigoStatus(
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


export function formatarStatus(
    status
) {
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


export function obterNomeStatus(
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

    return formatarStatus(
        codigo
    );
}


export function obterInteracoes(
    negociacao
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


export function obterUltimaInteracao(
    negociacao
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


export function obterTipoUltimaInteracao(
    negociacao
) {
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


export function obterNomeUsuario(
    usuario,
    fallback = 'Usuário'
) {
    return (
        usuario?.name ||
        usuario?.nome ||
        fallback
    );
}


export function obterLabelTipo(
    tipo
) {
    const tipoNormalizado =
        String(tipo || '')
            .trim()
            .toUpperCase();

    const labels = {
        INTERESSE:
            'Demonstrar interesse',

        PROPOSTA:
            'Enviar proposta',

        DUVIDA:
            'Nova dúvida',

        RESPOSTA:
            'Responder dúvida',
    };

    return (
        labels[tipoNormalizado] ||
        formatarTipo(tipo)
    );
}