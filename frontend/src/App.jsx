import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';

import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/common/AppLayout';

import Login from './pages/Login';
import Home from './pages/Home';
import Contratacoes from './pages/Contratacoes';
import Trabalhos from './pages/Trabalhos';
import Perfil from './pages/Perfil';

import './styles/app.css';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>

                <Routes>

                    {/* ================================================== */}
                    {/* LOGIN                                              */}
                    {/* ================================================== */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* ================================================== */}
                    {/* ÁREA PROTEGIDA                                     */}
                    {/* ================================================== */}

                    <Route
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >

                        {/* HOME */}
                        <Route
                            index
                            element={<Home />}
                        />

                        {/* CONTRATAÇÕES */}
                        <Route
                            path="contratacoes"
                            element={<Contratacoes />}
                        />

                        {/* TRABALHOS */}
                        <Route
                            path="trabalhos"
                            element={<Trabalhos />}
                        />

                        {/* PERFIL */}
                        <Route
                            path="perfil"
                            element={<Perfil />}
                        />

                    </Route>


                    {/* ================================================== */}
                    {/* ROTA PADRÃO                                         */}
                    {/* ================================================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />

                </Routes>

            </AuthProvider>
        </BrowserRouter>
    );
}