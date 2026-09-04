import { NavLink } from 'react-router-dom';

function HomeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" />
        </svg>
    );
}

function WorkIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect
                x="3"
                y="7"
                width="18"
                height="13"
                rx="2"
            />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 12h18" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
        </svg>
    );
}

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/"
                end
                className={({ isActive }) =>
                    isActive ? 'nav-item active' : 'nav-item'
                }
            >
                <HomeIcon />
                <span>Home</span>
            </NavLink>

            <NavLink
                to="/trabalhos"
                className={({ isActive }) =>
                    isActive ? 'nav-item active' : 'nav-item'
                }
            >
                <WorkIcon />
                <span>Trabalhos</span>
            </NavLink>

            <NavLink
                to="/perfil"
                className={({ isActive }) =>
                    isActive ? 'nav-item active' : 'nav-item'
                }
            >
                <UserIcon />
                <span>Perfil</span>
            </NavLink>
        </nav>
    );
}