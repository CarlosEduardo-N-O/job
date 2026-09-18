import {
    formatarValor,
    obterAcoes,
    obterCodigoStatus,
    obterNomeUsuario,
} from './negociacaoControle';

export default function NegociacaoPagamento({
    publicacao,
    negociacao,
    processando,
    erro,
    onClose,
    onVoltar,
    onPagamentoRealizado,
}) {
    const statusPagamento =
        obterCodigoStatus(
            negociacao
        );

    const acoes =
        obterAcoes(
            negociacao
        );

    const valor =
        negociacao?.valor_trabalho ??
        publicacao?.valor_estimado;

    /*
     * QR Code visual fictício.
     *
     * Ele serve apenas para demonstração da interface.
     * Não representa um código PIX real.
     */
    const qrCodigo = Array.from(
        { length: 121 },
        (_, index) => {
            const linha = Math.floor(index / 11);
            const coluna = index % 11;

            /*
             * Alguns módulos fixos para deixar
             * o padrão visual semelhante a um QR Code.
             */
            const padroes = [
                [0, 0],
                [0, 1],
                [0, 2],
                [0, 4],
                [0, 5],
                [0, 6],

                [1, 0],
                [1, 2],
                [1, 4],
                [1, 6],

                [2, 0],
                [2, 1],
                [2, 2],
                [2, 4],
                [2, 5],
                [2, 6],

                [4, 0],
                [4, 1],
                [4, 2],
                [4, 4],
                [4, 5],
                [4, 6],

                [5, 0],
                [5, 2],
                [5, 4],
                [5, 6],

                [6, 0],
                [6, 1],
                [6, 2],
                [6, 4],
                [6, 5],
                [6, 6],
            ];

            const pertenceAoPadrao = padroes.some(
                ([l, c]) =>
                    linha === l &&
                    coluna === c
            );

            /*
             * Área central e inferior:
             * padrão determinístico para evitar
             * um quadrado completamente preenchido.
             */
            const preenchido =
                pertenceAoPadrao ||
                (
                    linha >= 3 &&
                    coluna >= 3 &&
                    (
                        (
                            linha * 7 +
                            coluna * 11 +
                            linha * coluna
                        ) % 5
                    ) < 2
                );

            return preenchido;
        }
    );

    return (
        <div
            className="negociacoes-modal-overlay"
            onMouseDown={onClose}
        >
            <div
                className="negociacoes-modal"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >

                <header className="negociacoes-modal-header">

                    <div>

                        <h2>
                            Pagamento
                        </h2>

                        <p>
                            {publicacao.titulo}
                        </p>

                    </div>

                    <button
                        type="button"
                        className="negociacoes-modal-fechar"
                        onClick={onClose}
                    >
                        ×
                    </button>

                </header>


                <section className="negociacao-pagamento">

                    <button
                        type="button"
                        className="negociacao-voltar"
                        onClick={onVoltar}
                        disabled={processando}
                    >
                        ← Voltar para negociação
                    </button>


                    <div className="pagamento-titulo">

                        <h3>
                            Pagamento via PIX
                        </h3>

                        <p>
                            Para confirmar a contratação,
                            realize o pagamento do valor
                            acordado.
                        </p>

                    </div>


                    <div className="pagamento-resumo">

                        <div>
                            <span>
                                Serviço
                            </span>

                            <strong>
                                {publicacao.titulo}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Contratado
                            </span>

                            <strong>
                                {obterNomeUsuario(
                                    negociacao?.interessado
                                )}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Valor da negociação
                            </span>

                            <strong className="pagamento-valor">
                                {formatarValor(
                                    valor
                                )}
                            </strong>
                        </div>

                    </div>


                    <div className="pagamento-status">

                        <span className="pagamento-status-indicador">
                            ⏳
                        </span>

                        <div>

                            <strong>
                                {statusPagamento ===
                                    'PROCESSANDO_PAGAMENTO'
                                    ? 'Pagamento informado'
                                    : 'Aguardando pagamento'}
                            </strong>

                            <span>
                                {statusPagamento ===
                                    'PROCESSANDO_PAGAMENTO'
                                    ? 'O pagamento foi informado e está aguardando processamento.'
                                    : 'Realize o pagamento via PIX e depois informe que o pagamento foi realizado.'}
                            </span>

                        </div>

                    </div>


                    {statusPagamento ===
                        'AGUARDANDO_PAGAMENTO' && (

                        <div className="pagamento-qrcode-container">

                            <h3>
                                Escaneie o QR Code
                            </h3>

                            <div
                                className="pagamento-qrcode-ficticio"
                                aria-label="QR Code fictício"
                                role="img"
                            >

                                <div className="qr-matriz">

                                    {qrCodigo.map(
                                        (ativo, index) => (
                                            <span
                                                key={index}
                                                className={
                                                    ativo
                                                        ? 'ativo'
                                                        : ''
                                                }
                                            />
                                        )
                                    )}

                                </div>

                            </div>

                            <p className="pagamento-qrcode-aviso">
                                QR Code fictício para
                                demonstração.
                            </p>

                        </div>
                    )}


                    {statusPagamento ===
                        'AGUARDANDO_PAGAMENTO' && (

                        <div className="pagamento-pix">

                            <span>
                                Chave PIX
                            </span>

                            <strong>
                                job-pagamento@teste.com
                            </strong>

                            <small>
                                Chave fictícia para demonstração
                            </small>

                        </div>
                    )}


                    <div className="pagamento-aviso">

                        <strong>
                            🔒 Pagamento seguro
                        </strong>

                        <span>
                            A contratação somente será
                            confirmada após a identificação
                            do pagamento.
                        </span>

                    </div>


                    {erro && (
                        <div className="negociacao-erro-acao">
                            {erro}
                        </div>
                    )}


                    {statusPagamento ===
                        'AGUARDANDO_PAGAMENTO' && (

                        <button
                            type="button"
                            className="btn-pagamento-realizado"
                            onClick={
                                onPagamentoRealizado
                            }
                            disabled={
                                processando ||
                                !acoes.pagamento
                            }
                        >
                            {processando
                                ? 'Processando...'
                                : 'Pagamento realizado'}
                        </button>
                    )}


                    <button
                        type="button"
                        className="btn-pagamento-voltar"
                        onClick={onVoltar}
                        disabled={processando}
                    >
                        Voltar
                    </button>

                </section>

            </div>
        </div>
    );
}
