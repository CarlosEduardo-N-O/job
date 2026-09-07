import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import Home from './pages/Home';
import Contratacoes from './pages/Contratacoes';
import Trabalhos from './pages/Trabalhos';
import Perfil from './pages/Perfil';

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