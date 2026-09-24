import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

import {
    verificarPrimeiroAcesso,
    concluirOnboarding,
} from '../../services/onboardingService';

import '../../styles/onboarding.css';

const ETAPAS = [
    {
        tipo: 'apresentacao',
        titulo: 'Bem-vindo ao JOB!',
        descricao:
            'O JOB conecta pessoas que precisam de serviços com pessoas que podem realizá-los.',
        icone: '👋',
    },
    {
        tipo: 'apresentacao',
        titulo: 'Encontre oportunidades',
        descricao:
            'Veja serviços publicados por outros usuários e encontre oportunidades que combinam com você.',
        icone: '🔎',
    },
    {
        tipo: 'apresentacao',
        titulo: 'Publique um serviço',
        descricao:
            'Precisa de alguém para realizar um serviço? Publique o que você precisa e receba interessados.',
        icone: '📝',
    },
    {
        tipo: 'apresentacao',
        titulo: 'Negocie pelo JOB',
        descricao:
            'Converse, tire dúvidas, envie propostas e combine os detalhes do serviço diretamente pela plataforma.',
        icone: '💬',
    },
    {
        tipo: 'tour',
        rota: '/',
        seletor: '.home-page',
        titulo: 'Home',
        descricao:
            'Na Home você encontra as principais informações e publicações disponíveis no JOB.',
        icone: '🏠',
    },
    {
        tipo: 'tour',
        rota: '/contratacoes',
        seletor: '.contratacoes-page',
        titulo: 'Contratações',
        descricao:
            'Aqui você acompanha suas negociações e contratações de serviços.',
        icone: '🤝',
    },
    {
        tipo: 'tour',
        rota: '/trabalhos',
        seletor: '.trabalhos-page',
        titulo: 'Trabalhos',
        descricao:
            'Nesta área ficam os trabalhos que foram contratados e que estão em andamento ou concluídos.',
        icone: '🛠️',
    },
    {
        tipo: 'tour',
        rota: '/perfil',
        seletor: '.profile-page',
        titulo: 'Perfil',
        descricao:
            'No seu perfil você pode consultar e administrar suas informações.',
        icone: '👤',
    },
];

export default function Onboarding() {
    const navigate = useNavigate();
    const location = useLocation();

    const { isAuthenticated } = useAuth();

    const [ativo, setAtivo] = useState(false);
    const [etapaAtual, setEtapaAtual] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [finalizando, setFinalizando] = useState(false);
    const [alvo, setAlvo] = useState(null);

    /*
     * Guarda se o componente ainda está montado.
     */
    const montadoRef = useRef(true);

    /*
     * Evita que a verificação de primeiro acesso
     * seja executada várias vezes ao mesmo tempo.
     */
    const verificandoRef = useRef(false);

    /*
     * Evita chamadas duplicadas para concluir onboarding.
     */
    const finalizandoRef = useRef(false);

    const etapa = ETAPAS[etapaAtual];
    const modoTour = etapa?.tipo === 'tour';

    /*
     * =========================================================
     * MONTAGEM / DESMONTAGEM
     * =========================================================
     */

    useEffect(() => {
        montadoRef.current = true;

        return () => {
            montadoRef.current = false;
        };
    }, []);

    /*
     * =========================================================
     * VERIFICAR PRIMEIRO ACESSO
     * =========================================================
     */

    useEffect(() => {
        let cancelado = false;

        async function verificar() {
            /*
             * Se não estiver autenticado, não devemos
             * consultar o onboarding.
             */
            if (!isAuthenticated) {
                verificandoRef.current = false;

                if (!cancelado && montadoRef.current) {
                    setAtivo(false);
                    setCarregando(false);
                    setFinalizando(false);
                    setEtapaAtual(0);
                    setAlvo(null);
                }

                return;
            }

            /*
             * Evita duas requisições simultâneas.
             */
            if (verificandoRef.current) {
                return;
            }

            verificandoRef.current = true;

            if (!cancelado && montadoRef.current) {
                setCarregando(true);
            }

            try {
                const resultado = await verificarPrimeiroAcesso();

                if (
                    cancelado ||
                    !montadoRef.current
                ) {
                    return;
                }

                /*
                 * O backend pode retornar:
                 *
                 * true
                 * 'S'
                 * 1
                 *
                 * ou eventualmente:
                 *
                 * { primeiro_acesso: true }
                 *
                 * { primeiro_acesso: 'S' }
                 */

                const primeiroAcesso =
                    resultado?.primeiro_acesso === true ||
                    resultado?.primeiro_acesso === 1 ||
                    resultado?.primeiro_acesso === '1' ||
                    resultado?.primeiro_acesso === 'S' ||
                    resultado?.primeiro_acesso === 's';

                console.log(
                    '[ONBOARDING] Primeiro acesso:',
                    resultado
                );

                if (primeiroAcesso) {
                    setEtapaAtual(0);
                    setAlvo(null);
                    setFinalizando(false);
                    setAtivo(true);
                } else {
                    setAtivo(false);
                    setAlvo(null);
                }
            } catch (error) {
                if (
                    cancelado ||
                    !montadoRef.current
                ) {
                    return;
                }

                console.error(
                    '[ONBOARDING] Erro ao verificar primeiro acesso:',
                    error
                );

                setAtivo(false);
                setAlvo(null);
            } finally {
                verificandoRef.current = false;

                if (
                    !cancelado &&
                    montadoRef.current
                ) {
                    setCarregando(false);
                }
            }
        }

        verificar();

        return () => {
            cancelado = true;
        };
    }, [isAuthenticated]);

    /*
     * =========================================================
     * TOUR
     * =========================================================
     */

    useEffect(() => {
        if (!ativo || !modoTour || !etapa) {
            setAlvo(null);
            return;
        }

        if (location.pathname !== etapa.rota) {
            setAlvo(null);

            navigate(etapa.rota);

            return;
        }

        let tentativas = 0;
        let timeoutId = null;

        const atualizarAlvo = () => {
            const elemento = document.querySelector(
                etapa.seletor
            );

            if (!elemento) {
                tentativas++;

                if (tentativas < 20) {
                    timeoutId = setTimeout(
                        atualizarAlvo,
                        100
                    );
                }

                return;
            }

            const rect =
                elemento.getBoundingClientRect();

            if (!montadoRef.current) {
                return;
            }

            setAlvo({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });
        };

        const prepararTour = () => {
            const elemento = document.querySelector(
                etapa.seletor
            );

            if (elemento) {
                elemento.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });

                timeoutId = setTimeout(
                    atualizarAlvo,
                    250
                );
            } else {
                atualizarAlvo();
            }
        };

        prepararTour();

        window.addEventListener(
            'resize',
            atualizarAlvo
        );

        window.addEventListener(
            'scroll',
            atualizarAlvo,
            true
        );

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            window.removeEventListener(
                'resize',
                atualizarAlvo
            );

            window.removeEventListener(
                'scroll',
                atualizarAlvo,
                true
            );

            setAlvo(null);
        };
    }, [
        ativo,
        modoTour,
        etapaAtual,
        etapa,
        location.pathname,
        navigate,
    ]);

    /*
     * =========================================================
     * FINALIZAR ONBOARDING
     * =========================================================
     */

    const finalizar = async () => {
        /*
         * Proteção importante:
         *
         * mesmo que algum evento seja disparado duas vezes,
         * somente uma requisição poderá ser executada.
         */
        if (
            finalizando ||
            finalizandoRef.current
        ) {
            return;
        }

        finalizandoRef.current = true;
        setFinalizando(true);

        console.log(
            '[ONBOARDING] Iniciando finalização.'
        );

        try {
            /*
             * A chamada continua sendo feita normalmente.
             *
             * Se a API responder, encerramos o onboarding.
             */
            await concluirOnboarding();

            console.log(
                '[ONBOARDING] Finalização concluída.'
            );

            if (!montadoRef.current) {
                return;
            }

            setAtivo(false);
            setAlvo(null);
            setFinalizando(false);

            finalizandoRef.current = false;

            navigate('/', {
                replace: true,
            });
        } catch (error) {
            console.error(
                '[ONBOARDING] Erro ao concluir onboarding:',
                error
            );

            if (!montadoRef.current) {
                return;
            }

            /*
             * Muito importante:
             *
             * se a API falhar, não deixamos o botão
             * preso eternamente em "Finalizando...".
             */
            setFinalizando(false);
            finalizandoRef.current = false;
        }
    };

    /*
     * =========================================================
     * PRÓXIMA ETAPA
     * =========================================================
     */

    const proximaEtapa = () => {
        if (
            finalizando ||
            finalizandoRef.current
        ) {
            return;
        }

        /*
         * Só chama finalizar quando o usuário realmente
         * estiver na última etapa e clicar no botão.
         */
        if (
            etapaAtual ===
            ETAPAS.length - 1
        ) {
            finalizar();
            return;
        }

        setEtapaAtual(
            (atual) => atual + 1
        );
    };

    /*
     * =========================================================
     * ETAPA ANTERIOR
     * =========================================================
     */

    const etapaAnterior = () => {
        if (
            etapaAtual === 0 ||
            finalizando ||
            finalizandoRef.current
        ) {
            return;
        }

        setEtapaAtual(
            (atual) => atual - 1
        );
    };

    /*
     * =========================================================
     * PULAR
     * =========================================================
     */

    const pular = () => {
        if (
            finalizando ||
            finalizandoRef.current
        ) {
            return;
        }

        finalizar();
    };

    /*
     * =========================================================
     * NÃO RENDERIZA
     * =========================================================
     */

    if (
        carregando ||
        !ativo ||
        !etapa
    ) {
        return null;
    }

    /*
     * =========================================================
     * POSIÇÃO DO DESTAQUE
     * =========================================================
     */

    const estiloAlvo = alvo
        ? {
              top: `${alvo.top - 6}px`,
              left: `${alvo.left - 6}px`,
              width: `${alvo.width + 12}px`,
              height: `${alvo.height + 12}px`,
          }
        : {};

    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (
        <div
            className={`onboarding-overlay ${
                modoTour
                    ? 'onboarding-overlay-tour'
                    : 'onboarding-overlay-apresentacao'
            }`}
        >
            {modoTour && alvo && (
                <div
                    className="onboarding-highlight"
                    style={estiloAlvo}
                />
            )}

            <div
                className={`onboarding-card ${
                    modoTour
                        ? 'onboarding-card-tour'
                        : 'onboarding-card-apresentacao'
                }`}
            >
                <button
                    type="button"
                    className="onboarding-close"
                    onClick={pular}
                    disabled={finalizando}
                    aria-label="Pular apresentação"
                >
                    ×
                </button>

                <div className="onboarding-icon">
                    {etapa.icone}
                </div>

                <div className="onboarding-progress">
                    {etapaAtual + 1} de {ETAPAS.length}
                </div>

                <h2>
                    {etapa.titulo}
                </h2>

                <p>
                    {etapa.descricao}
                </p>

                <div className="onboarding-dots">
                    {ETAPAS.map(
                        (_, index) => (
                            <span
                                key={index}
                                className={
                                    index ===
                                    etapaAtual
                                        ? 'active'
                                        : ''
                                }
                            />
                        )
                    )}
                </div>

                <div className="onboarding-actions">
                    {etapaAtual > 0 ? (
                        <button
                            type="button"
                            className="onboarding-button secondary"
                            onClick={etapaAnterior}
                            disabled={finalizando}
                        >
                            Voltar
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="onboarding-button secondary"
                            onClick={pular}
                            disabled={finalizando}
                        >
                            Pular
                        </button>
                    )}

                    <button
                        type="button"
                        className="onboarding-button primary"
                        onClick={proximaEtapa}
                        disabled={finalizando}
                    >
                        {finalizando ? (
                            <>
                                <span className="onboarding-spinner" />
                                Finalizando...
                            </>
                        ) : etapaAtual ===
                          ETAPAS.length - 1 ? (
                            'Começar a usar'
                        ) : (
                            'Próximo'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}