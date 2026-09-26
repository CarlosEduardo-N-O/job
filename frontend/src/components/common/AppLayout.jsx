import { Outlet } from 'react-router-dom';

import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AppLayout() {
    return (
        <div className="app-container">
            <TopBar />

            <main className="app-content">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
}