import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import TrabalhoCard from './TrabalhoCard';

import {
    getMeusTrabalhos,
} from '../../services/trabalhoService';

import '../../styles/trabalhos.css';


export default function Trabalhos({
    trabalhos: trabalhosExternos = null,
    papel = 'CONTRATADO',
    onAtualizado: onAtualizadoExterno,
}) {

    const usandoDadosExternos =
        Array.isArray(trabalhosExternos);


    const [trabalhosInternos, setTrabalhosInternos] =
        useState([]);

    const [carregando, setCarregando] =
        useState(!usandoDadosExternos);

    const [mensagemErro, setMensagemErro] =
        useState('');


    /*
     * =========================================================
     * NORMALIZAR RESPOSTA
     * =========================================================
     */

    function normalizarTrabalhos(dados) {

        let resultado = dados;

        /*
         * Caso seja:
         *
         * {
         *     data: [...]
         * }
         */

        if (
            resultado &&
            !Array.isArray(resultado) &&
            Array.isArray(resultado.data)
        ) {
            resultado = resultado.data;
        }

        /*
         * Caso venha:
         *
         * {
         *     data: {
         *         data: [...]
         *     }
         * }
         */

        if (
            resultado &&
            !Array.isArray(resultado) &&
            resultado.data &&
            Array.isArray(resultado.data.data)
        ) {
            resultado = resultado.data.data;
        }

        return Array.isArray(resultado)
            ? resultado
            : [];
    }


    /*
     * =========================================================
     * CARREGAR TRABALHOS DO CONTRATADO
     * =========================================================
     */

    const carregarTrabalhos = useCallback(
        async () => {

            /*
             * Quando Trabalhos recebe os dados
             * de Contratacoes.jsx, não deve chamar
             * /trabalhos/meus.
             */

            if (usandoDadosExternos) {
                return;
            }

            try {

                setCarregando(true);
                setMensagemErro('');

                const response =
                    await getMeusTrabalhos();

                const dados =
                    normalizarTrabalhos(response);

                setTrabalhosInternos(dados);

            } catch (error) {

                console.error(
                    'Erro ao carregar trabalhos:',
                    error
                );

                setMensagemErro(
                    error?.response?.data?.message ||
                    Object.values(
                        error?.response?.data?.errors || {}
                    ).flat()[0] ||
                    'Não foi possível carregar seus trabalhos.'
                );

            } finally {

                setCarregando(false);

            }

        },
        [usandoDadosExternos]
    );


    /*
     * =========================================================
     * CARREGAR QUANDO FOR PÁGINA NORMAL
     * =========================================================
     */

    useEffect(() => {

        if (!usandoDadosExternos) {
            carregarTrabalhos();
        }

    }, [
        usandoDadosExternos,
        carregarTrabalhos,
    ]);


    /*
     * =========================================================
     * DADOS QUE SERÃO EXIBIDOS
     * =========================================================
     */

    const trabalhos =
        usandoDadosExternos
            ? normalizarTrabalhos(trabalhosExternos)
            : trabalhosInternos;


    /*
     * =========================================================
     * ATUALIZAR
     * =========================================================
     */

    async function atualizarDepoisDeAcao() {

        if (onAtualizadoExterno) {
            await onAtualizadoExterno();
            return;
        }

        await carregarTrabalhos();
    }


    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (carregando) {

        return (
            <section className="trabalhos">

                <div className="trabalhos-carregando">
                    Carregando trabalhos...
                </div>

            </section>
        );
    }


    /*
     * =========================================================
     * ERRO
     * =========================================================
     */

    if (mensagemErro) {

        return (
            <section className="trabalhos">

                <div className="trabalhos-erro">

                    <strong>
                        Não foi possível carregar os trabalhos.
                    </strong>

                    <p>
                        {mensagemErro}
                    </p>

                    <button
                        type="button"
                        onClick={
                            carregarTrabalhos
                        }
                    >
                        Tentar novamente
                    </button>

                </div>

            </section>
        );
    }


    /*
     * =========================================================
     * LISTA
     * =========================================================
     */

    return (
        <section className="trabalhos">

            {trabalhos.length === 0 ? (

                <div className="trabalhos-vazio">

                    <div className="trabalhos-vazio-icone">
                        💼
                    </div>

                    <h3>
                        Nenhum trabalho encontrado
                    </h3>

                    <p>
                        Os trabalhos aparecerão aqui
                        quando estiverem disponíveis.
                    </p>

                </div>

            ) : (

                <div className="trabalhos-lista">

                    {trabalhos.map(
                        (trabalho) => (

                            <TrabalhoCard
                                key={
                                    trabalho.id_trabalho ??
                                    trabalho.id
                                }
                                trabalho={trabalho}
                                papel={papel}
                                onAtualizado={
                                    atualizarDepoisDeAcao
                                }
                            />

                        )
                    )}

                </div>

            )}

        </section>
    );
}