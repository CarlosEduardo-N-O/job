import { useEffect, useState } from 'react';

import {
    obterConfiguracaoTipo,
    obterLabelTipo,
} from './negociacaoControle';

export default function NegociacaoInteracao({
    tiposPermitidos,
    processando,
    onSubmit,
}) {
    const [
        tipo,
        setTipo,
    ] = useState(
        tiposPermitidos?.[0]?.tipo || ''
    );

    const [
        mensagem,
        setMensagem,
    ] = useState('');

    const [
        valorProposto,
        setValorProposto,
    ] = useState('');

    const [
        erro,
        setErro,
    ] = useState('');


    useEffect(() => {
        setTipo(
            tiposPermitidos?.[0]?.tipo || ''
        );

        setMensagem('');
        setValorProposto('');
        setErro('');
    }, [tiposPermitidos]);


    const configuracao =
        obterConfiguracaoTipo(
            tipo,
            {
                opcoes_interacao:
                    tiposPermitidos,
            }
        );

    const campos =
        configuracao?.campos || {};

    const mensagemObrigatoria =
        campos?.mensagem?.obrigatorio === true ||
        configuracao?.mensagem_obrigatoria === true;

    const valorObrigatorio =
        campos?.valor_proposto?.obrigatorio === true ||
        configuracao?.valor_obrigatorio === true;

    const mostrarMensagem =
        campos?.mensagem?.visivel !== false;

    const mostrarValor =
        tipo === 'PROPOSTA' &&
        campos?.valor_proposto?.visivel !== false;


    function handleTipoChange(event) {
        const novoTipo =
            event.target.value;

        setTipo(novoTipo);
        setErro('');

        const novaConfiguracao =
            obterConfiguracaoTipo(
                novoTipo,
                {
                    opcoes_interacao:
                        tiposPermitidos,
                }
            );

        const novoValorObrigatorio =
            novaConfiguracao
                ?.campos
                ?.valor_proposto
                ?.obrigatorio === true ||
            novaConfiguracao
                ?.valor_obrigatorio === true;

        if (
            !novoValorObrigatorio &&
            novoTipo !== 'PROPOSTA'
        ) {
            setValorProposto('');
        }
    }


    function handleSubmit() {
        setErro('');

        const mensagemNormalizada =
            mensagem.trim();

        if (
            mensagemObrigatoria &&
            !mensagemNormalizada
        ) {
            setErro(
                'Digite uma mensagem.'
            );

            return;
        }

        if (
            valorObrigatorio &&
            (
                valorProposto === '' ||
                Number(valorProposto) <= 0
            )
        ) {
            setErro(
                'Informe um valor válido para a proposta.'
            );

            return;
        }

        onSubmit({
            tipo,
            mensagem:
                mensagemNormalizada ||
                null,
            valor_proposto:
                valorProposto,
        });
    }


    return (
        <div className="negociacao-resposta">

            <div className="negociacao-form-grupo">

                <label htmlFor="tipo-resposta">
                    Tipo da interação
                </label>

                <select
                    id="tipo-resposta"
                    value={tipo}
                    onChange={
                        handleTipoChange
                    }
                    disabled={processando}
                >

                    {tiposPermitidos.map(
                        (item) => (
                            <option
                                key={item.tipo}
                                value={item.tipo}
                            >
                                {obterLabelTipo(
                                    item.tipo
                                )}
                            </option>
                        )
                    )}

                </select>

            </div>


            {mostrarValor && (

                <div className="negociacao-form-grupo">

                    <label htmlFor="valor-proposto">

                        Novo valor

                        {valorObrigatorio &&
                            ' *'}

                    </label>

                    <input
                        id="valor-proposto"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                            valorProposto
                        }
                        onChange={(event) => {
                            setValorProposto(
                                event.target.value
                            );

                            setErro('');
                        }}
                        placeholder="R$ 0,00"
                        disabled={
                            processando
                        }
                    />

                </div>
            )}


            {mostrarMensagem &&
                tipo !== 'INTERESSE' && (

                <div className="negociacao-form-grupo">

                    <label htmlFor="mensagem-resposta">

                        Mensagem

                        {mensagemObrigatoria &&
                            ' *'}

                    </label>

                    <textarea
                        id="mensagem-resposta"
                        value={mensagem}
                        onChange={(event) => {
                            setMensagem(
                                event.target.value
                            );

                            setErro('');
                        }}
                        placeholder={
                            tipo === 'RESPOSTA'
                                ? 'Digite a resposta para a dúvida...'
                                : tipo === 'DUVIDA'
                                    ? 'Digite sua dúvida...'
                                    : tipo === 'PROPOSTA'
                                        ? 'Digite os detalhes da sua proposta...'
                                        : 'Digite sua mensagem...'
                        }
                        rows="4"
                        maxLength="5000"
                        disabled={
                            processando
                        }
                    />

                </div>
            )}


            {erro && (
                <div className="negociacao-erro-acao">
                    {erro}
                </div>
            )}


            <button
                type="button"
                className="btn-negociacao-responder"
                onClick={handleSubmit}
                disabled={
                    processando ||
                    !tipo
                }
            >
                {processando
                    ? 'Enviando...'
                    : tipo === 'INTERESSE'
                        ? 'Demonstrar interesse'
                        : tipo === 'RESPOSTA'
                            ? 'Responder dúvida'
                            : tipo === 'PROPOSTA'
                                ? 'Enviar proposta'
                                : tipo === 'DUVIDA'
                                    ? 'Enviar dúvida'
                                    : 'Enviar interação'}
            </button>

        </div>
    );
}