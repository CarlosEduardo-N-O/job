import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Perfil from './Perfil';

export default function AppLayout() {
    const [perfilAberto, setPerfilAberto] = useState(false);

    useEffect(() => {
        /*
         * =====================================================
         * ABRIR PERFIL
         * =====================================================
         */

        function abrirPerfil() {
            console.log(
                '[APP LAYOUT] Abrindo modal de perfil.'
            );

            setPerfilAberto(true);
        }

        /*
         * =====================================================
         * FECHAR PERFIL
         * =====================================================
         */

        function fecharPerfil() {
            console.log(
                '[APP LAYOUT] Fechando modal de perfil.'
            );

            setPerfilAberto(false);
        }

        /*
         * =====================================================
         * EVENTOS
         * =====================================================
         */

        window.addEventListener(
            'abrir-modal-perfil',
            abrirPerfil
        );

        window.addEventListener(
            'fechar-modal-perfil',
            fecharPerfil
        );

        /*
         * =====================================================
         * LIMPEZA
         * =====================================================
         */

        return () => {
            window.removeEventListener(
                'abrir-modal-perfil',
                abrirPerfil
            );

            window.removeEventListener(
                'fechar-modal-perfil',
                fecharPerfil
            );
        };
    }, []);

    return (
        <div className="app-container">
            <TopBar />

            <main className="app-content">
                <Outlet />
            </main>

            <BottomNav />

            {perfilAberto && (
                <Perfil
                    onClose={() => {
                        setPerfilAberto(false);
                    }}
                />
            )}
        </div>
    );
}