import {
    formatarTipo,
} from './negociacaoControle';

import NegociacaoInteracao from './NegociacaoInteracao';

export default function NegociacaoAcoes({
    contexto,
    acoes,
    tiposPermitidos,
    tipoUltimaInteracao,
    processando,
    erro,
    onAceitar,
    onRecusar,
    onResponder,
    onPagamento,
}) {
    return (
        <div className="negociacao-acoes">

            <div className="negociacao-acoes-titulo">

                <h3>
                    {contexto.pode_agir
                        ? 'Sua vez'
                        : 'Aguardando'}
                </h3>


                <span>
                    {contexto.pode_agir
                        ? 'Você pode realizar a próxima ação.'

                        : contexto.vez ===
                            'INTERESSADO'
                            ? 'Aguardando o interessado.'

                            : contexto.vez ===
                                'CONTRATANTE'
                                ? 'Aguardando o contratante.'

                                : 'Nenhuma ação pendente.'}
                </span>


                {tipoUltimaInteracao && (
                    <span>
                        Última interação:{' '}
                        {formatarTipo(
                            tipoUltimaInteracao
                        )}
                    </span>
                )}

            </div>


            {(acoes.aceitar ||
                acoes.recusar) && (

                <div className="negociacao-botoes-principais">

                    {acoes.aceitar && (
                        <button
                            type="button"
                            className="btn-negociacao-aceitar"
                            onClick={onAceitar}
                            disabled={processando}
                        >
                            {processando
                                ? 'Processando...'
                                : '✓ Aceitar'}
                        </button>
                    )}


                    {acoes.recusar && (
                        <button
                            type="button"
                            className="btn-negociacao-recusar"
                            onClick={onRecusar}
                            disabled={processando}
                        >
                            {processando
                                ? 'Processando...'
                                : '✕ Recusar'}
                        </button>
                    )}

                </div>
            )}


            {acoes.interagir &&
                tiposPermitidos.length > 0 && (

                    <NegociacaoInteracao
                        tiposPermitidos={
                            tiposPermitidos
                        }
                        processando={
                            processando
                        }
                        onSubmit={
                            onResponder
                        }
                    />
                )}


            {acoes.pagamento && (
                <div className="negociacao-pagamento-acao">

                    <button
                        type="button"
                        className="btn-negociacao-aceitar"
                        onClick={
                            onPagamento
                        }
                        disabled={processando}
                    >
                        💳 Realizar pagamento
                    </button>

                </div>
            )}


            {erro && (
                <div className="negociacao-erro-acao">
                    {erro}
                </div>
            )}

        </div>
    );
}