export function formatarValor(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 'Não informado';
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return 'Não informado';
    }

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL',
        }
    );
}


export function formatarData(data) {

    if (!data) {
        return 'Não informada';
    }

    const valor = String(data);

    const dataParte =
        valor.split('T')[0];

    const partes =
        dataParte.split('-');

    if (
        partes.length === 3 &&
        partes.every((parte) => parte)
    ) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return 'Não informada';
}


export function formatarStatusTrabalho(
    statusCodigo
) {

    const status =
        String(statusCodigo || '')
            .trim()
            .toUpperCase();

    const statusMap = {

        PENDENTE:
            'Aguardando realização',

        AGUARDANDO_CONFIRMACAO:
            'Aguardando confirmação',

        CONCLUIDO:
            'Concluído',

        EM_AVALIACAO:
            'Em avaliação',

        DESISTENCIA:
            'Desistência',

        ESTORNADO:
            'Estornado',

        CANCELADO:
            'Cancelado',
    };

    return (
        statusMap[status] ||
        statusCodigo ||
        'Não informado'
    );
}


export function formatarStatusPagamento(
    statusCodigo
) {

    const status =
        String(statusCodigo || '')
            .trim()
            .toUpperCase();

    const statusMap = {

        AGUARDANDO_PROCESSAMENTO:
            'Aguardando processamento',

        PROCESSANDO:
            'Processando pagamento',

        PAGO:
            'Pagamento realizado',

        ESTORNADO:
            'Pagamento estornado',

        NAO_PROCESSADO:
            'Pagamento não processado',

        CANCELADO:
            'Pagamento cancelado',
    };

    return (
        statusMap[status] ||
        statusCodigo ||
        'Não informado'
    );
}


export function podeConcluirTrabalho(
    statusCodigo
) {

    return (
        statusCodigo ===
        'PENDENTE'
    );
}


export function podeDesistirTrabalho(
    statusCodigo,
    papel
) {

    const papelNormalizado =
        String(papel || '')
            .trim()
            .toUpperCase();


    /*
     * CONTRATANTE
     *
     * Pode desistir somente enquanto
     * o trabalho estiver PENDENTE.
     */

    if (
        papelNormalizado ===
        'CONTRATANTE'
    ) {

        return (
            statusCodigo ===
            'PENDENTE'
        );
    }


    /*
     * CONTRATADO
     *
     * Pode desistir somente enquanto
     * estiver PENDENTE.
     */

    return (
        statusCodigo ===
        'PENDENTE'
    );
}


export function podeConfirmarTrabalho(
    statusCodigo
) {

    return (
        statusCodigo ===
        'AGUARDANDO_CONFIRMACAO'
    );
}


export function podeContestarTrabalho(
    statusCodigo
) {

    return (
        statusCodigo ===
        'AGUARDANDO_CONFIRMACAO'
    );
}