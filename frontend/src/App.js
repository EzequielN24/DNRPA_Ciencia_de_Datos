import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HttpInterceptor from './components/HttpInterceptor';
import Header from './components/Header';
import Portada from './components/Portada';
import Dashboard from './components/Dashboard';
import MapaAlertas from './components/MapaAlertas';
import Tendencias from './components/Tendencias';
import ImpactoGestion from './components/ImpactoGestion';
import Clustering from './components/Clustering';
import './App.css';

function App() {
    return (
        <AppProvider>
            <HttpInterceptor>
                <Router>
                    <div>
                        <Header />
                        <main>
                            <Routes>
                                <Route path="/" element={<Navigate to="/portada" replace />} />
                                <Route path="/portada" element={<Portada />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/mapa" element={<MapaAlertas />} />
                                <Route path="/tendencias" element={<Tendencias />} />
                                <Route path="/impacto" element={<ImpactoGestion />} />
                                <Route path="/clustering" element={<Clustering />} />
                                <Route path="*" element={<Navigate to="/portada" replace />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </HttpInterceptor>
        </AppProvider>
    );
}

export default App;
