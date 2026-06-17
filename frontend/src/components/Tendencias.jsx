import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AppContext } from '../context/AppContext';
import { formatearNumero, formatearPeriodo } from '../utils/formateadores';

const Tendencias = () => {
    const { 
        provincias, 
        resumen, 
        nombreProvSeleccionada, 
        setNombreProvSeleccionada, 
        detalleProvSeleccionada 
    } = useContext(AppContext);

    const refGraficoDona = useRef(null);
    const refInstanciaDona = useRef(null);

    const refGraficoLineaProv = useRef(null);
    const refInstanciaLineaProv = useRef(null);

    // Renderizado del gráfico de Dona (Concentración Geográfica)
    useEffect(() => {
        if (provincias.length === 0 || !refGraficoDona.current) {
            return;
        }

        if (refInstanciaDona.current) {
            refInstanciaDona.current.destroy();
        }

        const provinciasOrdenadas = [...provincias].sort((a, b) => b.robos - a.robos);
        const primeras5 = provinciasOrdenadas.slice(0, 5);
        const sumaResto = provinciasOrdenadas.slice(5).reduce((acumulador, prov) => acumulador + prov.robos, 0);

        const etiquetas = [...primeras5.map(p => p.provincia), "OTRAS JURISDICCIONES"];
        const datos = [...primeras5.map(p => p.robos), sumaResto];
        const colores = ['#ef233c', '#ff5a5f', '#ffb703', '#ffc857', '#48cae4', 'rgba(116, 172, 223, 0.25)'];

        const ctx = refGraficoDona.current.getContext('2d');
        refInstanciaDona.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: etiquetas,
                datasets: [{
                    data: datos,
                    backgroundColor: colores,
                    borderColor: 'var(--bg-card)',
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

        return () => {
            if (refInstanciaDona.current) {
                refInstanciaDona.current.destroy();
                refInstanciaDona.current = null;
            }
        };
    }, [provincias]);

    // Renderizado del gráfico de línea de serie temporal por provincia
    useEffect(() => {
        if (!detalleProvSeleccionada || !refGraficoLineaProv.current) {
            return;
        }

        if (refInstanciaLineaProv.current) {
            refInstanciaLineaProv.current.destroy();
        }

        const historial = detalleProvSeleccionada.historial_temporal;
        const etiquetas = historial.map(h => formatearPeriodo(h.periodo));
        const datosRobos = historial.map(h => h.robos);
        const datosRecuperos = historial.map(h => h.recuperos);
        const datosTasa = historial.map(h => h.tasa_recupero_smoothed);

        const ctx = refGraficoLineaProv.current.getContext('2d');
        refInstanciaLineaProv.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: 'Denuncias de Robo',
                        data: datosRobos,
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
                        data: datosRecuperos,
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
                        data: datosTasa,
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
                        labels: { boxWidth: 12, font: { size: 10 }, color: 'var(--color-text-muted)' }
                    },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { maxTicksLimit: 12, font: { size: 9 }, color: 'var(--color-text-muted)' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Cantidad de Trámites', color: 'var(--color-text-main)', font: { size: 10, weight: 'bold' } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { font: { size: 9 }, color: 'var(--color-text-muted)' }
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

        return () => {
            if (refInstanciaLineaProv.current) {
                refInstanciaLineaProv.current.destroy();
                refInstanciaLineaProv.current = null;
            }
        };
    }, [detalleProvSeleccionada]);

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Análisis de Tendencias y Series Temporales</h2>
                <p>Visualizaciones avanzadas sobre la concentración delictiva y la evolución temporal del delito.</p>
            </div>

            {/* Explorador interactivo por provincia */}
            <div className="glass-card" style={{ marginBottom: '2.5rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>
                        Serie Temporal Histórica e Indicadores por Jurisdicción
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <label htmlFor="select-prov" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Seleccionar Provincia:</label>
                        <select 
                            id="select-prov" 
                            className="select-input" 
                            style={{ minWidth: '250px' }} 
                            value={nombreProvSeleccionada} 
                            onChange={(e) => setNombreProvSeleccionada(e.target.value)}
                        >
                            <option value="TODAS LAS PROVINCIAS">TODAS LAS PROVINCIAS (CONSOLIDADO FEDERAL)</option>
                            {[...provincias].sort((a, b) => a.provincia.localeCompare(b.provincia)).map(prov => (
                                <option key={prov.provincia} value={prov.provincia}>{prov.provincia}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
                    <div style={{ position: 'relative', height: '350px', width: '100%' }}>
                        <canvas ref={refGraficoLineaProv}></canvas>
                    </div>
                    
                    {detalleProvSeleccionada && (
                        <div style={{ background: 'rgba(116, 172, 223, 0.06)', border: 'var(--border-glass)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-text-main)', marginBottom: '1rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', paddingBottom: '0.3rem' }}>{detalleProvSeleccionada.provincia}</h4>
                                <div style={{ fontSize: '0.95rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Robos Totales:</span>
                                        <strong style={{ fontFamily: 'var(--font-heading)' }}>{formatearNumero(detalleProvSeleccionada.robos)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Recuperos Totales:</span>
                                        <strong style={{ fontFamily: 'var(--font-heading)' }}>{formatearNumero(detalleProvSeleccionada.recuperos)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Tasa de Recupero Real:</span>
                                        <strong style={{ color: 'var(--bg-accent)', fontFamily: 'var(--font-heading)' }}>{detalleProvSeleccionada.tasa_recupero.toFixed(2)}%</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Tasa de Robo (100k):</span>
                                        <strong style={{ fontFamily: 'var(--font-heading)' }}>{detalleProvSeleccionada.tasa_robo.toFixed(1)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Marca Más Robada:</span>
                                        <strong style={{ fontSize: '0.85rem' }}>{detalleProvSeleccionada.marca_lider_robo}</strong>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--bg-accent-trans)', borderLeft: '3px solid var(--bg-accent)', borderRadius: '4px', fontSize: '0.85rem' }}>
                                <strong>Categoría de Intervención:</strong> <span className="badge" style={{ background: `${detalleProvSeleccionada.cluster_color}20`, color: detalleProvSeleccionada.cluster_color, border: `1px solid ${detalleProvSeleccionada.cluster_color}50`, fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem', padding: '0.2rem 0.6rem' }}>{detalleProvSeleccionada.cluster_nombre.replace("NIVEL DE ", "")}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Distribución y detalles */}
            <div className="grid-cards">
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div className="card-title">Concentración Geográfica de la Actividad Delictiva</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', height: '260px', width: '100%' }}>
                                <canvas ref={refGraficoDona}></canvas>
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
                                        {[...provincias].sort((a, b) => b.robos - a.robos).map(prov => {
                                            const totalRobos = resumen?.robos_totales || 1;
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

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div className="card-title">Detalles Descriptivos de Flotas y Titulares</div>
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
    );
};

export default Tendencias;
