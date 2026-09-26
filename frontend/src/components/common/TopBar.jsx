import { useState } from 'react';

import Perfil from './Perfil';

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="4"
            />

            <path
                d="M4 21c0-4 3.5-7 8-7s8 3 8 7"
            />
        </svg>
    );
}
 
function NotificationIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            />

            <path
                d="M10 21h4"
            />
        </svg>
    );
}

export default function TopBar() {
    const [
        perfilAberto,
        setPerfilAberto,
    ] = useState(false);

    function abrirPerfil() {
        setPerfilAberto(true);
    }

    function fecharPerfil() {
        setPerfilAberto(false);
    }

    return (
        <>
            <header className="top-bar">
                <div className="top-bar-left">
                    <button
                        type="button"
                        className="top-bar-button"
                        aria-label="Abrir perfil"
                        title="Perfil"
                        onClick={abrirPerfil}
                    >
                        <UserIcon />
                    </button>
                </div>

                <div className="top-bar-right">
                    <button
                        type="button"
                        className="top-bar-button"
                        aria-label="Abrir notificações"
                        title="Notificações"
                    >
                        <NotificationIcon />
                    </button>
                </div>
            </header>

            {perfilAberto && (
                <Perfil
                    onClose={fecharPerfil}
                />
            )}
        </>
    );
}