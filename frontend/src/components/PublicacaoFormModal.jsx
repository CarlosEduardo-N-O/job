import { useEffect, useState } from 'react';

import api from '../services/api';

import {
    criarPublicacao,
    atualizarPublicacao,
} from '../services/publicacaoService';

import '../styles/publicacao-form-modal.css';

export default function PublicacaoFormModal({
    publicacao,
    onClose,
    onSaved,
}) {
    const modoEdicao = Boolean(publicacao);

    const [categorias, setCategorias] = useState([]);

    const [formulario, setFormulario] = useState({
        categoria_id: '',
        titulo: '',
        descricao: '',
        valor_estimado: '',
        cidade: '',
        estado: '',
        endereco_servico: '',
        data_inicio: '',
        horario_inicio: '',
        data_fim: '',
    });

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    /*
    |--------------------------------------------------------------------------
    | Carregar dados
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro('');

            const responseCategorias =
                await api.get(
                    '/users-categorias/categorias'
                );

            const dadosCategorias =
                responseCategorias.data;

            if (Array.isArray(dadosCategorias)) {
                setCategorias(dadosCategorias);
            } else if (
                Array.isArray(
                    dadosCategorias?.data
                )
            ) {
                setCategorias(
                    dadosCategorias.data
                );
            }

            if (publicacao) {
                setFormulario({
                    categoria_id:
                        publicacao.categoria_id ?? '',

                    titulo:
                        publicacao.titulo ?? '',

                    descricao:
                        publicacao.descricao ?? '',

                    valor_estimado:
                        publicacao.valor_estimado ?? '',

                    cidade:
                        publicacao.cidade ?? '',

                    estado:
                        publicacao.estado ?? '',

                    endereco_servico:
                        publicacao.endereco_servico ?? '',

                    data_inicio:
                        formatarData(
                            publicacao.data_inicio
                        ),

                    horario_inicio:
                        publicacao.horario_inicio ?? '',

                    data_fim:
                        formatarData(
                            publicacao.data_fim
                        ),
                });
            }
        } catch (error) {
            console.error(
                'Erro ao carregar formulário:',
                error
            );

            setErro(
                obterMensagemErro(
                    error,
                    'Não foi possível carregar os dados.'
                )
            );
        } finally {
            setCarregando(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Alteração dos campos
    |--------------------------------------------------------------------------
    */

    function handleChange(event) {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    /*
    |--------------------------------------------------------------------------
    | Salvar
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {
        event.preventDefault();

        setErro('');

        if (!formulario.categoria_id) {
            setErro(
                'Selecione uma categoria.'
            );
            return;
        }

        if (!formulario.titulo.trim()) {
            setErro(
                'Informe o título da publicação.'
            );
            return;
        }

        if (!formulario.descricao.trim()) {
            setErro(
                'Informe a descrição da publicação.'
            );
            return;
        }

        if (!formulario.cidade.trim()) {
            setErro(
                'Informe a cidade do serviço.'
            );
            return;
        }

        if (!formulario.estado.trim()) {
            setErro(
                'Informe o estado do serviço.'
            );
            return;
        }

        try {
            setSalvando(true);

            const dados = {
                categoria_id:
                    Number(
                        formulario.categoria_id
                    ),

                titulo:
                    formulario.titulo.trim(),

                descricao:
                    formulario.descricao.trim(),

                valor_estimado:
                    formulario.valor_estimado !== ''
                        ? Number(
                              formulario.valor_estimado
                          )
                        : null,

                cidade:
                    formulario.cidade.trim(),

                estado:
                    formulario.estado.trim(),

                endereco_servico:
                    formulario.endereco_servico.trim() ||
                    null,

                data_inicio:
                    formulario.data_inicio || null,

                horario_inicio:
                    formulario.horario_inicio || null,

                data_fim:
                    formulario.data_fim || null,
            };

            let response;

            if (modoEdicao) {
                response =
                    await atualizarPublicacao(
                        publicacao.id,
                        dados
                    );
            } else {
                response =
                    await criarPublicacao(
                        dados
                    );
            }

            onSaved?.(
                response?.data ?? response
            );

            onClose();
        } catch (error) {
            console.error(
                'Erro ao salvar publicação:',
                error
            );

            setErro(
                obterMensagemErro(
                    error,
                    modoEdicao
                        ? 'Não foi possível atualizar a publicação.'
                        : 'Não foi possível criar a publicação.'
                )
            );
        } finally {
            setSalvando(false);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    return (
        <div
            className="publicacao-modal-overlay"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    if (!salvando) {
                        onClose();
                    }
                }
            }}
        >

            <div className="publicacao-modal">

                <div className="publicacao-modal-header">

                    <div>
                        <h2>
                            {modoEdicao
                                ? 'Editar publicação'
                                : 'Nova publicação'}
                        </h2>

                        <p>
                            {modoEdicao
                                ? 'Atualize os dados do serviço.'
                                : 'Preencha os dados do serviço.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="publicacao-modal-fechar"
                        onClick={onClose}
                        disabled={salvando}
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </div>

                {erro && (
                    <div className="publicacao-modal-erro">
                        {erro}
                    </div>
                )}

                {carregando ? (
                    <div className="publicacao-modal-loading">
                        Carregando...
                    </div>
                ) : (
                    <form
                        className="publicacao-modal-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="publicacao-modal-campo">

                            <label htmlFor="categoria_id">
                                Categoria
                            </label>

                            <select
                                id="categoria_id"
                                name="categoria_id"
                                value={
                                    formulario.categoria_id
                                }
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Selecione uma categoria
                                </option>

                                {categorias.map(
                                    (categoria) => (
                                        <option
                                            key={
                                                categoria.id
                                            }
                                            value={
                                                categoria.id
                                            }
                                        >
                                            {
                                                categoria.nome
                                            }
                                        </option>
                                    )
                                )}
                            </select>

                        </div>

                        <div className="publicacao-modal-campo">

                            <label htmlFor="titulo">
                                Título
                            </label>

                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                value={
                                    formulario.titulo
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Ex.: Instalação elétrica"
                                maxLength={255}
                                required
                            />

                        </div>

                        <div className="publicacao-modal-campo">

                            <label htmlFor="descricao">
                                Descrição
                            </label>

                            <textarea
                                id="descricao"
                                name="descricao"
                                value={
                                    formulario.descricao
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Descreva o serviço..."
                                rows={5}
                                required
                            />

                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="valor_estimado">
                                    Valor estimado
                                </label>

                                <input
                                    id="valor_estimado"
                                    name="valor_estimado"
                                    type="number"
                                    value={
                                        formulario.valor_estimado
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="0,00"
                                    min="0"
                                    step="0.01"
                                />

                            </div>

                            <div className="publicacao-modal-campo">

                                <label htmlFor="data_inicio">
                                    Data de início
                                </label>

                                <input
                                    id="data_inicio"
                                    name="data_inicio"
                                    type="date"
                                    value={
                                        formulario.data_inicio
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="cidade">
                                    Cidade
                                </label>

                                <input
                                    id="cidade"
                                    name="cidade"
                                    type="text"
                                    value={
                                        formulario.cidade
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Ex.: Rio do Sul"
                                    maxLength={255}
                                    required
                                />

                            </div>

                            <div className="publicacao-modal-campo">

                                <label htmlFor="estado">
                                    Estado
                                </label>

                                <input
                                    id="estado"
                                    name="estado"
                                    type="text"
                                    value={
                                        formulario.estado
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="SC"
                                    maxLength={2}
                                    required
                                />

                            </div>

                        </div>

                        <div className="publicacao-modal-campo">

                            <label htmlFor="endereco_servico">
                                Endereço do serviço
                            </label>

                            <input
                                id="endereco_servico"
                                name="endereco_servico"
                                type="text"
                                value={
                                    formulario.endereco_servico
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Rua, número, bairro..."
                                maxLength={255}
                            />

                        </div>

                        <div className="publicacao-modal-grid">

                            <div className="publicacao-modal-campo">

                                <label htmlFor="horario_inicio">
                                    Horário de início
                                </label>

                                <input
                                    id="horario_inicio"
                                    name="horario_inicio"
                                    type="time"
                                    value={
                                        formulario.horario_inicio
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                            <div className="publicacao-modal-campo">

                                <label htmlFor="data_fim">
                                    Data de término
                                </label>

                                <input
                                    id="data_fim"
                                    name="data_fim"
                                    type="date"
                                    value={
                                        formulario.data_fim
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </div>

                        <div className="publicacao-modal-acoes">

                            <button
                                type="button"
                                className="publicacao-modal-btn-cancelar"
                                onClick={onClose}
                                disabled={salvando}
                            >
                                Fechar
                            </button>

                            <button
                                type="submit"
                                className="publicacao-modal-btn-salvar"
                                disabled={salvando}
                            >
                                {salvando
                                    ? 'Salvando...'
                                    : modoEdicao
                                      ? 'Salvar alterações'
                                      : 'Publicar serviço'}
                            </button>

                        </div>

                    </form>
                )}

            </div>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Funções auxiliares
|--------------------------------------------------------------------------
*/

function formatarData(data) {
    if (!data) {
        return '';
    }

    return String(data).substring(0, 10);
}

function obterMensagemErro(
    error,
    mensagemPadrao
) {
    const responseData =
        error?.response?.data;

    if (responseData?.message) {
        return responseData.message;
    }

    if (responseData?.errors) {
        const erros =
            responseData.errors;

        const primeiraChave =
            Object.keys(erros)[0];

        if (
            primeiraChave &&
            Array.isArray(
                erros[primeiraChave]
            ) &&
            erros[primeiraChave].length
        ) {
            return erros[
                primeiraChave
            ][0];
        }
    }

    return mensagemPadrao;
}