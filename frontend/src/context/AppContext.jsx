import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [resumen, setResumen] = useState(null);
    const [provincias, setProvincias] = useState([]);
    const [infoModelo, setInfoModelo] = useState(null);
    const [nombreProvSeleccionada, setNombreProvSeleccionada] = useState('TODAS LAS PROVINCIAS');
    const [detalleProvSeleccionada, setDetalleProvSeleccionada] = useState(null);
    
    // Estado de impacto de gestión
    const [impactoGestion, setImpactoGestion] = useState(null);
    const [cargandoImpacto, setCargandoImpacto] = useState(false);
    
    // Estado de filtros del mapa
    const [busquedaMapa, setBusquedaMapa] = useState('');
    const [filtroClusterMapa, setFiltroClusterMapa] = useState('todos');

    // Carga de datos iniciales
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                const [resumenRes, provinciasRes, infoModeloRes] = await Promise.all([
                    api.get('/resumen/'),
                    api.get('/provincias/'),
                    api.get('/modelo/')
                ]);
                setResumen(resumenRes.data);
                setProvincias(provinciasRes.data);
                setInfoModelo(infoModeloRes.data);
            } catch (error) {
                console.error("Error cargando los datos iniciales de la API:", error);
            }
        };
        cargarDatosIniciales();
    }, []);

    // Carga de detalles de provincia bajo demanda
    useEffect(() => {
        const cargarDetalleProvincia = async () => {
            if (!nombreProvSeleccionada) return;
            try {
                const respuesta = await api.get(`/provincias/${encodeURIComponent(nombreProvSeleccionada)}/`);
                setDetalleProvSeleccionada(respuesta.data);
            } catch (error) {
                console.error(`Error cargando el detalle de la provincia ${nombreProvSeleccionada}:`, error);
            }
        };
        cargarDetalleProvincia();
    }, [nombreProvSeleccionada]);

    // Cargar impacto de gestión bajo demanda
    const cargarImpactoGestion = async () => {
        if (impactoGestion) return;
        setCargandoImpacto(true);
        try {
            const respuesta = await api.get('/impacto-gestion/');
            setImpactoGestion(respuesta.data);
        } catch (error) {
            console.error("Error cargando los datos de impacto de gestión:", error);
        } finally {
            setCargandoImpacto(false);
        }
    };

    return (
        <AppContext.Provider value={{
            resumen,
            setResumen,
            provincias,
            setProvincias,
            infoModelo,
            setInfoModelo,
            nombreProvSeleccionada,
            setNombreProvSeleccionada,
            detalleProvSeleccionada,
            setDetalleProvSeleccionada,
            impactoGestion,
            setImpactoGestion,
            cargandoImpacto,
            setCargandoImpacto,
            busquedaMapa,
            setBusquedaMapa,
            filtroClusterMapa,
            setFiltroClusterMapa,
            cargarImpactoGestion
        }}>
            {children}
        </AppContext.Provider>
    );
};
export default AppProvider;
