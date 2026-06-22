import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Activity, Map, TrendingUp, BarChart2, FileText } from 'lucide-react';

const Header = () => {

    const estiloNavLink = {
        textDecoration: 'none'
    };

    return (
        <header>
            <div className="brand">
                <div className="brand-text">
                    <h1>SNM-DA</h1>
                    <p>Sistema Nacional de Monitoreo del Delito Automotor</p>
                </div>
            </div>
            <nav>
                <NavLink style={estiloNavLink} to="/portada" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <BookOpen size={16} /> Portada
                </NavLink>
                <NavLink style={estiloNavLink} to="/dashboard" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <Activity size={16} /> Panel de Control
                </NavLink>
                <NavLink style={estiloNavLink} to="/mapa" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <Map size={16} /> Mapa de Alertas
                </NavLink>
                <NavLink style={estiloNavLink} to="/tendencias" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <TrendingUp size={16} /> Tendencias
                </NavLink>
                <NavLink style={estiloNavLink} to="/impacto" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <Activity size={16} /> Impacto de Gestión
                </NavLink>
                <NavLink style={estiloNavLink} to="/clustering" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <BarChart2 size={16} /> Clustering K-Means
                </NavLink>
                <NavLink style={estiloNavLink} to="/conclusion" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
                    <FileText size={16} /> Conclusión
                </NavLink>
            </nav>
        </header>
    );
};

export default Header;
