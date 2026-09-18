import { useEffect, useState } from 'react';

const configuracoes = {
    INTERESSE: {
        titulo: 'Demonstrar interesse',
        descricao:
            'Você deseja demonstrar interesse nesta oportunidade?',
        botao:
            'Enviar interesse',
    },

    DUVIDA: {
        titulo: 'Enviar dúvida',
        descricao:
            'Envie uma dúvida para o contratante antes de continuar.',
        botao:
            'Enviar dúvida',
    },

    PROPOSTA: {
        titulo: 'Enviar proposta',
        descricao:
            'Informe o valor que você propõe para realizar este trabalho.',
        botao:
            'Enviar proposta',
    },
};

export default function InteracaoModal({
    publicacao,
    tipo,
    onClose,
    onSubmit,
    loading = false,
    error = '',
}) {
    const [mensagem, setMensagem] = useState('');

    const [valorProposto, setValorProposto] =
        useState('');

    const config = configuracoes[tipo];

    useEffect(() => {
        setMensagem('');
        setValorProposto('');
    }, [tipo, publicacao?.id]);

    if (!config) {
        return null;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const dados = {
            tipo,
            mensagem:
                mensagem.trim() || null,
            valor_proposto:
                tipo === 'PROPOSTA'
                    ? valorProposto
                    : null,
        };

        onSubmit(dados);
    }

    return (
        <div
            className="interacao-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !loading
                ) {
                    onClose();
                }
            }}
        >

            <div className="interacao-modal">

                <div className="interacao-modal-header">

                    <div>
                        <h2>
                            {config.titulo}
                        </h2>

                        <p>
                            {publicacao.titulo}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="interacao-modal-close"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ×
                    </button>

                </div>

                <div className="interacao-modal-content">

                    <p className="interacao-descricao">
                        {config.descricao}
                    </p>

                    {tipo === 'PROPOSTA' && (
                        <div className="form-group">

                            <label htmlFor="valor-proposto">
                                Valor da proposta
                            </label>

                            <input
                                id="valor-proposto"
                                type="number"
                                min="0"
                                step="0.01"
                                value={valorProposto}
                                onChange={(event) =>
                                    setValorProposto(
                                        event.target.value
                                    )
                                }
                                placeholder="Ex.: 350.00"
                                required
                                disabled={loading}
                            />

                        </div>
                    )}

                    {tipo !== 'INTERESSE' && (
                        <div className="form-group">

                            <label htmlFor="mensagem">
                                {tipo === 'DUVIDA'
                                    ? 'Sua dúvida'
                                    : 'Mensagem'}
                            </label>

                            <textarea
                                id="mensagem"
                                value={mensagem}
                                onChange={(event) =>
                                    setMensagem(
                                        event.target.value
                                    )
                                }
                                placeholder={
                                    tipo === 'DUVIDA'
                                        ? 'Digite sua dúvida...'
                                        : 'Escreva uma mensagem para o contratante...'
                                }
                                rows="4"
                                required={
                                    tipo === 'DUVIDA'
                                }
                                disabled={loading}
                            />

                        </div>
                    )}

                    {tipo === 'INTERESSE' && (
                        <div className="interesse-aviso">
                            <span>❤️</span>

                            <p>
                                Ao enviar seu interesse,
                                será criada uma negociação
                                com o contratante.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="interacao-error">
                            {error}
                        </div>
                    )}

                </div>

                <div className="interacao-modal-actions">

                    <button
                        type="button"
                        className="btn-cancelar"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="btn-enviar"
                        form="form-interacao"
                        disabled={loading}
                    >
                        {loading
                            ? 'Enviando...'
                            : config.botao}
                    </button>

                </div>

                <form
                    id="form-interacao"
                    onSubmit={handleSubmit}
                />

            </div>

        </div>
    );
}