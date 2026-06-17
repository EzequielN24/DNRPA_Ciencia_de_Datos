import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { formatearNumero } from '../utils/formateadores';

const Dashboard = () => {
    const { resumen, provincias } = useContext(AppContext);

    return (
        <div className="section-content active">
            <div className="section-header">
                <h2>Consola Federal de Monitoreo y Asignación de Recursos</h2>
                <p>Métricas consolidadas e indicadores prioritarios para la planificación del patrullaje y la seguridad interjurisdiccional.</p>
            </div>

            {resumen && (
                <div className="kpi-container">
                    <div className="glass-card kpi-card kpi-alert">
                        <span className="kpi-title">Denuncias de Robo Acumuladas</span>
                        <span className="kpi-value">{formatearNumero(resumen.robos_totales)}</span>
                        <span className="kpi-trend">Registradas a nivel nacional</span>
                    </div>
                    <div className="glass-card kpi-card kpi-success">
                        <span className="kpi-title">Comunicaciones de Recupero</span>
                        <span className="kpi-value">{formatearNumero(resumen.recuperos_totales)}</span>
                        <span className="kpi-trend">Vehículos recuperados físicamente</span>
                    </div>
                    <div className="glass-card kpi-card kpi-warning">
                        <span className="kpi-title">Tasa de Recupero Nacional</span>
                        <span className="kpi-value">{resumen.tasa_recupero_promedio.toFixed(2)}%</span>
                        <span className="kpi-trend">Promedio de efectividad nacional</span>
                    </div>
                    <div className="glass-card kpi-card kpi-info">
                        <span className="kpi-title">Tasa de Robo Nacional</span>
                        <span className="kpi-value">{resumen.tasa_robo_nacional?.toFixed(1)}</span>
                        <span className="kpi-trend">Robos por cada 100k hab. (INDEC)</span>
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
