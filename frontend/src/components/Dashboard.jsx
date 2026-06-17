import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AppContext } from '../context/AppContext';
import { formatearNumero } from '../utils/formateadores';

const Dashboard = () => {
    const { resumen, provincias } = useContext(AppContext);

    const refGraficoDona = useRef(null);
    const refInstanciaDona = useRef(null);

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
                    borderWidth: 1
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

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Consola Federal de Monitoreo y Asignación de Recursos</h2>
                <p>Métricas consolidadas e indicadores prioritarios para la planificación del patrullaje y la seguridad interjurisdiccional.</p>
            </div>

            {/* KPIs 2×2 + Gráfico de Dona en la misma fila */}
            {resumen && (
                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>

                        {/* Matriz 2×2 de KPIs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="glass-card kpi-card kpi-alert" style={{ margin: 0 }}>
                                <span className="kpi-title">Denuncias de Robo Acumuladas</span>
                                <span className="kpi-value">{formatearNumero(resumen.robos_totales)}</span>
                                <span className="kpi-trend">Registradas a nivel nacional</span>
                            </div>
                            <div className="glass-card kpi-card kpi-success" style={{ margin: 0 }}>
                                <span className="kpi-title">Comunicaciones de Recupero</span>
                                <span className="kpi-value">{formatearNumero(resumen.recuperos_totales)}</span>
                                <span className="kpi-trend">Vehículos recuperados físicamente</span>
                            </div>
                            <div className="glass-card kpi-card kpi-warning" style={{ margin: 0 }}>
                                <span className="kpi-title">Tasa de Recupero Nacional</span>
                                <span className="kpi-value">{resumen.tasa_recupero_promedio.toFixed(2)}%</span>
                                <span className="kpi-trend">Promedio de efectividad nacional</span>
                            </div>
                            <div className="glass-card kpi-card kpi-info" style={{ margin: 0 }}>
                                <span className="kpi-title">Tasa de Robo Nacional</span>
                                <span className="kpi-value">{resumen.tasa_robo_nacional?.toFixed(1)}</span>
                                <span className="kpi-trend">Robos por cada 100k hab. (INDEC)</span>
                            </div>
                        </div>

                        {/* Gráfico de Dona */}
                        <div>
                            <div className="card-title" style={{ marginBottom: '1rem' }}>Concentración Geográfica de la Actividad Delictiva</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                                    <canvas ref={refGraficoDona}></canvas>
                                </div>
                                <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    <table style={{ fontSize: '0.75rem', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Jurisdicción</th>
                                                <th style={{ textAlign: 'right' }}>%</th>
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
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                                                <span>{pct.toFixed(1)}%</span>
                                                                <div className="progress-bar-container" style={{ marginTop: 0, width: '30px', height: '4px' }}>
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
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                                5 jurisdicciones acumulan más del 97% del volumen delictivo nacional.
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* Ranking Table */}
            <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                <div className="card-title">
                    Ranking Federal de Alertas de Seguridad por Criticidad
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
                            {provincias.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando registros consolidados...</td>
                                </tr>
                            ) : (
                                [...provincias].sort((a, b) => a.tasa_recupero_smoothed - b.tasa_recupero_smoothed).map(provinciaItem => (
                                    <tr key={provinciaItem.provincia}>
                                        <td><strong>{provinciaItem.provincia}</strong></td>
                                        <td>{formatearNumero(provinciaItem.robos)}</td>
                                        <td>{formatearNumero(provinciaItem.recuperos)}</td>
                                        <td>{provinciaItem.tasa_recupero.toFixed(2)}%</td>
                                        <td>{provinciaItem.tasa_recupero_smoothed.toFixed(2)}%</td>
                                        <td><strong>{provinciaItem.tasa_robo.toFixed(1)}</strong></td>
                                        <td>
                                            <span className={`badge ${
                                                provinciaItem.cluster_nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO' ? 'badge-critical' :
                                                provinciaItem.cluster_nombre === 'NIVEL DE EFICIENCIA EN RECUPERO DESTACADA' ? 'badge-efficient' : 'badge-moderate'
                                            }`}>
                                                {provinciaItem.cluster_nombre.replace("NIVEL DE ", "")}
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
    );
};

export default Dashboard;
