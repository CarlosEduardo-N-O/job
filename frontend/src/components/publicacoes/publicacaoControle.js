import { useEffect, useState } from 'react';

import api from '../../services/api';

import {
    criarPublicacao,
    atualizarPublicacao,
} from '../../services/publicacaoService';

const formularioInicial = {
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
};

export default function usePublicacaoControle({
    publicacao,
    onClose,
    onSaved,
}) {
    const modoEdicao = Boolean(publicacao);

    const [categorias, setCategorias] = useState([]);

    const [formulario, setFormulario] = useState(
        formularioInicial
    );

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        carregarDados();
    }, [publicacao]);

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
                Array.isArray(dadosCategorias?.data)
            ) {
                setCategorias(dadosCategorias.data);
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
            } else {
                setFormulario(formularioInicial);
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

    function handleChange(event) {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setErro('');

        if (!formulario.categoria_id) {
            setErro('Selecione uma categoria.');
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

    function fechar() {
        if (salvando) {
            return;
        }

        onClose?.();
    }

    return {
        modoEdicao,
        categorias,
        formulario,
        carregando,
        salvando,
        erro,
        handleChange,
        handleSubmit,
        fechar,
    };
}

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
            return erros[primeiraChave][0];
        }
    }

    return mensagemPadrao;
}