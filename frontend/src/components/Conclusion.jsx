import React from 'react';

const Conclusion = () => {
    return (
        <div className="section-content active" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                <h2>Conclusiones del Proyecto</h2>
                <p>Síntesis de hallazgos del análisis de robos y recuperos de vehículos (2020-2026), resolución de hipótesis y limitaciones.</p>
            </div>

            {/* Bloque de Conclusión Oficial (Verbatim del PDF) */}
            <div className="glass-card" style={{ borderLeft: '6px solid var(--bg-accent)', marginBottom: '2rem', padding: '2rem', background: '#ffffff', boxShadow: 'var(--box-shadow)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '1.2rem', fontWeight: '700' }}>
                    Conclusión del Trabajo Final Integrador
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--color-text-main)', textAlign: 'justify' }}>
                    <p>
                        El presente proyecto permitió analizar el fenómeno del robo y recupero de vehículos en Argentina en el periodo 2020 - 2026. A través de las etapas de recolección, limpieza, integración y análisis de datos, fue posible identificar patrones geográficos y temporales relevantes, así como diferencias significativas entre provincias en términos de volumen de robos y eficiencia de recupero. Los resultados evidenciaron una fuerte concentración del delito automotor en un reducido grupo de jurisdicciones y permitieron detectar comportamientos diferenciados que no resultan visibles al observar únicamente los valores absolutos.
                    </p>
                    <p>
                        La aplicación de técnicas de análisis exploratorio y Machine Learning aportó herramientas adicionales para comprender el fenómeno. En particular, el uso de clustering permitió clasificar las provincias según su nivel de eficiencia en el recupero de vehículos, facilitando la identificación de jurisdicciones que requieren una mayor atención o que presentan desempeños destacados.
                    </p>
                    <p>
                        Asimismo, el desarrollo del sistema web SFM-DA permitió transformar los resultados obtenidos en una herramienta interactiva de consulta y visualización, facilitando el acceso a la información y promoviendo una toma de decisiones basada en datos.
                    </p>
                </div>
            </div>

            {/* Hallazgos Principales */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '1.2rem', fontWeight: '700' }}>
                    Hallazgos Principales del Análisis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-main)', textAlign: 'justify' }}>
                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: '600' }}>
                            Relación Temporal entre Robos y Recuperos
                        </h4>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                            A nivel general, se observa una correlación directa en la evolución temporal: <strong>a medida que crece el volumen de robos, también se incrementa la cantidad absoluta de recuperos</strong>. Esta dinámica puede apreciarse de forma clara en la sección de tendencias históricas, donde la representación en doble eje Y muestra curvas que se mueven en la misma dirección ante variaciones estacionales o de mediano plazo, reflejando que el despliegue operativo policial y judicial de recupero responde proporcionalmente a la demanda delictiva, aunque con tasas de eficiencia porcentual dispares por jurisdicción.
                        </p>
                    </div>
                    
                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: '600' }}>
                            Perfil de Vehículos Más Afectados
                        </h4>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                            El delito automotor exhibe una marcada selectividad comercial. Las cinco marcas más robadas son <strong>Volkswagen (16,5%), Fiat (14,2%), Chevrolet (12,8%), Renault (11,5%) y Ford (10,1%)</strong>, concentrando conjuntamente cerca del 65% de la siniestralidad. Asimismo, la antigüedad promedio de las unidades sustraídas ronda los 15 años (modelos correspondientes al año 2011), lo que descarta la hipótesis de que el robo afecte principalmente a vehículos nuevos y sugiere que la motivación principal está ligada a abastecer el mercado ilegal de autopartes y repuestos usados.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--bg-accent)', fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: '600' }}>
                            Tasa de Robo por Unidad de Densidad
                        </h4>
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                            Con el fin de incorporar una perspectiva territorial al análisis, se calculó la Tasa de Robo por Unidad de Densidad Poblacional, que relaciona la cantidad de robos con la densidad demográfica de cada provincia. Este indicador permitió identificar diferencias que no se observan al analizar únicamente los robos absolutos. Por ejemplo, CABA concentró el 12,2% de los robos nacionales pero obtuvo una tasa de 1,8 debido a su alta densidad poblacional, mientras que Santa Cruz, con apenas el 0,1% de los robos, alcanzó una tasa de 136 por su baja densidad demográfica. Esto refleja que, aunque hay muchos robos en volumen absoluto, la probabilidad de robo en relación con la altísima concentración de personas en ese pequeño espacio es menor.
                        </p>
                    </div>
                </div>
            </div>

            {/* Limitaciones (Verbatim del PDF) */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '1.2rem', fontWeight: '700' }}>
                    Limitaciones del Proyecto
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-main)', textAlign: 'justify' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-main)' }}>
                        Si bien el proyecto permitió obtener resultados relevantes sobre el robo y recupero de vehículos en Argentina, es importante considerar algunas limitaciones asociadas a los datos y a la implementación realizada:
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <li>
                            <strong>Dependencia de los datos registrados:</strong> El análisis se basa exclusivamente en los robos y recuperos informados en los registros de la DNRPA. Por lo tanto, aquellos hechos que no fueron denunciados o registrados no forman parte del estudio.
                        </li>
                        <li>
                            <strong>Información limitada sobre los hechos:</strong> La base de datos utilizada no incluye detalles específicos del robo, como ubicación exacta, modalidad delictiva, horario o nivel de violencia involucrado. Esto limita la posibilidad de realizar análisis más profundos sobre las circunstancias de los delitos.
                        </li>
                        <li>
                            <strong>Escalabilidad del tablero:</strong> Si bien la plataforma permite incorporar nuevos datos, algunas interpretaciones y descripciones incluidas en el sistema fueron elaboradas a partir del conjunto de datos actual. En consecuencia, ante futuras actualizaciones de la información, ciertos contenidos deberían revisarse y ajustarse manualmente.
                        </li>
                        <li>
                            <strong>Ausencia de variables externas:</strong> El análisis se realizó únicamente con información proveniente de la DNRPA. Factores que podrían influir en el fenómeno, como variables socioeconómicas, indicadores de seguridad, densidad vehicular o recursos policiales disponibles, no fueron considerados en el presente trabajo.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Trabajo Futuro y Posibles Mejoras (Verbatim del PDF) */}
            <div className="glass-card" style={{ marginBottom: '2.5rem', padding: '2rem', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-text-main)', marginBottom: '1.2rem', fontWeight: '700' }}>
                    Trabajo Futuro y Mejoras Propuestas
                </h3>
                <div style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-muted)', textAlign: 'justify' }}>
                    <p style={{ margin: 0 }}>
                        Como trabajo futuro, podría ampliarse el análisis incorporando variables socioeconómicas, indicadores de seguridad provinciales u otras fuentes de información que permitan enriquecer los modelos y mejorar la capacidad explicativa de los resultados obtenidos.
                    </p>
                </div>
            </div>

            {/* Resolución de Preguntas de Portada */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
                    Resolución de Preguntas Planteadas en Portada
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                    
                    {/* Pregunta 1 */}
                    <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '12px', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '0.6rem', fontWeight: '700' }}>
                            ¿Cuáles son las jurisdicciones con mayor índice de criticidad y prioridad de intervención a nivel federal?
                        </h4>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-muted)', textAlign: 'justify', margin: 0 }}>
                            Las jurisdicciones identificadas con el mayor índice de criticidad son aquellas pertenecientes al clúster de <strong>Nivel de Intervención Crítico</strong> (16 provincias). Entre ellas destacan Buenos Aires (tasa de recupero acumulada de 2,17%), Córdoba, Santa Fe y Mendoza. Estas provincias no solo presentan las eficiencias más bajas en la recuperación vehicular, sino que también registran el mayor volumen de siniestros, convirtiéndose en el área prioritaria para la distribución de recursos del Ministerio.
                        </p>
                    </div>

                    {/* Pregunta 2 */}
                    <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '12px', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '0.6rem', fontWeight: '700' }}>
                            ¿Existe una concentración geográfica marcada del delito automotor en la República Argentina?
                        </h4>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-muted)', textAlign: 'justify', margin: 0 }}>
                            Sí, existe una concentración extrema. La provincia de <strong>Buenos Aires representa por sí sola aproximadamente el 67%</strong> de los robos de todo el país, seguida por la Ciudad Autónoma de Buenos Aires (CABA), Córdoba, Santa Fe y Mendoza. En contraste, provincias como La Rioja, Catamarca y Tierra del Fuego muestran cifras delictivas absolutas sumamente bajas, lo que evidencia que el delito automotor es un fenómeno altamente concentrado en los distritos metropolitanos más densos.
                        </p>
                    </div>

                    {/* Pregunta 3 */}
                    <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '12px', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '0.6rem', fontWeight: '700' }}>
                            ¿Cómo ha evolucionado la tasa de recuperación vehicular a lo largo del tiempo y cómo impacta la transición entre gestiones de gobierno?
                        </h4>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-muted)', textAlign: 'justify', margin: 0 }}>
                            La tasa promedio nacional de recuperación histórica es del 3,44%. Con el cambio de gestión en diciembre de 2023, la media mensual de robos se incrementó un 22,1%, reflejando tensiones socioeconómicas. No obstante, se registró un <strong>impacto positivo moderado en la eficiencia de recupero</strong>, que se elevó de un promedio de 3,35% (gestión 2020-2023) a un 3,57% (gestión 2023-2026), experimentando picos de rendimiento por encima del 7% hacia fines de 2025 y principios de 2026.
                        </p>
                    </div>

                    {/* Pregunta 4 */}
                    <div className="glass-card" style={{ padding: '1.8rem', borderRadius: '12px', background: '#ffffff', border: 'var(--border-glass)', boxShadow: 'var(--box-shadow)' }}>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '0.6rem', fontWeight: '700' }}>
                            ¿Qué perfiles de provincias pueden identificarse agrupándolas mediante técnicas de aprendizaje automático (K-Means)?
                        </h4>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--color-text-muted)', textAlign: 'justify', margin: 0 }}>
                            El algoritmo de clustering identificó 3 perfiles claros basados en la Tasa de Recupero Suavizada:
                            <br />
                            • <strong>Nivel de Intervención Crítico (16 provincias):</strong> Encabezadas por Buenos Aires y las principales provincias del interior, con eficiencias menores al 5%.
                            <br />
                            • <strong>Nivel de Intervención Moderado / Bajo (7 provincias):</strong> Como CABA, Salta, Chubut y Neuquén, con tasas intermedias estables (entre 5.5% y 10%).
                            <br />
                            • <strong>Eficiencia en Recupero Destacada (1 provincia):</strong> Entre Ríos, que se posiciona sola en el mapa con un rendimiento excepcional del 18,91% de recupero bruto (16,92% suavizado), sirviendo como caso de éxito para el estudio de políticas viales y operativos de control de rutas.
                        </p>
                    </div>

                </div>
            </div>

            {/* Footer Premium duplicado de Portada para consistencia visual */}
            <footer style={{ background: 'var(--bg-card)', borderTop: 'var(--border-glass)', padding: '2.5rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', borderRadius: '12px 12px 0 0', boxShadow: 'var(--box-shadow)', marginTop: '4rem' }}>
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

export default Conclusion;
