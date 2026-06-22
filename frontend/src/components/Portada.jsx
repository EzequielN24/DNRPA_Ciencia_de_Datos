import React from 'react';
import { useNavigate } from 'react-router-dom';

const Portada = () => {
    const navegar = useNavigate();

    const variablesDnrpa = [
        { nombre: 'tramite_tipo', tipo: 'Categórica', desc: 'Tipo de trámite registrado (robo, recupero, etc.).' },
        { nombre: 'tramite_fecha', tipo: 'Fecha', desc: 'Fecha en que se realizó el trámite en el registro.' },
        { nombre: 'fecha_inscripcion_inicial', tipo: 'Fecha', desc: 'Fecha de inscripción inicial del vehículo.' },
        { nombre: 'registro_seccional_codigo', tipo: 'Categórica (código)', desc: 'Identificador del registro seccional.' },
        { nombre: 'registro_seccional_descripcion', tipo: 'Categórica', desc: 'Nombre del registro seccional.' },
        { nombre: 'registro_seccional_provincia', tipo: 'Categórica', desc: 'Provincia donde se encuentra radicado el registro.' },
        { nombre: 'automotor_origen', tipo: 'Categórica', desc: 'Origen del vehículo (Nacional o Importado).' },
        { nombre: 'automotor_anio_modelo', tipo: 'Numérica (int)', desc: 'Año del modelo de fabricación del vehículo.' },
        { nombre: 'automotor_tipo_codigo', tipo: 'Categórica (código)', desc: 'Código identificador del tipo de vehículo.' },
        { nombre: 'automotor_tipo_descripcion', tipo: 'Categórica', desc: 'Descripción del tipo de vehículo.' },
        { nombre: 'automotor_marca_codigo', tipo: 'Categórica (código)', desc: 'Código de la marca del vehículo.' },
        { nombre: 'automotor_marca_descripcion', tipo: 'Categórica', desc: 'Marca fabricante del automotor.' },
        { nombre: 'automotor_modelo_codigo', tipo: 'Categórica (código)', desc: 'Código del modelo del vehículo.' },
        { nombre: 'automotor_modelo_descripcion', tipo: 'Categórica', desc: 'Modelo comercial del vehículo.' },
        { nombre: 'automotor_uso_codigo', tipo: 'Categórica (código)', desc: 'Código de uso del vehículo.' },
        { nombre: 'automotor_uso_descripcion', tipo: 'Categórica', desc: 'Descripción del uso del vehículo (particular, comercial, etc.).' },
        { nombre: 'titular_tipo_persona', tipo: 'Categórica', desc: 'Tipo de titularidad registrada (Persona física o jurídica).' },
        { nombre: 'titular_domicilio_localidad', tipo: 'Categórica', desc: 'Localidad de residencia declarada por el titular.' },
        { nombre: 'titular_domicilio_provincia', tipo: 'Categórica', desc: 'Provincia del domicilio del titular.' },
        { nombre: 'titular_genero', tipo: 'Categórica', desc: 'Género declarado del titular.' },
        { nombre: 'titular_anio_nacimiento', tipo: 'Numérica (int)', desc: 'Año de nacimiento del titular del vehículo.' },
        { nombre: 'titular_pais_nacimiento', tipo: 'Categórica', desc: 'País de nacimiento del titular.' },
        { nombre: 'titular_porcentaje_titularidad', tipo: 'Numérica (float)', desc: 'Porcentaje de tenencia del titular sobre el automotor.' },
        { nombre: 'titular_domicilio_provincia_id', tipo: 'Categórica (id)', desc: 'ID numérico de la provincia del titular.' },
        { nombre: 'titular_pais_nacimiento_id', tipo: 'Categórica (id)', desc: 'ID numérico del país de nacimiento del titular.' }
    ];

    return (
        <div className="section-content active" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Cabecera Principal / Hero */}
            <div className="hero-section">
                <div className="hero-title-badge">Consola Estratégica Federal</div>
                <h2>Tablero de Control de Gestión y Priorización del Delito Automotor</h2>
                <p className="hero-subtitle">
                    Herramienta de análisis para el Ministerio de Seguridad de la Nación orientada a evaluar la eficiencia en la recuperación vehicular y optimizar la distribución de recursos a nivel nacional.
                </p>
                <div style={{ marginTop: '2.5rem' }}>
                    <button 
                        className="select-input" 
                        style={{ background: 'var(--bg-accent)', border: 'none', color: '#ffffff', fontWeight: '800', fontFamily: 'var(--font-heading)', padding: '0.9rem 2.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 180, 216, 0.2)' }} 
                        onClick={() => navegar('/dashboard')}
                    >
                        ACCEDER A LA CONSOLA DE MANDO ➔
                    </button>
                </div>
            </div>

            {/* Sección 1: Contexto del Problema */}
            <section style={{ padding: '3rem 0', borderBottom: '1px solid rgba(116, 172, 223, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '1.2rem' }}>Contexto del Problema Abordado</h3>
                <p style={{ fontSize: '1.05rem', textAlign: 'justify', lineHeight: '1.7', color: 'var(--color-text-main)', marginBottom: '1rem' }}>
                    El parque automotor en Argentina constituye un componente fundamental de la economía y la movilidad cotidiana. Sin embargo, su crecimiento ha estado acompañado por problemáticas vinculadas a la seguridad, siendo el robo de vehículos uno de los fenómenos delictivos más relevantes en las áreas metropolitanas y corredores viales.
                </p>
                <p style={{ fontSize: '1.05rem', textAlign: 'justify', lineHeight: '1.7', color: 'var(--color-text-main)' }}>
                    Existen diferencias significativas entre provincias tanto en el volumen delictivo absoluto como en la capacidad operativa de recuperar los vehículos robados. Estas diferencias territoriales y las variaciones temporales dificultan la evaluación sistemática del desempeño de las políticas públicas y la optimización de los presupuestos de prevención interjurisdiccional. Este tablero consolida y analiza de forma objetiva la información histórica para dotar de soporte técnico al Ministerio.
                </p>
            </section>

            {/* Sección 2: Preguntas Analíticas de Investigación */}
            <section style={{ padding: '3rem 0', borderBottom: '1px solid rgba(116, 172, 223, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '1.2rem' }}>Preguntas Principales del Proyecto</h3>
                <ul style={{ paddingLeft: '1.5rem', fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--color-text-main)' }}>
                    <li style={{ marginBottom: '0.8rem' }}>¿Cuáles son las jurisdicciones con mayor índice de criticidad y prioridad de intervención a nivel federal?</li>
                    <li style={{ marginBottom: '0.8rem' }}>¿Existe una concentración geográfica marcada del delito automotor en la República Argentina?</li>
                    <li style={{ marginBottom: '0.8rem' }}>¿Cómo ha evolucionado la tasa de recuperación vehicular a lo largo del tiempo y cómo impacta la transición entre gestiones de gobierno?</li>
                    <li style={{ marginBottom: '0.8rem' }}>¿Qué perfiles de provincias pueden identificarse agrupándolas mediante técnicas de aprendizaje automático (K-Means)?</li>
                </ul>
            </section>

            {/* Sección 3: Justificación del Problema Abordado */}
            <section style={{ padding: '3rem 0', borderBottom: '1px solid rgba(116, 172, 223, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '1.2rem' }}>Justificación del Problema Abordado</h3>
                <p style={{ fontSize: '1.05rem', textAlign: 'justify', lineHeight: '1.7', color: 'var(--color-text-main)', marginBottom: '1.2rem' }}>
                    La importancia de investigar y dar solución al robo automotor radica en que no constituye un delito aislado, sino que actúa como el motor principal de redes delictivas más complejas, como el contrabando y el mercado ilegal de autopartes (desarmaderos). Además, tiene un impacto socioeconómico directo y severo sobre el patrimonio, la tranquilidad y la seguridad física de los ciudadanos en su vida cotidiana.
                </p>
                <p style={{ fontSize: '1.05rem', textAlign: 'justify', lineHeight: '1.7', color: 'var(--color-text-main)' }}>
                    Focalizar el análisis en la tasa de recuperación y en el volumen delictivo a nivel federal está plenamente justificado para evitar la dispersión de esfuerzos policiales y estatales. Comprender los patrones geográficos y temporales permite al Ministerio de Seguridad formular políticas orientadas a las zonas más vulnerables, optimizar los presupuestos operativos de las fuerzas de seguridad y establecer estándares de eficiencia interjurisdiccional para reducir la impunidad del delito.
                </p>
            </section>

            {/* Sección 4: Ficha Técnica de Datos y Variables */}
            <section style={{ padding: '3rem 0' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '1.2rem' }}>Ficha Técnica del Dataset</h3>
                <p style={{ fontSize: '1.05rem', textAlign: 'justify', lineHeight: '1.7', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
                    <strong>Fuentes de Datos:</strong> Datos abiertos de trámites provistos por la Dirección Nacional de los Registros Nacionales de la Propiedad del Automotor (DNRPA), obtenidos a través del portal nacional oficial datos.gob.ar.
                    <br />
                    <strong>Período Analizado:</strong> Del 1 de enero de 2020 al 30 de abril de 2026.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '2.5rem' }}>
                    <div>
                        <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '1rem' }}>Estructura Completa de Variables (DNRPA)</h4>
                        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto', border: 'var(--border-glass)', borderRadius: '6px' }}>
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                                    <tr>
                                        <th>Variable</th>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variablesDnrpa.map((variableItem, idx) => (
                                        <tr key={idx}>
                                            <td><strong>{variableItem.nombre}</strong></td>
                                            <td>{variableItem.tipo}</td>
                                            <td>{variableItem.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-card)', borderLeft: '3px solid var(--bg-accent)', padding: '1.5rem', borderRadius: '4px', boxShadow: 'var(--box-shadow)' }}>
                        <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-main)', fontSize: '1.1rem', marginBottom: '0.8rem' }}>Limitaciones de los Datos</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', textAlign: 'justify', lineHeight: '1.6', margin: 0 }}>
                            • <strong>Solo casos denunciados:</strong> Únicamente se muestran los robos y recuperos informados en el registro automotor. Si un hecho no se denuncia de esta forma, no aparece.<br/><br/>
                            • <strong>Sin detalles del robo:</strong> La base de datos solo indica que el vehículo fue robado, pero no incluye detalles del hecho (como el horario, si fue con violencia o el barrio exacto).<br/><br/>
                            • <strong>Falta de escalabilidad:</strong> El tablero no es totalmente escalable ante futuros datos. Como las explicaciones de las tendencias provinciales se redactaron basándose en la información actual, si se añaden más datos en el futuro, estas descripciones se tendrían que volver a modificar manualmente.
                        </p>
                    </div>
                </div>
            </section>

            {/* Acceso Final */}
            <div style={{ textAlign: 'center', margin: '2rem 0 4rem 0' }}>
                <button 
                    className="select-input" 
                    style={{ background: 'var(--bg-accent)', border: 'none', color: '#ffffff', fontWeight: '800', fontFamily: 'var(--font-heading)', padding: '0.9rem 2.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 180, 216, 0.2)' }} 
                    onClick={() => navegar('/dashboard')}
                >
                    ACCEDER A LA CONSOLA DE MANDO ➔
                </button>
            </div>

            {/* Footer Premium */}
            <footer style={{ background: 'var(--bg-card)', borderTop: 'var(--border-glass)', padding: '2.5rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', borderRadius: '12px 12px 0 0', boxShadow: 'var(--box-shadow)' }}>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-text-accent)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Universidad Nacional de San Luis</h5>
                    <p style={{ color: 'var(--color-text-muted)' }}>Facultad de Ciencias Físico, Matemáticas y Naturales</p>
                    <p style={{ color: 'var(--color-text-muted)' }}>Departamento de Informática</p>
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-text-accent)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fundamentos de Ciencia de Datos</h5>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cátedra: Mercedes Barrionuevo, Jorge Arroyuelo y Cristian Tissera</p>
                    <p style={{ color: 'var(--color-text-muted)' }}>Trabajo Final Integrador (2026)</p>
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--color-text-accent)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>INTEGRANTES</h5>
                    <p style={{ color: 'var(--color-text-main)' }}><strong>Ezequiel Bernaldez</strong></p>
                    <p style={{ color: 'var(--color-text-main)' }}><strong>Ezequiel Nodar</strong></p>
                </div>
            </footer>
        </div>
    );
};

export default Portada;
