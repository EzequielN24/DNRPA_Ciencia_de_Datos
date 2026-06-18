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
                                return `${punto.label} | Tasa Rec: ${punto.x.toFixed(2)}% | Tasa Robo: ${punto.y.toFixed(2)} (por densidad)`;
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
                        title: { display: true, text: 'Tasa de Robo (por densidad poblacional)', color: 'var(--color-text-main)', font: { weight: 'bold' } },
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

    // Diccionarios para simplificar el lenguaje de las descripciones y directrices
    const descripcionesSimplificadas = {
        "NIVEL DE INTERVENCIÓN CRÍTICO": "Provincias con la menor tasa de recuperación de vehículos robados (menos del 5%). Requieren medidas urgentes para mejorar los tiempos de registro de trámites e inspeccionar los mercados de repuestos.",
        "NIVEL DE EFICIENCIA EN RECUPERO DESTACADA": "Provincias con una recuperación de vehículos excelente (lideradas por Entre Ríos con casi 17%). Se destacan por su gran efectividad en operativos y controles sobre las rutas.",
        "NIVEL DE INTERVENCIÓN MODERADO / BAJO": "Provincias con niveles intermedios o estables de recuperación de vehículos (entre 5.5% y 10%). Mantienen la situación bajo control con los operativos de seguridad habituales."
    };

    const politicasSimplificadas = {
        "NIVEL DE INTERVENCIÓN CRÍTICO": [
            "Revisar y agilizar los tiempos que tardan las oficinas locales en registrar las denuncias y recuperos de vehículos.",
            "Aumentar las inspecciones y controles sobre desarmaderos y comercios que venden repuestos usados.",
            "Realizar operativos de control policial conjuntos en las rutas de acceso y límites con otras provincias."
        ],
        "NIVEL DE EFICIENCIA EN RECUPERO DESTACADA": [
            "Mantener y reforzar los puestos de control de tránsito en los accesos clave de la provincia.",
            "Digitalizar todo el sistema de registro de trámites para evitar pérdidas de información y hacer un mejor seguimiento.",
            "Fomentar la prevención junto a los vecinos y usar aplicaciones móviles para dar avisos rápidos ante robos."
        ],
        "NIVEL DE INTERVENCIÓN MODERADO / BAJO": [
            "Instalar más cámaras de seguridad y centros de monitoreo en las ciudades más importantes de la provincia.",
            "Equipar a los patrulleros con GPS y usar programas que ayuden a planificar los recorridos de vigilancia diaria.",
            "Colocar cámaras lectoras de patentes en las entradas principales y patrulleros para detectar autos robados al instante."
        ]
    };

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Modelo de Machine Learning: Clustering K-Means</h2>
                <p>Las provincias se agruparon en 3 perfiles de intervención diferenciados utilizando únicamente la <strong>Tasa de Recupero Suavizada</strong> como variable de agrupamiento.</p>
            </div>

            {/* Ficha técnica y gráfico de dispersión */}
            <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="card-title">Ficha Técnica del Modelo</div>
                    
                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', marginBottom: '0.3rem', fontSize: '1rem' }}>Técnica utilizada</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', margin: 0 }}>
                            <strong>Algoritmo K-Means Clustering 1D:</strong> Un método de aprendizaje automático no supervisado que agrupa automáticamente las provincias con comportamientos similares en grupos (clústeres).
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', marginBottom: '0.3rem', fontSize: '1rem' }}>Variables</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', margin: 0, lineHeight: '1.4' }}>
                            <strong>Variable Principal:</strong> Tasa de Recupero Suavizada (calculada con un método Bayesiano para corregir distorsiones en provincias con pocos registros).<br/>
                            <strong>Variable de Contexto (Eje Y):</strong> Tasa de robos por unidad de densidad poblacional (no influye en la creación de los grupos, solo sirve para dar contexto visual).
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', marginBottom: '0.3rem', fontSize: '1rem' }}>Métricas</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
                            <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-text-main)' }}>Número de Clústers (K):</strong> {infoModelo.metricas_modelo.k_clusters}</p>
                            <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-text-main)' }}>Inercia del Modelo:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{infoModelo.metricas_modelo.inercia.toFixed(2)}</span></p>
                            <p style={{ margin: 0, gridColumn: 'span 2' }}><strong style={{ color: 'var(--color-text-main)' }}>Coeficiente de Silueta:</strong> <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--bg-accent)' }}>{infoModelo.metricas_modelo.coeficiente_silueta.toFixed(4)}</span> (Mide qué tan bien definidos y separados están los grupos. Valores cercanos a 1 indican una separación óptima).</p>
                        </div>
                    </div>

                    {/* Justificación del Agrupamiento (Comentado a pedido del usuario)
                    <div style={{ padding: '0.8rem', background: 'var(--bg-accent-trans)', borderLeft: '3px solid var(--bg-accent)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                        <strong>Justificación del Agrupamiento:</strong> La clasificación en perfiles de intervención se calcula de manera exclusiva en base a la Tasa de Recupero Suavizada (Bayesiana). El suavizado bayesiano de recuperos estabiliza a las jurisdicciones con baja muestra, previniendo distorsiones y optimizando el coeficiente de silueta ({infoModelo.metricas_modelo.coeficiente_silueta.toFixed(3)}). La tasa de robo no interviene en el agrupamiento del modelo para evitar sesgos de escala de volumen absoluto, y se muestra en el gráfico de dispersión únicamente a modo de contexto visual secundario.
                    </div>
                    */}
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card-title">Mapa de Dispersión del Clustering</div>
                    <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                        <canvas ref={refGraficoDispersion}></canvas>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.8rem' }}>
                        <h4 style={{ color: 'var(--bg-accent)', marginBottom: '0.3rem', fontSize: '1rem' }}>Interpretación del gráfico</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.4' }}>
                            El gráfico muestra cómo el algoritmo agrupa las provincias en base a su eficiencia. El <strong>eje horizontal (X)</strong> representa la tasa de recuperación de vehículos robados: cuanto más a la derecha está una provincia, mejor es su desempeño. El <strong>eje vertical (Y)</strong> representa la tasa de robos por unidad de densidad poblacional. Como el agrupamiento se realiza únicamente con la tasa de recuperación, se forman tres franjas verticales bien marcadas por sus colores (rojo para nivel crítico, amarillo para nivel moderado y verde para destacado).
                        </p>
                    </div>
                </div>
            </div>

            {/* Directrices Estratégicas */}
            <div className="section-header" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                <h3>Directrices Estratégicas y Recomendaciones de Política Pública</h3>
                <p>Acciones recomendadas de control, vigilancia y tecnología adaptadas a la realidad de cada grupo de provincias.</p>
            </div>
            
            <div id="cluster-policies-container">
                {infoModelo.perfiles_clusters.map(perfil => {
                    const desc = descripcionesSimplificadas[perfil.nombre] || perfil.descripcion;
                    const politicas = politicasSimplificadas[perfil.nombre] || perfil.politicas_publicas;
                    return (
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
                            <p style={{ color: 'var(--color-text-main)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '1rem' }}>{desc}</p>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <strong style={{ color: 'var(--bg-accent)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', display: 'block', marginBottom: '0.5rem' }}>Directrices recomendadas:</strong>
                                <ul style={{ 'marginLeft': '1rem', 'marginTop': '0.5rem' }}>
                                    {politicas.map((politica, indice) => <li key={indice}>{politica}</li>)}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Clustering;
