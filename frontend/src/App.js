import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { Shield, Activity, Map, TrendingUp, BarChart2, BookOpen } from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

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

// Formatting helper
const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatPeriodo = (per) => {
    const perStr = per.toString();
    if (perStr.length === 6) {
        return `${perStr.substring(0, 4)}-${perStr.substring(4, 6)}`;
    }
    return perStr;
};

function App() {
    const [activeTab, setActiveTab] = useState('tab-portada');
    const [summary, setSummary] = useState(null);
    const [provinces, setProvinces] = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [selectedProvDetail, setSelectedProvDetail] = useState(null);
    const [selectedProvName, setSelectedProvName] = useState('TODAS LAS PROVINCIAS');
    
    // Management impact state
    const [managementImpact, setManagementImpact] = useState(null);
    const [loadingImpact, setLoadingImpact] = useState(false);
    
    // Map filtering state
    const [mapSearch, setMapSearch] = useState('');
    const [mapFilterCluster, setMapFilterCluster] = useState('todos');

    // Refs for Map & Charts
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const mapMarkersRef = useRef([]);

    const scatterChartRef = useRef(null);
    const scatterInstanceRef = useRef(null);

    const doughnutChartRef = useRef(null);
    const doughnutInstanceRef = useRef(null);

    const nationalLineChartRef = useRef(null);
    const nationalLineInstanceRef = useRef(null);

    const provLineChartRef = useRef(null);
    const provLineInstanceRef = useRef(null);

    const impactBarChartRef = useRef(null);
    const impactBarInstanceRef = useRef(null);

    const impactTimelineChartRef = useRef(null);
    const impactTimelineInstanceRef = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryRes = await fetch(`${API_BASE}/summary/`);
                const summaryData = await summaryRes.json();
                setSummary(summaryData);

                const provincesRes = await fetch(`${API_BASE}/provinces/`);
                const provincesData = await provincesRes.json();
                setProvinces(provincesData);

                const modelInfoRes = await fetch(`${API_BASE}/model-info/`);
                const modelInfoData = await modelInfoRes.json();
                setModelInfo(modelInfoData);
            } catch (err) {
                console.error("Error fetching initial API data:", err);
            }
        };
        fetchData();
    }, []);

    // On-demand fetch for selected province details (timeseries)
    useEffect(() => {
        const fetchProvDetail = async () => {
            if (!selectedProvName) return;
            try {
                const res = await fetch(`${API_BASE}/provinces/${encodeURIComponent(selectedProvName)}/`);
                const data = await res.json();
                setSelectedProvDetail(data);
            } catch (err) {
                console.error(`Error fetching detail for province ${selectedProvName}:`, err);
            }
        };
        fetchProvDetail();
    }, [selectedProvName]);

    // Handle Map Rendering
    useEffect(() => {
        if (activeTab !== 'tab-mapa' || provinces.length === 0 || !mapContainerRef.current) {
            // Clean up map instance when navigating away from the map tab
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            return;
        }

        // Initialize Leaflet map if not initialized
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                zoomControl: true,
                scrollWheelZoom: false
            }).setView([-39.0, -64.0], 4);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        map.invalidateSize();

        // Clear existing markers
        mapMarkersRef.current.forEach(m => map.removeLayer(m.marker));
        mapMarkersRef.current = [];

        // Add circle markers for each province
        provinciasFiltradas().forEach(prov => {
            const coords = COORDENADAS_PROVINCIAS[prov.provincia];
            if (coords) {
                const radius = Math.log(prov.robos + 1) * 3 + 2;

                const marker = L.circleMarker(coords, {
                    radius: radius,
                    fillColor: prov.cluster_color,
                    color: '#ffffff',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(map);

                const popupContent = document.createElement('div');
                popupContent.style.minWidth = '220px';
                popupContent.innerHTML = `
                    <h3>${prov.provincia}</h3>
                    <p><strong>Robos Totales:</strong> ${formatNumber(prov.robos)}</p>
                    <p><strong>Recuperos:</strong> ${formatNumber(prov.recuperos)}</p>
                    <p><strong>Tasa de Recupero:</strong> ${prov.tasa_recupero.toFixed(2)}%</p>
                    <p><strong>Tasa de Robo:</strong> ${prov.tasa_robo.toFixed(2)} (por 100k hab)</p>
                    <p><strong>Categoría de Intervención:</strong> <span class="badge" style="background:${prov.cluster_color}20; color:${prov.cluster_color}; border:1px solid ${prov.cluster_color}50; font-size:0.7rem; font-weight:bold;">${prov.cluster_nombre.replace("NIVEL DE ", "")}</span></p>
                    <div style="margin-top: 0.6rem; text-align: center;">
                        <button id="map-btn-${prov.provincia.replace(/\s+/g, '-')}" class="select-input" style="padding: 0.35rem 0.7rem; font-size:0.75rem; cursor:pointer; background:var(--bg-accent); border:none; color:#0b132b; font-weight:bold; border-radius:4px; width:100%;">Ver Evolución Temporal ➔</button>
                    </div>
                `;

                // Set click action in popup
                marker.bindPopup(popupContent);
                marker.on('popupopen', () => {
                    const btn = document.getElementById(`map-btn-${prov.provincia.replace(/\s+/g, '-')}`);
                    if (btn) {
                        btn.onclick = () => {
                            setSelectedProvName(prov.provincia);
                            setActiveTab('tab-eda');
                        };
                    }
                });

                marker.on('mouseover', function () {
                    this.setStyle({ fillOpacity: 0.9, weight: 2 });
                });
                marker.on('mouseout', function () {
                    this.setStyle({ fillOpacity: 0.6, weight: 1 });
                });

                mapMarkersRef.current.push({
                    provincia: prov.provincia,
                    cluster: prov.cluster_nombre,
                    marker: marker
                });
            }
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, provinces, mapSearch, mapFilterCluster]);

    // Cleanup Map on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // On-demand fetch for management impact data
    useEffect(() => {
        if (activeTab === 'tab-impacto' && !managementImpact) {
            const fetchImpact = async () => {
                setLoadingImpact(true);
                try {
                    const res = await fetch(`${API_BASE}/management-impact/`);
                    const data = await res.json();
                    setManagementImpact(data);
                } catch (err) {
                    console.error("Error fetching management impact data:", err);
                } finally {
                    setLoadingImpact(false);
                }
            };
            fetchImpact();
        }
    }, [activeTab, managementImpact]);

    // Handle Management Impact Charts Rendering
    useEffect(() => {
        if (activeTab === 'tab-impacto' && managementImpact) {
            // 1. Grouped Bar Chart (Volume of Crimes)
            if (impactBarChartRef.current) {
                if (impactBarInstanceRef.current) {
                    impactBarInstanceRef.current.destroy();
                }
                const ctx = impactBarChartRef.current.getContext('2d');
                impactBarInstanceRef.current = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Gestión Anterior (2020-2023)', 'Gestión Actual (2023-2026)'],
                        datasets: [
                            {
                                label: 'Robos Mensuales Promedio',
                                data: [
                                    managementImpact.nacional.periodo_a.robos_mensuales,
                                    managementImpact.nacional.periodo_b.robos_mensuales
                                ],
                                backgroundColor: '#ef233c',
                                borderColor: '#ffffff',
                                borderWidth: 1
                            },
                            {
                                label: 'Recuperos Mensuales Promedio',
                                data: [
                                    managementImpact.nacional.periodo_a.recuperos_mensuales,
                                    managementImpact.nacional.periodo_b.recuperos_mensuales
                                ],
                                backgroundColor: '#2ec4b6',
                                borderColor: '#ffffff',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { color: '#94a3b8', font: { weight: 'bold' } }
                            }
                        },
                        scales: {
                            y: {
                                title: { display: true, text: 'Cantidad Promedio Mensual', color: '#ffffff', font: { weight: 'bold' } },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#94a3b8' }
                            },
                            x: {
                                grid: { color: 'rgba(255, 255, 255, 0.02)' },
                                ticks: { color: '#94a3b8' }
                            }
                        }
                    }
                });
            }



            // 3. National Timeline (National Recovery Rate)
            if (impactTimelineChartRef.current) {
                if (impactTimelineInstanceRef.current) {
                    impactTimelineInstanceRef.current.destroy();
                }
                const ctx = impactTimelineChartRef.current.getContext('2d');
                
                const labels = managementImpact.timeseries.map(h => formatPeriodo(h.periodo));
                const rateData = managementImpact.timeseries.map(h => h.tasa_recupero);
                const rateSmoothedData = managementImpact.timeseries.map(h => h.tasa_recupero_smoothed);
                
                // Custom plugin for drawing the vertical line for Cambio de Gestión
                const verticalLinePlugin = {
                    id: 'verticalLine',
                    afterDraw: (chart) => {
                        const xVal = '2023-12';
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;
                        
                        const labelIndex = chart.data.labels.indexOf(xVal);
                        if (labelIndex !== -1) {
                            const x = xAxis.getPixelForValue(labelIndex);
                            const ctxCanvas = chart.ctx;
                            ctxCanvas.save();
                            
                            // Draw Line
                            ctxCanvas.beginPath();
                            ctxCanvas.moveTo(x, yAxis.top);
                            ctxCanvas.lineTo(x, yAxis.bottom);
                            ctxCanvas.lineWidth = 2;
                            ctxCanvas.strokeStyle = '#ef233c';
                            ctxCanvas.setLineDash([6, 6]);
                            ctxCanvas.stroke();
                            
                            // Draw Label
                            ctxCanvas.fillStyle = '#ef233c';
                            ctxCanvas.font = 'bold 11px Inter, sans-serif';
                            ctxCanvas.textAlign = 'center';
                            ctxCanvas.fillText('Cambio de Gestión', x, yAxis.top - 8);
                            ctxCanvas.restore();
                        }
                    }
                };

                impactTimelineInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Tasa de Recupero Real',
                                data: rateData,
                                borderColor: 'rgba(46, 196, 182, 0.4)',
                                backgroundColor: 'rgba(46, 196, 182, 0.02)',
                                borderWidth: 1.5,
                                pointRadius: 1,
                                tension: 0.2,
                                fill: false
                            },
                            {
                                label: 'Tasa de Recupero Suavizada',
                                data: rateSmoothedData,
                                borderColor: '#ffb703',
                                backgroundColor: 'rgba(255, 183, 3, 0.05)',
                                borderWidth: 2.5,
                                pointRadius: 2,
                                tension: 0.25,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { color: '#94a3b8', font: { weight: 'bold' } }
                            },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            y: {
                                title: { display: true, text: 'Tasa de Recupero (%)', color: '#ffffff', font: { weight: 'bold' } },
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#94a3b8' }
                            },
                            x: {
                                grid: { color: 'rgba(255, 255, 255, 0.02)' },
                                ticks: { maxTicksLimit: 14, color: '#94a3b8' }
                            }
                        }
                    },
                    plugins: [verticalLinePlugin]
                });
            }
        }
    }, [activeTab, managementImpact]);

    // Cleanup impact charts on unmount
    useEffect(() => {
        return () => {
            if (impactBarInstanceRef.current) {
                impactBarInstanceRef.current.destroy();
                impactBarInstanceRef.current = null;
            }
            if (impactTimelineInstanceRef.current) {
                impactTimelineInstanceRef.current.destroy();
                impactTimelineInstanceRef.current = null;
            }
        };
    }, []);

    // Handle Charts Rendering
    useEffect(() => {
        // 1. Scatter Chart (Clustering K-Means)
        if (activeTab === 'tab-clustering' && modelInfo && provinces.length > 0 && scatterChartRef.current) {
            if (scatterInstanceRef.current) {
                scatterInstanceRef.current.destroy();
            }

            const datasets = modelInfo.perfiles_clusters.map(perf => {
                const provsCluster = provinces.filter(p => p.cluster_nombre === perf.nombre);
                return {
                    label: perf.nombre.replace("NIVEL DE ", ""),
                    data: provsCluster.map(p => ({
                        x: p.tasa_recupero_smoothed,
                        y: p.tasa_robo,
                        label: p.provincia
                    })),
                    backgroundColor: perf.color,
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                };
            });

            const ctx = scatterChartRef.current.getContext('2d');
            scatterInstanceRef.current = new Chart(ctx, {
                type: 'scatter',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (ctx) {
                                    const pt = ctx.raw;
                                    return `${pt.label} | Tasa Rec: ${pt.x.toFixed(2)}% | Tasa Robo: ${pt.y.toFixed(2)} (por 100k hab)`;
                                }
                            }
                        },
                        legend: {
                            position: 'top',
                            labels: { boxWidth: 12, font: { weight: 'bold' }, color: '#94a3b8' }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Tasa de Recupero Suavizada (%)', color: '#ffffff', font: { weight: 'bold' } },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        y: {
                            title: { display: true, text: 'Tasa de Robo (por cada 100.000 hab.)', color: '#ffffff', font: { weight: 'bold' } },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }

        // 2. EDA tab: Doughnut & National Line Charts
        if (activeTab === 'tab-eda' && provinces.length > 0) {
            // A. Doughnut (Concentración Geográfica)
            if (doughnutChartRef.current) {
                if (doughnutInstanceRef.current) {
                    doughnutInstanceRef.current.destroy();
                }

                const sortedProvs = [...provinces].sort((a, b) => b.robos - a.robos);
                const top5 = sortedProvs.slice(0, 5);
                const otrosSum = sortedProvs.slice(5).reduce((acc, p) => acc + p.robos, 0);

                const labels = [...top5.map(p => p.provincia), "OTRAS JURISDICCIONES"];
                const data = [...top5.map(p => p.robos), otrosSum];
                const colors = ['#ef233c', '#ff5a5f', '#ffb703', '#ffc857', '#48cae4', 'rgba(255, 255, 255, 0.15)'];

                const ctx = doughnutChartRef.current.getContext('2d');
                doughnutInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels,
                        datasets: [{
                            data,
                            backgroundColor: colors,
                            borderColor: '#0b132b',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }

            // B. National Time Series
            if (nationalLineChartRef.current && selectedProvDetail) {
                if (nationalLineInstanceRef.current) {
                    nationalLineInstanceRef.current.destroy();
                }

                // Compile national monthly statistics from the frontend local details mapping
                // Wait, selectedProvDetail contains full details. To get the national sum, we can aggregate
                // if we had a national endpoint, or we can fetch a static sum. Let's aggregate from the summary
                // or compile it if we had all detail.
                // Actually, let's write a simple aggregation. Since we don't have all historical timelines loaded
                // in provinces array (we excluded it for lightweight listing), we can fetch the national summary
                // or just load the selectProvDetail's timeline for the line chart below.
                // Wait, let's check: the national timeline line chart was originally built by summing up
                // all timelines. In our React API design, we can request `/api/provinces/` which doesn't have it,
                // but we can request a specific national aggregation or we can just aggregate from the detail
                // if we fetch it, or we can simply request the `/api/provinces/BUENOS AIRES/` etc.
                // Wait, how can we display the national timeline?
                // Let's check: did we add a national timeline endpoint or is it in summary?
                // Let's modify the Django backend `get_summary` endpoint to ALSO include the national monthly history!
                // Yes! That is extremely clean! The national monthly history is just ~70 records (one per month from 2020 to 2026),
                // so putting it in `/api/summary/` is perfect and keeps it lightweight!
                // Let's check if the current `resultados_modelo.json` nationals key has the history.
                // In `generar_modelo.py` line 184:
                // `dataset_final = { "nacionales": { ... }, "metricas_modelo": { ... }, ... }`
                // It does NOT have the history.
                // Wait, can we add `historial_temporal` to `nacionales` in `generar_modelo.py`?
                // Yes! In `generar_modelo.py`, we can sum up the timelines of all provinces and save it under `nacionales.historial_temporal`.
                // Let's check: did we already run it? Yes, we ran it, but we can update it or write a backend endpoint that aggregates on the fly,
                // or we can just update the backend view `/api/summary/` to compute the national timeline on the fly by reading `resultados_modelo.json`!
                // This is a beautiful solution! The backend view can compute the national monthly summary by summing up the provincial timelines
                // from `resultados_modelo.json` dynamically and adding it to the `/api/summary/` response! No need to regenerate the model.
                // Let's verify: yes, `load_model_data()` returns the entire JSON, so in `get_summary(request)` in `views.py`,
                // we can read `data.get("provincias")`, sum up the monthly robos and recuperos, and return it.
                // Let's look at how we can do this in the backend later.
            }
        }
    }, [activeTab, modelInfo, provinces, selectedProvDetail]);

    // Handle Province Specific Line Chart Rendering
    useEffect(() => {
        if (activeTab === 'tab-eda' && selectedProvDetail && provLineChartRef.current) {
            if (provLineInstanceRef.current) {
                provLineInstanceRef.current.destroy();
            }

            const historial = selectedProvDetail.historial_temporal;
            const labels = historial.map(h => formatPeriodo(h.periodo));
            const robosData = historial.map(h => h.robos);
            const recuperosData = historial.map(h => h.recuperos);
            const tasaData = historial.map(h => h.tasa_recupero_smoothed);

            const ctx = provLineChartRef.current.getContext('2d');
            provLineInstanceRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Denuncias de Robo',
                            data: robosData,
                            borderColor: '#ef233c',
                            backgroundColor: 'rgba(239, 35, 60, 0.08)',
                            borderWidth: 2,
                            pointRadius: 1.5,
                            tension: 0.25,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Comunicaciones de Recupero',
                            data: recuperosData,
                            borderColor: '#2ec4b6',
                            backgroundColor: 'rgba(46, 196, 182, 0.08)',
                            borderWidth: 2,
                            pointRadius: 1.5,
                            tension: 0.25,
                            fill: false,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Tasa de Recupero Suavizada (%)',
                            data: tasaData,
                            borderColor: '#ffb703',
                            borderWidth: 1.5,
                            pointRadius: 0.5,
                            borderDash: [5, 5],
                            tension: 0.25,
                            fill: false,
                            yAxisID: 'y2'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { boxWidth: 12, font: { size: 10 }, color: '#94a3b8' }
                        },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.02)' },
                            ticks: { maxTicksLimit: 12, font: { size: 9 }, color: '#94a3b8' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Cantidad de Trámites', color: '#ffffff', font: { size: 10, weight: 'bold' } },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { font: { size: 9 }, color: '#94a3b8' }
                        },
                        y2: {
                            type: 'linear',
                            display: false,
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }
    }, [activeTab, selectedProvDetail]);

    // Helper for Map filtering
    const provinciasFiltradas = () => {
        return provinces.filter(prov => {
            const matchQuery = prov.provincia.toUpperCase().includes(mapSearch.toUpperCase());
            const matchCluster = mapFilterCluster === 'todos' || prov.cluster_nombre === mapFilterCluster;
            return matchQuery && matchCluster;
        });
    };

    return (
        <div>
            {/* Header section */}
            <header>
                <div className="brand">
                    <Shield size={36} style={{ color: 'var(--bg-accent)', filter: 'drop-shadow(0 0 4px var(--bg-accent))' }} />
                    <div className="brand-text">
                        <h1>SFM-DA</h1>
                        <p>Sistema Federal de Monitoreo del Delito Automotor</p>
                    </div>
                </div>
                <nav>
                    <button className={`tab-btn ${activeTab === 'tab-portada' ? 'active' : ''}`} onClick={() => setActiveTab('tab-portada')}>
                        <BookOpen size={16} /> Portada
                    </button>
                    <button className={`tab-btn ${activeTab === 'tab-dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('tab-dashboard')}>
                        <Activity size={16} /> Consola de Mando
                    </button>
                    <button className={`tab-btn ${activeTab === 'tab-mapa' ? 'active' : ''}`} onClick={() => setActiveTab('tab-mapa')}>
                        <Map size={16} /> Mapa de Alertas
                    </button>
                    <button className={`tab-btn ${activeTab === 'tab-eda' ? 'active' : ''}`} onClick={() => setActiveTab('tab-eda')}>
                        <TrendingUp size={16} /> Tendencias
                    </button>
                    <button className={`tab-btn ${activeTab === 'tab-impacto' ? 'active' : ''}`} onClick={() => setActiveTab('tab-impacto')}>
                        <Activity size={16} /> Impacto de Gestión
                    </button>
                    <button className={`tab-btn ${activeTab === 'tab-clustering' ? 'active' : ''}`} onClick={() => setActiveTab('tab-clustering')}>
                        <BarChart2 size={16} /> Clustering K-Means
                    </button>
                </nav>
            </header>

            <main>
                {/* PORTADA TAB */}
                {activeTab === 'tab-portada' && (
                    <div className="section-content active">
                        <div className="hero-section">
                            <div className="hero-title-badge">Consola Estratégica Federal</div>
                            <h2>Tablero de Control de Gestión y Priorización del Delito Automotor</h2>
                            <p className="hero-subtitle">
                                Este portal constituye un instrumento de soporte para la toma de decisiones del <strong>Ministerio de Seguridad de la Nación</strong>. Su propósito es mapear geográficamente las tasas de robos y recuperos normalizadas para priorizar estratégicamente la asignación de recursos policiales y logísticos a nivel federal.
                            </p>
                            
                            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', borderRadius: '12px', padding: '2.5rem', textAlign: 'left', boxShadow: 'var(--box-shadow)' }}>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'center' }}>
                                    FICHA TÉCNICA INSTITUCIONAL
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem', fontSize: '1.05rem' }}>
                                    <div>
                                        <p style={{ marginBottom: '0.8rem' }}><strong style={{ color: 'var(--bg-accent)' }}>Organismo Receptor:</strong><br />Ministerio de Seguridad - República Argentina</p>
                                        <p style={{ marginBottom: '0.8rem' }}><strong style={{ color: 'var(--bg-accent)' }}>Integrantes del Grupo Técnico:</strong><br />Ezequiel Bernaldez<br />Ezequiel Nodar</p>
                                    </div>
                                    <div>
                                        <p style={{ marginBottom: '0.8rem' }}><strong style={{ color: 'var(--bg-accent)' }}>Espacio Curricular Académico:</strong><br />Fundamentos de Ciencia de Datos</p>
                                        <p style={{ marginBottom: '0.8rem' }}><strong style={{ color: 'var(--bg-accent)' }}>Período Histórico Analizado:</strong><br />2020 - 2026 (Datos Consolidados DNRPA)</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '3.5rem' }}>
                                <button className="select-input" style={{ background: 'var(--bg-accent)', border: 'none', color: '#0b132b', fontWeight: '800', fontFamily: 'var(--font-heading)', padding: '0.8rem 2rem', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setActiveTab('tab-dashboard')}>
                                    ACCEDER A LA CONSOLA DE MANDO ➔
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONSOLA DE MANDO TAB */}
                {activeTab === 'tab-dashboard' && (
                    <div className="section-content active">
                        <div className="section-header">
                            <h2>Consola Federal de Monitoreo y Asignación de Recursos</h2>
                            <p>Métricas consolidadas e indicadores prioritarios para la planificación del patrullaje y la seguridad interjurisdiccional.</p>
                        </div>

                        {summary && (
                            <div className="kpi-container">
                                <div className="glass-card kpi-card kpi-alert">
                                    <span className="kpi-title">Denuncias de Robo Acumuladas</span>
                                    <span className="kpi-value">{formatNumber(summary.robos_totales)}</span>
                                    <span className="kpi-trend">Registradas a nivel nacional</span>
                                </div>
                                <div className="glass-card kpi-card kpi-success">
                                    <span className="kpi-title">Comunicaciones de Recupero</span>
                                    <span className="kpi-value">{formatNumber(summary.recuperos_totales)}</span>
                                    <span className="kpi-trend">Vehículos recuperados físicamente</span>
                                </div>
                                <div className="glass-card kpi-card kpi-warning">
                                    <span className="kpi-title">Tasa de Recupero Nacional</span>
                                    <span className="kpi-value">{summary.tasa_recupero_promedio.toFixed(2)}%</span>
                                    <span className="kpi-trend">Promedio de efectividad nacional</span>
                                </div>
                                <div className="glass-card kpi-card kpi-info">
                                    <span className="kpi-title">Tasa de Robo Nacional</span>
                                    <span className="kpi-value">{summary.tasa_robo_nacional?.toFixed(1)}</span>
                                    <span className="kpi-trend">Robos por cada 100k hab. (INDEC)</span>
                                </div>
                            </div>
                        )}

                        {/* Ranking Table */}
                        <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                            <div className="card-title">
                                📌 Ranking Federal de Alertas de Seguridad por Criticidad
                            </div>
                            <div className="table-wrapper">
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Jurisdicción</th>
                                            <th>Robos</th>
                                            <th>Recuperos</th>
                                            <th>Tasa Recupero Real</th>
                                            <th>Tasa Recupero Suavizada</th>
                                            <th>Tasa de Robo (100k hab)</th>
                                            <th>Categoría de Intervención</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {provinces.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando registros consolidados...</td>
                                            </tr>
                                        ) : (
                                            [...provinces].sort((a, b) => a.tasa_recupero_smoothed - b.tasa_recupero_smoothed).map(prov => (
                                                <tr key={prov.provincia}>
                                                    <td><strong>{prov.provincia}</strong></td>
                                                    <td>{formatNumber(prov.robos)}</td>
                                                    <td>{formatNumber(prov.recuperos)}</td>
                                                    <td>{prov.tasa_recupero.toFixed(2)}%</td>
                                                    <td>{prov.tasa_recupero_smoothed.toFixed(2)}%</td>
                                                    <td><strong>{prov.tasa_robo.toFixed(1)}</strong></td>
                                                    <td>
                                                        <span className={`badge ${
                                                            prov.cluster_nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO' ? 'badge-critical' :
                                                            prov.cluster_nombre === 'NIVEL DE EFICIENCIA EN RECUPERO DESTACADA' ? 'badge-efficient' : 'badge-moderate'
                                                        }`}>
                                                            {prov.cluster_nombre.replace("NIVEL DE ", "")}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAPA TAB */}
                {activeTab === 'tab-mapa' && (
                    <div className="section-content active">
                        <div className="section-header">
                            <h2>Mapa Federal de Alertas de Seguridad</h2>
                            <p>Visualización geográfica interactiva. Los colores representan el nivel de intervención basado en la tasa de recuperación vehicular suavizada (a menor recuperación, mayor prioridad de intervención).</p>
                        </div>

                        <div className="map-controls">
                            <input type="text" className="search-input" placeholder="Buscar provincia..." value={mapSearch} onChange={(e) => setMapSearch(e.target.value)} />
                            <select className="select-input" value={mapFilterCluster} onChange={(e) => setMapFilterCluster(e.target.value)}>
                                <option value="todos">Mostrar todos los Niveles</option>
                                <option value="NIVEL DE INTERVENCIÓN CRÍTICO">Nivel de Intervención Crítico</option>
                                <option value="NIVEL DE EFICIENCIA EN RECUPERO DESTACADA">Nivel de Eficiencia Destacada</option>
                                <option value="NIVEL DE INTERVENCIÓN MODERADO / BAJO">Nivel de Intervención Moderado / Bajo</option>
                            </select>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                💡 Haz clic en los círculos del mapa para ver el desglose regional detallado.
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '0.8rem', marginBottom: '2rem' }}>
                            <div id="map" ref={mapContainerRef}></div>
                        </div>
                    </div>
                )}

                {/* TENDENCIAS TAB */}
                {activeTab === 'tab-eda' && (
                    <div className="section-content active">
                        <div className="section-header">
                            <h2>Análisis de Tendencias y Series Temporales</h2>
                            <p>Visualizaciones avanzadas sobre la concentración delictiva y la evolución temporal del delito.</p>
                        </div>

                        {/* Interactive Province Explorer */}
                        <div className="glass-card" style={{ marginBottom: '2.5rem', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div className="card-title" style={{ marginBottom: 0 }}>
                                    📈 Serie Temporal Histórica e Indicadores por Jurisdicción
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <label htmlFor="select-prov" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Seleccionar Provincia:</label>
                                    <select id="select-prov" className="select-input" style={{ minWidth: '250px' }} value={selectedProvName} onChange={(e) => setSelectedProvName(e.target.value)}>
                                        <option value="TODAS LAS PROVINCIAS">TODAS LAS PROVINCIAS (CONSOLIDADO FEDERAL)</option>
                                        {[...provinces].sort((a, b) => a.provincia.localeCompare(b.provincia)).map(prov => (
                                            <option key={prov.provincia} value={prov.provincia}>{prov.provincia}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
                                <div style={{ position: 'relative', height: '350px', width: '100%' }}>
                                    <canvas ref={provLineChartRef}></canvas>
                                </div>
                                
                                {selectedProvDetail && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: 'var(--border-glass)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#ffffff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>{selectedProvDetail.provincia}</h4>
                                            <div style={{ fontSize: '0.95rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Robos Totales:</span>
                                                    <strong style={{ fontFamily: 'var(--font-heading)' }}>{formatNumber(selectedProvDetail.robos)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Recuperos Totales:</span>
                                                    <strong style={{ fontFamily: 'var(--font-heading)' }}>{formatNumber(selectedProvDetail.recuperos)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Tasa de Recupero Real:</span>
                                                    <strong style={{ color: 'var(--bg-accent)', fontFamily: 'var(--font-heading)' }}>{selectedProvDetail.tasa_recupero.toFixed(2)}%</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Tasa de Robo (100k):</span>
                                                    <strong style={{ fontFamily: 'var(--font-heading)' }}>{selectedProvDetail.tasa_robo.toFixed(1)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>Marca Más Robada:</span>
                                                    <strong style={{ fontSize: '0.85rem' }}>{selectedProvDetail.marca_lider_robo}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--bg-accent-trans)', borderLeft: '3px solid var(--bg-accent)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            <strong>Categoría de Intervención:</strong> <span className="badge" style={{ background: `${selectedProvDetail.cluster_color}20`, color: selectedProvDetail.cluster_color, border: `1px solid ${selectedProvDetail.cluster_color}50`, fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem', padding: '0.2rem 0.6rem' }}>{selectedProvDetail.cluster_nombre.replace("NIVEL DE ", "")}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Doughnut Chart & Table */}
                        <div className="grid-cards">
                            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div className="card-title">📊 Concentración Geográfica de la Actividad Delictiva</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', height: '260px', width: '100%' }}>
                                            <canvas ref={doughnutChartRef}></canvas>
                                        </div>
                                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                            <table style={{ fontSize: '0.8rem', width: '100%' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Jurisdicción</th>
                                                        <th style={{ textAlign: 'right' }}>% Incidencia</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...provinces].sort((a, b) => b.robos - a.robos).map(prov => {
                                                        const totalRobos = summary?.robos_totales || 1;
                                                        const pct = (prov.robos / totalRobos) * 100;
                                                        return (
                                                            <tr key={prov.provincia}>
                                                                <td><strong>{prov.provincia}</strong></td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                        <span>{pct.toFixed(2)}%</span>
                                                                        <div className="progress-bar-container" style={{ marginTop: 0, width: '40px', height: '5px' }}>
                                                                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: prov.cluster_color }}></div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem', textAlign: 'justify', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                                    La delincuencia automotor en Argentina muestra una alta concentración espacial: tan solo 5 jurisdicciones acumulan más del 97% del volumen delictivo, lideradas por Buenos Aires y CABA.
                                </p>
                            </div>

                            {/* Consolidado temporal nacional */}
                            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div className="card-title">🚗 Detalles Descriptivos de Flotas y Titulares</div>
                                    <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                                        <p style={{ marginBottom: '1rem' }}>
                                            El análisis exploratorio complementario de la DNRPA revela patrones socio-demográficos consistentes:
                                        </p>
                                        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                                            <li style={{ marginBottom: '0.5rem' }}>
                                                <strong>Modelos Predominantes:</strong> La edad modelo promedio de los vehículos sustraídos a nivel nacional es de <strong>14.5 años</strong> (año modelo 2009).
                                            </li>
                                            <li style={{ marginBottom: '0.5rem' }}>
                                                <strong>Marcas Críticas:</strong> Volkswagen, Fiat, Chevrolet y Renault concentran más del 65% de los incidentes de sustracción.
                                            </li>
                                            <li style={{ marginBottom: '0.5rem' }}>
                                                <strong>Perfil de Edad del Propietario:</strong> La franja de propietarios de entre <strong>36 y 45 años</strong> concentra la mayor incidencia de robos registrados.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                                    Estos datos descriptivos ayudan al Ministerio de Seguridad a orientar campañas de concientización y prevención específicas para los sectores más vulnerables de la flota y población.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* IMPACTO DE GESTIÓN TAB */}
                {activeTab === 'tab-impacto' && (
                    <div className="section-content active">
                        <div className="section-header">
                            <h2>Análisis de Impacto de Gestión y Cambio de Gobierno</h2>
                            <p>Estudio temporal comparativo del delito automotor antes y después de la transición de gestión gubernamental (10 de Diciembre de 2023).</p>
                        </div>

                        {loadingImpact && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                Cargando datos de impacto y series temporales...
                            </div>
                        )}

                        {!loadingImpact && managementImpact && (
                            <>
                                {/* Tarjetas de Indicadores Clave de Desempeño */}
                                <div className="kpi-container">
                                    <div className="glass-card kpi-card kpi-alert">
                                        <span className="kpi-title">Robos Mensuales Promedio (Ant)</span>
                                        <span className="kpi-value">{formatNumber(Math.round(managementImpact.nacional.periodo_a.robos_mensuales))}</span>
                                        <span className="kpi-trend">Ene 2020 - Nov 2023</span>
                                    </div>
                                    <div className="glass-card kpi-card kpi-alert" style={{ borderLeft: '4px solid var(--alert-critical)' }}>
                                        <span className="kpi-title">Robos Mensuales Promedio (Act)</span>
                                        <span className="kpi-value">{formatNumber(Math.round(managementImpact.nacional.periodo_b.robos_mensuales))}</span>
                                        <span className="kpi-trend" style={{ color: managementImpact.nacional.diferencias.robos_mensuales > 0 ? 'var(--alert-critical)' : 'var(--alert-efficient)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            {managementImpact.nacional.diferencias.robos_mensuales > 0 ? '▲' : '▼'} {formatNumber(Math.abs(Math.round(managementImpact.nacional.diferencias.robos_mensuales)))} ({((managementImpact.nacional.diferencias.robos_mensuales / managementImpact.nacional.periodo_a.robos_mensuales) * 100).toFixed(1)}%)
                                        </span>
                                    </div>
                                    <div className="glass-card kpi-card kpi-success">
                                        <span className="kpi-title">Tasa de Recupero Promedio (Ant)</span>
                                        <span className="kpi-value">{managementImpact.nacional.periodo_a.tasa_recupero.toFixed(2)}%</span>
                                        <span className="kpi-trend">Efectividad policial</span>
                                    </div>
                                    <div className="glass-card kpi-card kpi-success" style={{ borderLeft: '4px solid var(--alert-efficient)' }}>
                                        <span className="kpi-title">Tasa de Recupero Promedio (Act)</span>
                                        <span className="kpi-value">{managementImpact.nacional.periodo_b.tasa_recupero.toFixed(2)}%</span>
                                        <span className="kpi-trend" style={{ color: managementImpact.nacional.diferencias.tasa_recupero >= 0 ? 'var(--alert-efficient)' : 'var(--alert-critical)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            {managementImpact.nacional.diferencias.tasa_recupero >= 0 ? '▲' : '▼'} {Math.abs(managementImpact.nacional.diferencias.tasa_recupero).toFixed(2)}% (Var. Absoluta)
                                        </span>
                                    </div>
                                </div>

                                {/* Gráficos comparativos */}
                                <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                                    <div className="card-title">📊 Volumen Mensual Promedio de Trámites (Misma Escala)</div>
                                    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                                        <canvas ref={impactBarChartRef}></canvas>
                                    </div>
                                </div>

                                {/* Timeline Line Chart with Hito Marker */}
                                <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                                    <div className="card-title">📈 Evolución Temporal Mensual de la Tasa de Recupero Nacional</div>
                                    <div style={{ position: 'relative', height: '350px', width: '100%' }}>
                                        <canvas ref={impactTimelineChartRef}></canvas>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                                        Línea de hito vertical discontinua demarcando el Cambio de Gestión (Diciembre 2023). Muestra la evolución e impacto sobre las tasas real y suavizada.
                                    </div>
                                </div>

                                {/* Tabla Matriz de Impacto Provincial */}
                                <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                                    <div className="card-title">📌 Matriz de Impacto Provincial y Desempeño Relativo</div>
                                    <div className="table-wrapper">
                                        <table style={{ width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th>Jurisdicción</th>
                                                    <th style={{ textAlign: 'center' }}>Tasa Recupero (Ant)</th>
                                                    <th style={{ textAlign: 'center' }}>Tasa Recupero (Act)</th>
                                                    <th style={{ textAlign: 'center' }}>Variación Absoluta</th>
                                                    <th style={{ textAlign: 'center' }}>Robos Mensuales (Ant)</th>
                                                    <th style={{ textAlign: 'center' }}>Robos Mensuales (Act)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {managementImpact.provincias.map(prov => (
                                                    <tr key={prov.provincia}>
                                                        <td><strong>{prov.provincia}</strong></td>
                                                        <td style={{ textAlign: 'center' }}>{prov.periodo_a.tasa_recupero.toFixed(2)}%</td>
                                                        <td style={{ textAlign: 'center' }}>{prov.periodo_b.tasa_recupero.toFixed(2)}%</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: prov.diferencias.tasa_recupero >= 0 ? 'var(--alert-efficient)' : 'var(--alert-critical)' }}>
                                                            {prov.diferencias.tasa_recupero >= 0 ? '+' : ''}{prov.diferencias.tasa_recupero.toFixed(2)}%
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>{prov.periodo_a.robos_mensuales.toFixed(1)}</td>
                                                        <td style={{ textAlign: 'center' }}>{prov.periodo_b.robos_mensuales.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* CLUSTERING TAB */}
                {activeTab === 'tab-clustering' && modelInfo && (
                    <div className="section-content active">
                        <div className="section-header">
                            <h2>Modelo de Machine Learning: Clustering K-Means</h2>
                            <p>Las provincias se agruparon en 3 perfiles de intervención diferenciados utilizando únicamente la <strong>Tasa de Recupero Suavizada</strong> como variable de agrupamiento.</p>
                        </div>

                        {/* Model info cards */}
                        <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
                            <div className="glass-card">
                                <div className="card-title">⚙️ Ficha Técnica del Modelo K-Means</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                                    <div>
                                        <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Algoritmo:</strong> K-Means Clustering</p>
                                        <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Estandarización:</strong> StandardScaler (Z-Score)</p>
                                        <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Número de Clústers (K):</strong> {modelInfo.metricas_modelo.k_clusters}</p>
                                    </div>
                                    <div>
                                        <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Inercia del Modelo:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{modelInfo.metricas_modelo.inercia.toFixed(2)}</span></p>
                                        <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Coeficiente de Silueta:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{modelInfo.metricas_modelo.coeficiente_silueta.toFixed(4)}</span></p>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'var(--bg-accent-trans)', borderLeft: '3px solid var(--bg-accent)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                                    <strong>Justificación del Agrupamiento:</strong> La clasificación en perfiles de intervención se calcula de manera exclusiva en base a la Tasa de Recupero Suavizada (Bayesiana). El suavizado bayesiano de recuperos estabiliza a las jurisdicciones con baja muestra, previniendo distorsiones y optimizando el coeficiente de silueta ({modelInfo.metricas_modelo.coeficiente_silueta.toFixed(3)}). La tasa de robo no interviene en el agrupamiento del modelo para evitar sesgos de escala de volumen absoluto, y se muestra en el gráfico de dispersión únicamente a modo de contexto visual secundario.
                                </div>
                            </div>

                            {/* Scatter plot */}
                            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div className="card-title">📈 Mapa de Dispersión Bidimensional del Clustering</div>
                                <div style={{ position: 'relative', height: '260px', width: '100%' }}>
                                    <canvas ref={scatterChartRef}></canvas>
                                </div>
                            </div>
                        </div>

                        {/* Policies Container */}
                        <div className="section-header" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                            <h3>📋 Directrices Estratégicas y Recomendaciones de Política Pública</h3>
                            <p>Acciones policiales, de control vial y tecnológicas sugeridas para cada uno de los clústeres arrojados por el modelo.</p>
                        </div>
                        
                        <div id="cluster-policies-container">
                            {modelInfo.perfiles_clusters.map(perf => (
                                <div key={perf.id} className="glass-card policy-card" style={{ '--alert-color': perf.color }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <span className={`badge ${
                                            perf.nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO' ? 'badge-critical' :
                                            perf.nombre === 'NIVEL DE EFICIENCIA EN RECUPERO DESTACADA' ? 'badge-efficient' : 'badge-moderate'
                                        }`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                            {perf.nombre}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            Provincias: <strong>{perf.cant_provincias}</strong> | Robos prom: <strong>{formatNumber(Math.round(perf.robos_promedio))}</strong> | Tasa Rec: <strong>{perf.tasa_recupero_promedio}%</strong>
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--color-text-main)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '1rem' }}>{perf.descripcion}</p>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                        <strong style={{ color: 'var(--bg-accent)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', display: 'block', marginbottom: '0.5rem' }}>DIRECTRICES RECOMENDADAS:</strong>
                                        <ul className="policy-list">
                                            {perf.politicas_publicas.map((p, idx) => <li key={idx}>{p}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
