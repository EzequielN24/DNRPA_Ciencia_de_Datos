import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { AppContext } from '../context/AppContext';
import { formatearNumero } from '../utils/formateadores';

const COORDENADAS_PROVINCIAS = {
    "BUENOS AIRES": [-34.9214, -57.9545],
    "CIUDAD AUTÓNOMA DE BUENOS AIRES": [-34.6037, -58.3816],
    "CÓRDOBA": [-31.4135, -64.1810],
    "SANTA FE": [-31.6333, -60.7000],
    "MENDOZA": [-32.8894, -68.8458],
    "NEUQUÉN": [-38.9516, -68.0591],
    "RÍO NEGRO": [-40.8131, -62.9931],
    "ENTRE RÍOS": [-31.7333, -60.5333],
    "CHUBUT": [-43.3002, -65.1023],
    "CORRIENTES": [-27.4692, -58.8306],
    "TUCUMÁN": [-26.8241, -65.2226],
    "SAN LUIS": [-33.3017, -66.3378],
    "SALTA": [-24.7821, -65.4232],
    "CHACO": [-27.4514, -58.9867],
    "MISIONES": [-27.3671, -55.8961],
    "JUJUY": [-24.1858, -65.2995],
    "SANTA CRUZ": [-51.6230, -69.2163],
    "SANTIAGO DEL ESTERO": [-27.7834, -64.2642],
    "FORMOSA": [-26.1775, -58.1781],
    "LA PAMPA": [-36.6167, -64.2833],
    "TIERRA DEL FUEGO": [-54.8019, -68.3030],
    "SAN JUAN": [-31.5375, -68.5364],
    "CATAMARCA": [-28.4696, -65.7852],
    "LA RIOJA": [-29.4131, -66.8558]
};

const MapaAlertas = () => {
    const navegar = useNavigate();
    const { 
        provincias, 
        busquedaMapa, 
        setBusquedaMapa, 
        filtroClusterMapa, 
        setFiltroClusterMapa,
        setNombreProvSeleccionada
    } = useContext(AppContext);

    const refContenedorMapa = useRef(null);
    const refInstanciaMapa = useRef(null);
    const refMarcadoresMapa = useRef([]);

    // Filtrar provincias para mostrar en el mapa
    const provinciasFiltradas = () => {
        return provincias.filter(provinciaItem => {
            const coincideBusqueda = provinciaItem.provincia.toUpperCase().includes(busquedaMapa.toUpperCase());
            const coincideCluster = filtroClusterMapa === 'todos' || provinciaItem.cluster_nombre === filtroClusterMapa;
            return coincideBusqueda && coincideCluster;
        });
    };

    useEffect(() => {
        if (provincias.length === 0 || !refContenedorMapa.current) {
            return;
        }

        // Inicializar Leaflet map si no está inicializado
        if (!refInstanciaMapa.current) {
            const mapa = L.map(refContenedorMapa.current, {
                zoomControl: true,
                scrollWheelZoom: false
            }).setView([-39.0, -64.0], 4);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapa);

            refInstanciaMapa.current = mapa;
        }

        const mapa = refInstanciaMapa.current;
        mapa.invalidateSize();

        // Limpiar marcadores existentes
        refMarcadoresMapa.current.forEach(m => mapa.removeLayer(m.marker));
        refMarcadoresMapa.current = [];

        // Agregar marcadores circulares para cada provincia filtrada
        provinciasFiltradas().forEach(provinciaItem => {
            const coordenadas = COORDENADAS_PROVINCIAS[provinciaItem.provincia];
            if (coordenadas) {
                const radio = Math.log(provinciaItem.robos + 1) * 3 + 2;

                const marcador = L.circleMarker(coordenadas, {
                    radius: radio,
                    fillColor: provinciaItem.cluster_color,
                    color: provinciaItem.cluster_color,
                    weight: 1.5,
                    opacity: 0.9,
                    fillOpacity: 0.45
                }).addTo(mapa);

                const contenidoPopup = document.createElement('div');
                contenidoPopup.style.minWidth = '220px';
                contenidoPopup.innerHTML = `
                    <h3>${provinciaItem.provincia}</h3>
                    <p><strong>Robos Totales:</strong> ${formatearNumero(provinciaItem.robos)}</p>
                    <p><strong>Recuperos:</strong> ${formatearNumero(provinciaItem.recuperos)}</p>
                    <p><strong>Tasa de Recupero:</strong> ${provinciaItem.tasa_recupero.toFixed(2)}%</p>
                    <p><strong>Tasa de Robo:</strong> ${provinciaItem.tasa_robo.toFixed(2)} (por 100k hab)</p>
                    <p><strong>Categoría de Intervención:</strong> <span class="badge" style="background:${provinciaItem.cluster_color}20; color:${provinciaItem.cluster_color}; border:1px solid ${provinciaItem.cluster_color}50; font-size:0.7rem; font-weight:bold;">${provinciaItem.cluster_nombre.replace("NIVEL DE ", "")}</span></p>
                    <div style="margin-top: 0.6rem; text-align: center;">
                        <button id="map-btn-${provinciaItem.provincia.replace(/\s+/g, '-')}" class="select-input" style="padding: 0.35rem 0.7rem; font-size:0.75rem; cursor:pointer; background:var(--bg-accent); border:none; color:#ffffff; font-weight:bold; border-radius:4px; width:100%;">Ver Evolución Temporal ➔</button>
                    </div>
                `;

                // Configurar acción al clickear en el popup
                marcador.bindPopup(contenidoPopup);
                marcador.on('popupopen', () => {
                    const boton = document.getElementById(`map-btn-${provinciaItem.provincia.replace(/\s+/g, '-')}`);
                    if (boton) {
                        boton.onclick = () => {
                            setNombreProvSeleccionada(provinciaItem.provincia);
                            navegar('/tendencias');
                        };
                    }
                });

                marcador.on('mouseover', function () {
                    this.setStyle({ fillOpacity: 0.9, weight: 2 });
                });
                marcador.on('mouseout', function () {
                    this.setStyle({ fillOpacity: 0.6, weight: 1 });
                });

                refMarcadoresMapa.current.push({
                    provincia: provinciaItem.provincia,
                    cluster: provinciaItem.cluster_nombre,
                    marker: marcador
                });
            }
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provincias, busquedaMapa, filtroClusterMapa]);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (refInstanciaMapa.current) {
                refInstanciaMapa.current.remove();
                refInstanciaMapa.current = null;
            }
        };
    }, []);

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Mapa Federal de Alertas de Seguridad</h2>
                <p>Visualización geográfica interactiva. Los colores representan el nivel de intervención basado en la tasa de recuperación vehicular suavizada (a menor recuperación, mayor prioridad de intervención).</p>
            </div>

            <div className="map-controls">
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Buscar provincia..." 
                    value={busquedaMapa} 
                    onChange={(e) => setBusquedaMapa(e.target.value)} 
                />
                <select 
                    className="select-input" 
                    value={filtroClusterMapa} 
                    onChange={(e) => setFiltroClusterMapa(e.target.value)}
                >
                    <option value="todos">Mostrar todos los Niveles</option>
                    <option value="NIVEL DE INTERVENCIÓN CRÍTICO">Nivel de Intervención Crítico</option>
                    <option value="NIVEL DE EFICIENCIA EN RECUPERO DESTACADA">Nivel de Eficiencia Destacada</option>
                    <option value="NIVEL DE INTERVENCIÓN MODERADO / BAJO">Nivel de Intervención Moderado / Bajo</option>
                </select>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    Clickea en los círculos del mapa para ver el desglose regional detallado.
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0.8rem', marginBottom: '2rem' }}>
                <div id="map" ref={refContenedorMapa}></div>
            </div>
        </div>
    );
};

export default MapaAlertas;
