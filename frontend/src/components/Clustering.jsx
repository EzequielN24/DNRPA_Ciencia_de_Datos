import React, { useContext, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AppContext } from '../context/AppContext';
import { formatearNumero } from '../utils/formateadores';

const Clustering = () => {
    const { infoModelo, provincias } = useContext(AppContext);

    const refGraficoDispersion = useRef(null);
    const refInstanciaDispersion = useRef(null);

    useEffect(() => {
        if (!infoModelo || provincias.length === 0 || !refGraficoDispersion.current) {
            return;
        }

        if (refInstanciaDispersion.current) {
            refInstanciaDispersion.current.destroy();
        }

        const conjuntosDatos = infoModelo.perfiles_clusters.map(perfil => {
            const provinciasDelCluster = provincias.filter(p => p.cluster_nombre === perfil.nombre);
            return {
                label: perfil.nombre.replace("NIVEL DE ", ""),
                data: provinciasDelCluster.map(p => ({
                    x: p.tasa_recupero_smoothed,
                    y: p.tasa_robo,
                    label: p.provincia
                })),
                backgroundColor: perfil.color,
                borderColor: '#ffffff',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        const ctx = refGraficoDispersion.current.getContext('2d');
        refInstanciaDispersion.current = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: conjuntosDatos },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (contextoItem) {
                                const punto = contextoItem.raw;
                                return `${punto.label} | Tasa Rec: ${punto.x.toFixed(2)}% | Tasa Robo: ${punto.y.toFixed(2)} (por 100k hab)`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: 'bold' }, color: 'var(--color-text-muted)' }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tasa de Recupero Suavizada (%)', color: 'var(--color-text-main)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: 'var(--color-text-muted)' }
                    },
                    y: {
                        title: { display: true, text: 'Tasa de Robo (por cada 100.000 hab.)', color: 'var(--color-text-main)', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: 'var(--color-text-muted)' }
                    }
                }
            }
        });

        return () => {
            if (refInstanciaDispersion.current) {
                refInstanciaDispersion.current.destroy();
                refInstanciaDispersion.current = null;
            }
        };
    }, [infoModelo, provincias]);

    if (!infoModelo) {
        return (
            <div className="section-content active">
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    Cargando información del modelo de clustering...
                </div>
            </div>
        );
    }

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Modelo de Machine Learning: Clustering K-Means</h2>
                <p>Las provincias se agruparon en 3 perfiles de intervención diferenciados utilizando únicamente la <strong>Tasa de Recupero Suavizada</strong> como variable de agrupamiento.</p>
            </div>

            {/* Ficha técnica y gráfico de dispersión */}
            <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
                <div className="glass-card">
                    <div className="card-title">Ficha Técnica del Modelo K-Means</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                        <div>
                            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Algoritmo:</strong> K-Means Clustering</p>
                            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Estandarización:</strong> StandardScaler (Z-Score)</p>
                            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Número de Clústers (K):</strong> {infoModelo.metricas_modelo.k_clusters}</p>
                        </div>
                        <div>
                            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Inercia del Modelo:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{infoModelo.metricas_modelo.inercia.toFixed(2)}</span></p>
                            <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--color-text-main)' }}>Coeficiente de Silueta:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{infoModelo.metricas_modelo.coeficiente_silueta.toFixed(4)}</span></p>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'var(--bg-accent-trans)', borderLeft: '3px solid var(--bg-accent)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                        <strong>Justificación del Agrupamiento:</strong> La clasificación en perfiles de intervención se calcula de manera exclusiva en base a la Tasa de Recupero Suavizada (Bayesiana). El suavizado bayesiano de recuperos estabiliza a las jurisdicciones con baja muestra, previniendo distorsiones y optimizando el coeficiente de silueta ({infoModelo.metricas_modelo.coeficiente_silueta.toFixed(3)}). La tasa de robo no interviene en el agrupamiento del modelo para evitar sesgos de escala de volumen absoluto, y se muestra en el gráfico de dispersión únicamente a modo de contexto visual secundario.
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="card-title">Mapa de Dispersión Bidimensional del Clustering</div>
                    <div style={{ position: 'relative', height: '260px', width: '100%' }}>
                        <canvas ref={refGraficoDispersion}></canvas>
                    </div>
                </div>
            </div>

            {/* Directrices Estratégicas */}
            <div className="section-header" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                <h3>Directrices Estratégicas y Recomendaciones de Política Pública</h3>
                <p>Acciones policiales, de control vial y tecnológicas sugeridas para cada uno de los clústeres arrojados por el modelo.</p>
            </div>
            
            <div id="cluster-policies-container">
                {infoModelo.perfiles_clusters.map(perfil => (
                    <div key={perfil.id} className="glass-card policy-card" style={{ '--alert-color': perfil.color }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span className={`badge ${
                                perfil.nombre === 'NIVEL DE INTERVENCIÓN CRÍTICO' ? 'badge-critical' :
                                perfil.nombre === 'NIVEL DE EFICIENCIA EN RECUPERO DESTACADA' ? 'badge-efficient' : 'badge-moderate'
                            }`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                {perfil.nombre}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                Provincias: <strong>{perfil.cant_provincias}</strong> | Robos prom: <strong>{formatearNumero(Math.round(perfil.robos_promedio))}</strong> | Tasa Rec: <strong>{perfil.tasa_recupero_promedio}%</strong>
                            </span>
                        </div>
                        <p style={{ color: 'var(--color-text-main)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '1rem' }}>{perfil.descripcion}</p>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <strong style={{ color: 'var(--bg-accent)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>DIRECTRICES RECOMENDADAS:</strong>
                            <ul style={{ 'marginLeft': '1rem', 'marginTop': '0.5rem' }}>
                                {perfil.politicas_publicas.map((politica, indice) => <li key={indice}>{politica}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Clustering;
