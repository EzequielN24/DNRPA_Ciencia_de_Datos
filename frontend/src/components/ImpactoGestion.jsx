import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AppContext } from '../context/AppContext';
import { formatearNumero, formatearPeriodo } from '../utils/formateadores';

const ImpactoGestion = () => {
    const { 
        impactoGestion, 
        cargandoImpacto, 
        cargarImpactoGestion 
    } = useContext(AppContext);

    const refGraficoBarrasImpacto = useRef(null);
    const refInstanciaBarrasImpacto = useRef(null);

    const refGraficoCronologiaImpacto = useRef(null);
    const refInstanciaCronologiaImpacto = useRef(null);

    // Cargar los datos al montar el componente
    useEffect(() => {
        cargarImpactoGestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Renderizar los gráficos cuando los datos estén listos
    useEffect(() => {
        if (!impactoGestion) return;

        // 1. Gráfico de Barras Agrupado (Volumen de Delitos)
        if (refGraficoBarrasImpacto.current) {
            if (refInstanciaBarrasImpacto.current) {
                refInstanciaBarrasImpacto.current.destroy();
            }

            const ctx = refGraficoBarrasImpacto.current.getContext('2d');
            refInstanciaBarrasImpacto.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Gestión Anterior (2020-2023)', 'Gestión Actual (2023-2026)'],
                    datasets: [
                        {
                            label: 'Robos Mensuales Promedio',
                            data: [
                                impactoGestion.nacional.periodo_a.robos_mensuales,
                                impactoGestion.nacional.periodo_b.robos_mensuales
                            ],
                            backgroundColor: '#ef233c',
                            borderColor: '#ffffff',
                            borderWidth: 1
                        },
                        {
                            label: 'Recuperos Mensuales Promedio',
                            data: [
                                impactoGestion.nacional.periodo_a.recuperos_mensuales,
                                impactoGestion.nacional.periodo_b.recuperos_mensuales
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
                            labels: { color: 'var(--color-text-muted)', font: { weight: 'bold' } }
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: 'Cantidad Promedio Mensual', color: 'var(--color-text-main)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { color: 'var(--color-text-muted)' }
                        },
                        x: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { color: 'var(--color-text-muted)' }
                        }
                    }
                }
            });
        }

        // 2. Cronología Nacional (Tasa de Recuperación)
        if (refGraficoCronologiaImpacto.current) {
            if (refInstanciaCronologiaImpacto.current) {
                refInstanciaCronologiaImpacto.current.destroy();
            }

            const ctx = refGraficoCronologiaImpacto.current.getContext('2d');
            const etiquetas = impactoGestion.serie_temporal.map(h => formatearPeriodo(h.periodo));
            const datosTasaReal = impactoGestion.serie_temporal.map(h => h.tasa_recupero);
            const datosTasaSuavizada = impactoGestion.serie_temporal.map(h => h.tasa_recupero_smoothed);

            // Plugin personalizado para dibujar la línea vertical del Cambio de Gestión
            const pluginLineaVertical = {
                id: 'lineaVerticalGestion',
                afterDraw: (grafico) => {
                    const valorX = '2023-12';
                    const ejeX = grafico.scales.x;
                    const ejeY = grafico.scales.y;

                    const indiceEtiqueta = grafico.data.labels.indexOf(valorX);
                    if (indiceEtiqueta !== -1) {
                        const x = ejeX.getPixelForValue(indiceEtiqueta);
                        const canvasCtx = grafico.ctx;
                        canvasCtx.save();

                        // Dibujar Línea
                        canvasCtx.beginPath();
                        canvasCtx.moveTo(x, ejeY.top);
                        canvasCtx.lineTo(x, ejeY.bottom);
                        canvasCtx.lineWidth = 2;
                        canvasCtx.strokeStyle = '#ef233c';
                        canvasCtx.setLineDash([6, 6]);
                        canvasCtx.stroke();

                        // Dibujar Texto
                        canvasCtx.fillStyle = '#ef233c';
                        canvasCtx.font = 'bold 11px Inter, sans-serif';
                        canvasCtx.textAlign = 'center';
                        canvasCtx.fillText('Cambio de Gestión', x, ejeY.top - 8);
                        canvasCtx.restore();
                    }
                }
            };

            refInstanciaCronologiaImpacto.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: etiquetas,
                    datasets: [
                        {
                            label: 'Tasa de Recupero Real',
                            data: datosTasaReal,
                            borderColor: 'rgba(46, 196, 182, 0.4)',
                            backgroundColor: 'rgba(46, 196, 182, 0.02)',
                            borderWidth: 1.5,
                            pointRadius: 1,
                            tension: 0.2,
                            fill: false
                        },
                        {
                            label: 'Tasa de Recupero Suavizada',
                            data: datosTasaSuavizada,
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
                            labels: { color: 'var(--color-text-muted)', font: { weight: 'bold' } }
                        },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: 'Tasa de Recupero (%)', color: 'var(--color-text-main)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { color: 'var(--color-text-muted)' }
                        },
                        x: {
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { maxTicksLimit: 14, color: 'var(--color-text-muted)' }
                        }
                    }
                },
                plugins: [pluginLineaVertical]
            });
        }

        return () => {
            if (refInstanciaBarrasImpacto.current) {
                refInstanciaBarrasImpacto.current.destroy();
                refInstanciaBarrasImpacto.current = null;
            }
            if (refInstanciaCronologiaImpacto.current) {
                refInstanciaCronologiaImpacto.current.destroy();
                refInstanciaCronologiaImpacto.current = null;
            }
        };
    }, [impactoGestion]);

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Análisis de Impacto de Gestión y Cambio de Gobierno</h2>
                <p>Estudio temporal comparativo del delito automotor antes y después de la transición de gestión gubernamental (10 de Diciembre de 2023).</p>
            </div>

            {cargandoImpacto && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Cargando datos de impacto y series temporales...
                </div>
            )}

            {!cargandoImpacto && impactoGestion && (
                <>
                    {/* Tarjetas KPI de Desempeño */}
                    <div className="kpi-container">
                        <div className="glass-card kpi-card kpi-alert">
                            <span className="kpi-title">Robos Mensuales Promedio (Ant)</span>
                            <span className="kpi-value">{formatearNumero(Math.round(impactoGestion.nacional.periodo_a.robos_mensuales))}</span>
                            <span className="kpi-trend">Ene 2020 - Nov 2023</span>
                        </div>
                        <div className="glass-card kpi-card kpi-alert" style={{ borderLeft: '4px solid var(--alert-critical)' }}>
                            <span className="kpi-title">Robos Mensuales Promedio (Act)</span>
                            <span className="kpi-value">{formatearNumero(Math.round(impactoGestion.nacional.periodo_b.robos_mensuales))}</span>
                            <span className="kpi-trend" style={{ color: impactoGestion.nacional.diferencias.robos_mensuales > 0 ? 'var(--alert-critical)' : 'var(--alert-efficient)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {impactoGestion.nacional.diferencias.robos_mensuales > 0 ? '▲' : '▼'} {formatearNumero(Math.abs(Math.round(impactoGestion.nacional.diferencias.robos_mensuales)))} ({((impactoGestion.nacional.diferencias.robos_mensuales / impactoGestion.nacional.periodo_a.robos_mensuales) * 100).toFixed(1)}%)
                            </span>
                        </div>
                        <div className="glass-card kpi-card kpi-success">
                            <span className="kpi-title">Tasa de Recupero Promedio (Ant)</span>
                            <span className="kpi-value">{impactoGestion.nacional.periodo_a.tasa_recupero.toFixed(2)}%</span>
                            <span className="kpi-trend">Efectividad policial</span>
                        </div>
                        <div className="glass-card kpi-card kpi-success" style={{ borderLeft: '4px solid var(--alert-efficient)' }}>
                            <span className="kpi-title">Tasa de Recupero Promedio (Act)</span>
                            <span className="kpi-value">{impactoGestion.nacional.periodo_b.tasa_recupero.toFixed(2)}%</span>
                            <span className="kpi-trend" style={{ color: impactoGestion.nacional.diferencias.tasa_recupero >= 0 ? 'var(--alert-efficient)' : 'var(--alert-critical)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {impactoGestion.nacional.diferencias.tasa_recupero >= 0 ? '▲' : '▼'} {Math.abs(impactoGestion.nacional.diferencias.tasa_recupero).toFixed(2)}% (Var. Absoluta)
                            </span>
                        </div>
                    </div>

                    {/* Gráfico comparativo volumen */}
                    <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                        <div className="card-title">Volumen Mensual Promedio de Trámites (Misma Escala)</div>
                        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                            <canvas ref={refGraficoBarrasImpacto}></canvas>
                        </div>
                    </div>

                    {/* Línea temporal tasa de recupero */}
                    <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                        <div className="card-title">Evolución Temporal Mensual de la Tasa de Recupero Nacional</div>
                        <div style={{ position: 'relative', height: '350px', width: '100%' }}>
                            <canvas ref={refGraficoCronologiaImpacto}></canvas>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                            Línea de hito vertical discontinua demarcando el Cambio de Gestión (Diciembre 2023). Muestra la evolución e impacto sobre las tasas real y suavizada.
                        </div>
                    </div>

                    {/* Matriz de impacto provincial */}
                    <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
                        <div className="card-title">Matriz de Impacto Provincial y Desempeño Relativo</div>
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
                                    {impactoGestion.provincias.map(provinciaItem => (
                                        <tr key={provinciaItem.provincia}>
                                            <td><strong>{provinciaItem.provincia}</strong></td>
                                            <td style={{ textAlign: 'center' }}>{provinciaItem.periodo_a.tasa_recupero.toFixed(2)}%</td>
                                            <td style={{ textAlign: 'center' }}>{provinciaItem.periodo_b.tasa_recupero.toFixed(2)}%</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: provinciaItem.diferencias.tasa_recupero >= 0 ? 'var(--alert-efficient)' : 'var(--alert-critical)' }}>
                                                {provinciaItem.diferencias.tasa_recupero >= 0 ? '+' : ''}{provinciaItem.diferencias.tasa_recupero.toFixed(2)}%
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{provinciaItem.periodo_a.robos_mensuales.toFixed(1)}</td>
                                            <td style={{ textAlign: 'center' }}>{provinciaItem.periodo_b.robos_mensuales.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ImpactoGestion;
