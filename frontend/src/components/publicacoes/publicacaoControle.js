import { useEffect, useState } from 'react';

import api from '../../services/api';

import {
    criarPublicacao,
    atualizarPublicacao,
    adicionarAnexoPublicacao,
    getAnexoPublicacao,
} from '../../services/publicacaoService';


/*
|--------------------------------------------------------------------------
| CONFIGURAÇÕES
|--------------------------------------------------------------------------
*/

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


const TIPOS_ARQUIVO_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
];


const MAXIMO_ARQUIVOS = 10;

const TAMANHO_MAXIMO_ARQUIVO =
    100 * 1024 * 1024;


/*
|--------------------------------------------------------------------------
| CARREGAR ANEXO COMO URL
|--------------------------------------------------------------------------
|
| Como os anexos são privados, não podemos simplesmente utilizar
| o caminho do arquivo no <img>, <video> ou <iframe>.
|
| Primeiro buscamos o arquivo através do Axios autenticado,
| recebemos um Blob e transformamos esse Blob em uma URL temporária.
|
*/

export async function carregarAnexoComoUrl(
    publicacaoId,
    anexoId
) {

    try {

        const blob =
            await getAnexoPublicacao(
                publicacaoId,
                anexoId
            );


        if (!blob) {

            return null;

        }


        return URL.createObjectURL(blob);

    } catch (error) {

        console.error(
            'Erro ao carregar anexo:',
            error
        );

        return null;

    }

}


/*
|--------------------------------------------------------------------------
| HOOK PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function usePublicacaoControle({
    publicacao,
    onClose,
    onSaved,
}) {

    /*
     * ================================================================
     * MODO
     * ================================================================
     */

    const modoEdicao =
        Boolean(publicacao);


    /*
     * ================================================================
     * ESTADOS
     * ================================================================
     */

    const [categorias, setCategorias] =
        useState([]);

    const [formulario, setFormulario] =
        useState(formularioInicial);

    const [arquivos, setArquivos] =
        useState([]);

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [erro, setErro] =
        useState('');


    /*
     * ================================================================
     * CARREGAR DADOS DO FORMULÁRIO
     * ================================================================
     */

    useEffect(() => {

        carregarDados();

    }, [publicacao]);


    async function carregarDados() {

        try {

            setCarregando(true);

            setErro('');


            /*
             * ========================================================
             * CATEGORIAS
             * ========================================================
             */

            const responseCategorias =
                await api.get(
                    '/users-categorias/categorias'
                );


            const dadosCategorias =
                responseCategorias.data;


            if (
                Array.isArray(
                    dadosCategorias
                )
            ) {

                setCategorias(
                    dadosCategorias
                );

            } else if (
                Array.isArray(
                    dadosCategorias?.data
                )
            ) {

                setCategorias(
                    dadosCategorias.data
                );

            } else {

                setCategorias([]);

            }


            /*
             * ========================================================
             * EDIÇÃO
             * ========================================================
             */

            if (publicacao) {

                setFormulario({

                    categoria_id:
                        publicacao.categoria_id ??
                        '',

                    titulo:
                        publicacao.titulo ??
                        '',

                    descricao:
                        publicacao.descricao ??
                        '',

                    valor_estimado:
                        publicacao.valor_estimado ??
                        '',

                    cidade:
                        publicacao.cidade ??
                        '',

                    estado:
                        publicacao.estado ??
                        '',

                    endereco_servico:
                        publicacao.endereco_servico ??
                        '',

                    data_inicio:
                        formatarData(
                            publicacao.data_inicio
                        ),

                    horario_inicio:
                        publicacao.horario_inicio ??
                        '',

                    data_fim:
                        formatarData(
                            publicacao.data_fim
                        ),

                });


                /*
                 * Os anexos existentes são carregados pelo
                 * PublicacaoForm.
                 *
                 * Aqui mantemos somente os novos arquivos
                 * selecionados neste formulário.
                 */

                setArquivos([]);

            } else {

                /*
                 * ====================================================
                 * NOVA PUBLICAÇÃO
                 * ====================================================
                 */

                setFormulario({
                    ...formularioInicial,
                });

                setArquivos([]);

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
     * ================================================================
     * ALTERAR CAMPO
     * ================================================================
     */

    function handleChange(event) {

        const {
            name,
            value,
        } = event.target;


        setFormulario(
            (anterior) => ({
                ...anterior,
                [name]: value,
            })
        );

    }


    /*
     * ================================================================
     * ADICIONAR ARQUIVOS
     * ================================================================
     */

    function handleArquivosChange(event) {

        const novosArquivos =
            Array.from(
                event.target.files || []
            );


        if (
            !novosArquivos.length
        ) {

            return;

        }


        setErro('');


        /*
         * ============================================================
         * VALIDAR TIPO
         * ============================================================
         */

        const arquivoInvalido =
            novosArquivos.find(
                (arquivo) =>
                    !TIPOS_ARQUIVO_PERMITIDOS.includes(
                        arquivo.type
                    )
            );


        if (arquivoInvalido) {

            setErro(
                `O arquivo "${arquivoInvalido.name}" não possui um formato permitido.`
            );

            event.target.value = '';

            return;

        }


        /*
         * ============================================================
         * VALIDAR TAMANHO
         * ============================================================
         */

        const arquivoGrande =
            novosArquivos.find(
                (arquivo) =>
                    arquivo.size >
                    TAMANHO_MAXIMO_ARQUIVO
            );


        if (arquivoGrande) {

            setErro(
                `O arquivo "${arquivoGrande.name}" ultrapassa o limite de 100 MB.`
            );

            event.target.value = '';

            return;

        }


        /*
         * ============================================================
         * ADICIONAR À LISTA
         * ============================================================
         */

        setArquivos(
            (anteriores) => {

                const quantidadeDisponivel =
                    MAXIMO_ARQUIVOS -
                    anteriores.length;


                if (
                    quantidadeDisponivel <= 0
                ) {

                    setErro(
                        'Você pode adicionar no máximo 10 arquivos.'
                    );

                    return anteriores;

                }


                const arquivosParaAdicionar =
                    novosArquivos.slice(
                        0,
                        quantidadeDisponivel
                    );


                if (
                    novosArquivos.length >
                    quantidadeDisponivel
                ) {

                    setErro(
                        'Você pode adicionar no máximo 10 arquivos.'
                    );

                }


                return [
                    ...anteriores,
                    ...arquivosParaAdicionar,
                ];

            }
        );


        /*
         * Permite selecionar novamente o mesmo arquivo.
         */

        event.target.value = '';

    }


    /*
     * ================================================================
     * REMOVER ARQUIVO NOVO
     * ================================================================
     */

    function removerArquivo(index) {

        setArquivos(
            (anteriores) =>
                anteriores.filter(
                    (_, indice) =>
                        indice !== index
                )
        );


        setErro('');

    }


    /*
     * ================================================================
     * SALVAR
     * ================================================================
     */

    async function handleSubmit(event) {

        event.preventDefault();

        setErro('');


        /*
         * ============================================================
         * VALIDAÇÕES
         * ============================================================
         */

        if (
            !formulario.categoria_id
        ) {

            setErro(
                'Selecione uma categoria.'
            );

            return;

        }


        if (
            !formulario.titulo.trim()
        ) {

            setErro(
                'Informe o título da publicação.'
            );

            return;

        }


        if (
            !formulario.descricao.trim()
        ) {

            setErro(
                'Informe a descrição da publicação.'
            );

            return;

        }


        if (
            !formulario.cidade.trim()
        ) {

            setErro(
                'Informe a cidade.'
            );

            return;

        }


        if (
            !formulario.estado.trim()
        ) {

            setErro(
                'Informe o estado.'
            );

            return;

        }


        try {

            setSalvando(true);


            /*
             * ========================================================
             * DADOS DA PUBLICAÇÃO
             * ========================================================
             */

            const dados = {

                categoria_id:
                    formulario.categoria_id,

                titulo:
                    formulario.titulo.trim(),

                descricao:
                    formulario.descricao.trim(),

                valor_estimado:
                    formulario.valor_estimado !== ''
                        ? formulario.valor_estimado
                        : null,

                cidade:
                    formulario.cidade.trim(),

                estado:
                    formulario.estado.trim(),

                endereco_servico:
                    formulario.endereco_servico?.trim() ||
                    null,

                data_inicio:
                    formulario.data_inicio ||
                    null,

                horario_inicio:
                    formulario.horario_inicio ||
                    null,

                data_fim:
                    formulario.data_fim ||
                    null,

            };


            /*
             * ========================================================
             * SALVAR PUBLICAÇÃO
             * ========================================================
             */

            let publicacaoId;

            let response;


            if (!modoEdicao) {

                /*
                 * ====================================================
                 * NOVA PUBLICAÇÃO
                 * ====================================================
                 */

                console.log(
                    'Criando publicação...'
                );


                response =
                    await criarPublicacao(
                        dados
                    );


                console.log(
                    'Resposta criação publicação:',
                    response
                );


                /*
                 * O service pode retornar:
                 *
                 * { id: 1 }
                 *
                 * ou:
                 *
                 * { data: { id: 1 } }
                 *
                 * ou:
                 *
                 * { data: { data: { id: 1 } } }
                 */

                publicacaoId =
                    response?.id ??
                    response?.data?.id ??
                    response?.data?.data?.id;


                if (!publicacaoId) {

                    console.error(
                        'Resposta inesperada ao criar publicação:',
                        response
                    );

                    throw new Error(
                        'A publicação foi criada, mas não foi possível identificar o ID.'
                    );

                }

            } else {

                /*
                 * ====================================================
                 * EDITAR PUBLICAÇÃO
                 * ====================================================
                 */

                console.log(
                    'Atualizando publicação:',
                    publicacao.id
                );


                response =
                    await atualizarPublicacao(
                        publicacao.id,
                        dados
                    );


                console.log(
                    'Resposta atualização publicação:',
                    response
                );


                publicacaoId =
                    publicacao.id;

            }


            /*
             * ========================================================
             * UPLOAD DOS NOVOS ANEXOS
             * ========================================================
             *
             * A publicação é salva primeiro.
             *
             * Depois cada arquivo é enviado separadamente para:
             *
             * POST /publicacoes/{id}/anexos
             *
             */

            if (
                arquivos.length > 0
            ) {

                console.log(
                    `Enviando ${arquivos.length} anexo(s)...`
                );


                for (
                    const arquivo of arquivos
                ) {

                    console.log(
                        'Enviando arquivo:',
                        arquivo.name
                    );


                    await adicionarAnexoPublicacao(
                        publicacaoId,
                        arquivo
                    );


                    console.log(
                        'Arquivo enviado:',
                        arquivo.name
                    );

                }

            }


            /*
             * ========================================================
             * SUCESSO
             * ========================================================
             */

            console.log(
                'Publicação salva com sucesso.'
            );


            /*
             * Informa ao componente pai.
             *
             * O Contratacoes.jsx será responsável por:
             *
             * 1. recarregar as listas;
             * 2. fechar o modal.
             */

            onSaved?.(
                response?.data ??
                response
            );


            /*
             * Limpa os arquivos novos.
             */

            setArquivos([]);


            /*
             * NÃO chamamos onClose() aqui.
             *
             * O onSaved do componente pai já controla
             * o fechamento do modal.
             */

        } catch (error) {

            console.error(
                'Erro ao salvar publicação:',
                error
            );


            setErro(
                obterMensagemErro(
                    error,
                    'Não foi possível salvar a publicação.'
                )
            );

        } finally {

            setSalvando(false);

        }

    }


    /*
     * ================================================================
     * FECHAR
     * ================================================================
     */

    function fechar() {

        if (
            salvando
        ) {

            return;

        }


        onClose?.();

    }


    /*
     * ================================================================
     * RETORNO
     * ================================================================
     */

    return {

        modoEdicao,

        categorias,

        formulario,

        arquivos,

        carregando,

        salvando,

        erro,

        handleChange,

        handleArquivosChange,

        removerArquivo,

        handleSubmit,

        fechar,

    };

}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function formatarData(data) {

    if (!data) {

        return '';

    }


    /*
     * Já está no formato YYYY-MM-DD.
     */

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            data
        )
    ) {

        return data;

    }


    /*
     * Laravel pode retornar:
     *
     * 2026-09-23T00:00:00.000000Z
     */

    return String(data)
        .substring(0, 10);

}


function obterMensagemErro(
    error,
    mensagemPadrao
) {

    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        mensagemPadrao
    );

}