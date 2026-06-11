import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def crear_reporte_docx():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proyecto_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    docx_path = os.path.join(proyecto_root, "Anexo_Tecnico_Clustering_y_Despliegue.docx")
    
    print(f"Iniciando la creación del documento Word en: {docx_path}")
    doc = docx.Document()
    
    # ------------------ ESTILOS DE FUENTE ------------------
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    
    # Colores institucionales
    COLOR_PRIMARY = RGBColor(11, 19, 43)    # Azul oscuro
    COLOR_SECONDARY = RGBColor(0, 180, 216) # Cian
    
    def add_custom_heading(text, level, space_before=12, space_after=6):
        heading = doc.add_heading(text, level=level)
        heading.paragraph_format.space_before = Pt(space_before)
        heading.paragraph_format.space_after = Pt(space_after)
        heading.paragraph_format.keep_with_next = True
        
        for run in heading.runs:
            run.font.name = 'Arial'
            if level == 1:
                run.font.size = Pt(18)
                run.font.color.rgb = COLOR_PRIMARY
                run.bold = True
            elif level == 2:
                run.font.size = Pt(14)
                run.font.color.rgb = COLOR_SECONDARY
                run.bold = True
            elif level == 3:
                run.font.size = Pt(12)
                run.font.color.rgb = COLOR_PRIMARY
                run.bold = True
                run.italic = True
        return heading

    # ------------------ 1. PORTADA FORMAL DEL TRABAJO ------------------
    for _ in range(3):
        doc.add_paragraph()
        
    p_institution = doc.add_paragraph()
    p_institution.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_inst = p_institution.add_run("UNIVERSIDAD NACIONAL DE SAN LUIS\nFacultad de Ciencias Físico Matemáticas y Naturales\nDepartamento de Informática")
    run_inst.font.size = Pt(12)
    run_inst.font.color.rgb = COLOR_PRIMARY
    run_inst.bold = True
    
    for _ in range(4):
        doc.add_paragraph()
        
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("TABLERO DE CONTROL DE GESTIÓN Y PRIORIZACIÓN DEL DELITO AUTOMOTOR")
    run_title.font.size = Pt(20)
    run_title.font.color.rgb = COLOR_PRIMARY
    run_title.bold = True
    
    p_subtitle = doc.add_paragraph()
    p_subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_subtitle.add_run(
        "Documentación Técnica y Fundamentación de Indicadores de Alerta Federal\n"
        "Espacio Curricular: Fundamentos de Ciencia de Datos (2026)\n"
        "Integrantes: Ezequiel Bernaldez, Ezequiel Nodar"
    )
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(100, 100, 100)
    
    for _ in range(5):
        doc.add_paragraph()
        
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_meta = p_meta.add_run(
        "Materia: Fundamentos de Ciencia de Datos\n"
        "Estudiantes: Ezequiel Bernaldez, Ezequiel Nodar\n"
        "Cátedra: Prof. Barrionuevo Mercedes, Prof. Arroyuelo Jorge\n"
        "Año: 2026\n"
        "San Luis, Argentina"
    )
    run_meta.font.size = Pt(11)
    run_meta.font.color.rgb = COLOR_PRIMARY
    
    doc.add_page_break()
    
    # ------------------ 2. INTRODUCCIÓN ------------------
    add_custom_heading("1. Portada e Introducción Institucional", level=1)
    
    p = doc.add_paragraph(
        "El presente reporte documenta el desarrollo y despliegue del Sistema Federal de Monitoreo y Priorización "
        "del Delito Automotor (SFM-DA), estructurado como un entregable formal y estratégico de alto nivel dirigido al "
        "Ministerio de Seguridad de la Nación. Su objetivo primordial es consolidar un panel de control interactivo que "
        "elimine los sesgos tradicionales en la evaluación de la eficiencia policial, permitiendo priorizar las políticas "
        "públicas de seguridad y patrullaje preventivo en las 24 jurisdicciones de la República Argentina."
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "La interfaz del tablero de control de gestión se inicia con una portada formal e institucional interactiva que presenta "
        "el título, los integrantes del grupo técnico (Ezequiel Bernaldez, Ezequiel Nodar), la materia académica de sustento "
        "(Fundamentos de Ciencia de Datos), el año del estudio (2026) y una breve descripción de la consola que introduce "
        "metodológicamente al auditor en los objetivos operativos del Ministerio."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 3. TASAS NORMALIZADAS Y METODOLOGÍA ------------------
    add_custom_heading("2. Fundamentación de las Tasas Normalizadas y Normalización del Agrupamiento", level=1)
    
    p = doc.add_paragraph(
        "La evaluación tradicional de la eficiencia en recuperación vehicular basada puramente en volúmenes absolutos "
        "o en tasas porcentuales directas resulta sesgada e inadecuada para la toma de decisiones ministeriales. Si una "
        "jurisdicción pequeña registra 10 robos y recupera 5, presenta una tasa de recupero del 50%. De igual modo, una "
        "gran provincia con 10.000 robos que recupera 5.000 vehículos figura con la misma tasa del 50%. No obstante, a "
        "escala gubernamental, el impacto social, económico y de desprotección asociado a dejar 5.000 vehículos sustraídos "
        "en circulación ilegal es inmensamente más crítico que dejar 5."
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "Para mitigar este sesgo de escala y permitir un análisis riguroso de la situación federal, se implementó una "
        "metodología basada estrictamente en la eficiencia de la recuperación, evaluando el desempeño local de cada jurisdicción:"
    )
    p.paragraph_format.space_after = Pt(6)
    
    add_custom_heading("2.1 Tasa de Recuperación Suavizada (Suavizado Bayesiano)", level=2)
    
    p = doc.add_paragraph(
        "La tasa de recuperación tradicional presenta una gran volatilidad ('problema de los números pequeños') en "
        "jurisdicciones con bajo volumen de denuncias. Por ejemplo, una provincia con 2 robos que registre 2 recuperos "
        "mostraría un 100% de eficiencia, distorsionando el modelo. Para corregir este ruido, se aplica un suavizado "
        "bayesiano (Laplace smoothing) que atrae las tasas con muestras reducidas hacia la media histórica nacional "
        "de control (~3.4%):"
    )
    p.paragraph_format.space_after = Pt(6)
    
    p_math1 = doc.add_paragraph()
    p_math1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_m1 = p_math1.add_run("Tasa de Recupero Suavizada = (Recuperos + alpha) / (Robos + beta) * 100")
    run_m1.bold = True
    run_m1.font.size = Pt(12)
    p_math1.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "donde los hiperparámetros se definieron en alpha = 3.0 y beta = 100.0, reflejando el promedio de control. "
        "Esto garantiza que provincias con muy baja delincuencia tengan tasas suavizadas estables, mientras que las de "
        "alto flujo delictivo como Buenos Aires retengan su tasa real (2.17%)."
    )
    p.paragraph_format.space_after = Pt(10)
    
    add_custom_heading("2.2 Estandarización y Categorización de Intervención", level=2)
    
    p = doc.add_paragraph(
        "Posteriormente, aplicamos una estandarización estricta Z-Score sobre la Tasa de Recupero Suavizada "
        "mediante la herramienta StandardScaler para asegurar que el algoritmo K-Means 1D agrupe las provincias "
        "exclusivamente según su efectividad de recuperación. El agrupamiento permite clasificar directamente "
        "a las jurisdicciones en categorías de criticidad (Crítico, Moderado/Bajo, Eficiencia Destacada) "
        "evitando catalogar arbitrariamente con un puntaje numérico individual continuo, lo que facilita "
        "la gestión ministerial enfocada en perfiles homogéneos."
    )
    p.paragraph_format.space_after = Pt(10)
    
    add_custom_heading("2.3 Ajuste de Hiperparámetros (Tuning) y Validación de Clústeres", level=2)
    
    p = doc.add_paragraph(
        "A fin de validar científicamente la elección de la cantidad óptima de agrupaciones (K), se "
        "realizó un análisis de ajuste de hiperparámetros evaluando el comportamiento de la Inercia y el "
        "Coeficiente de Silueta para K entre 2 y 8. Los resultados obtenidos en el espacio unidimensional "
        "de la Tasa de Recuperación Suavizada son los siguientes:"
    )
    p.paragraph_format.space_after = Pt(8)
    
    # Tabla de tuning
    table_tune = doc.add_table(rows=8, cols=3)
    table_tune.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_tune.autofit = True
    
    hdr_cells = table_tune.rows[0].cells
    hdr_cells[0].text = 'Número de Clústeres (K)'
    hdr_cells[1].text = 'Inercia del Modelo'
    hdr_cells[2].text = 'Coeficiente de Silueta'
    
    for cell in hdr_cells:
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(10)
        cell.paragraphs[0].runs[0].font.color.rgb = COLOR_PRIMARY
        
    tuning_data = [
        ('2', '9,7346', '0,7538'),
        ('3 (Óptimo)', '2,2941', '0,6465'),
        ('4', '1,3018', '0,5161'),
        ('5', '0,5981', '0,5351'),
        ('6', '0,3851', '0,5052'),
        ('7', '0,2789', '0,4663'),
        ('8', '0,1831', '0,4681')
    ]
    
    for i, data_row in enumerate(tuning_data):
        cells = table_tune.rows[i+1].cells
        cells[0].text = data_row[0]
        cells[1].text = data_row[1]
        cells[2].text = data_row[2]
        
    for row in table_tune.rows[1:]:
        for cell in row.cells:
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    p = doc.add_paragraph(
        "Análisis y Justificación de la Elección:\n"
        "• Escenario K=2: Aunque presenta el coeficiente de silueta más elevado (0,7538), este escenario separa a la "
        "provincia de Entre Ríos (el valor atípico de alta recuperación) de las otras 23 provincias que quedan "
        "agrupadas en un único clúster. Esto carece de valor operativo para el Ministerio, ya que provincias con muy baja "
        "eficiencia (Corrientes, 1.77%) y provincias moderadamente eficientes (CABA, 9.77%) quedarían bajo el mismo nivel de alerta.\n"
        "• Escenario K=3: Representa el punto de inflexión del 'codo' (Elbow) donde la inercia experimenta un descenso drástico "
        "(de 9,7346 a 2,2941, una caída del 76,4%), al mismo tiempo que retiene un coeficiente de silueta muy robusto (0,6465). "
        "Este modelo resulta en tres niveles claros y de gran utilidad operativa: Nivel Crítico (16 provincias), Nivel Moderado/Bajo "
        "(7 provincias) y Eficiencia Destacada (1 provincia), permitiendo priorizar de forma efectiva.\n"
        "• Escenarios K>=4: Conducen a una fragmentación excesiva de las provincias en sub-grupos, lo que disminuye el "
        "coeficiente de silueta (cae a 0,5161 para K=4) debido al solapamiento de los rangos de recuperación intermedios."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 4. ARQUITECTURA FRONT-END ------------------
    add_custom_heading("3. Estructura y Rediseño de la Consola de Mando", level=1)
    
    p = doc.add_paragraph(
        "La interfaz del tablero de control de gestión fue reestructurada para ajustarse a los requerimientos formales de "
        "evaluación de organismos gubernamentales, optimizando la visibilidad de datos y eliminando ruidos en la navegación:"
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "• Remoción del Módulo CRISP-DM: Se retiró el flujo metodológico interactivo para centrar la consola de mando en "
        "la visualización analítica pura de gestión, trasladando las justificaciones técnicas a este informe.\n"
        "• Eliminación de la Ficha Lateral: Se removió la ficha de control provincial fija que ocupaba espacio de visualización lateral "
        "en la Consola de Mando.\n"
        "• Extensión Horizontal de la Tabla de Alertas (100% Ancho): La tabla 'Ranking Federal de Alertas' "
        "fue extendida horizontalmente a todo lo ancho de la pantalla, facilitando al auditor la lectura lineal completa de robos, "
        "recuperos, tasas de recupero reales y suavizadas, y la categoría de cluster de cada provincia."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 5. SERIE TEMPORAL POR PROVINCIA ------------------
    add_custom_heading("4. Módulo Explorador de Series Temporales Provinciales", level=1)
    
    p = doc.add_paragraph(
        "Para responder a la necesidad de evaluar el comportamiento histórico local en cada jurisdicción, incorporamos en la pestaña "
        "de Análisis de Tendencias un 'Explorador Temporal Provincial' interactivo. Este componente consta de un menú de búsqueda "
        "desplegable conteniendo las 24 provincias normalizadas y un gráfico dinámico multi-eje en Chart.js."
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "Al seleccionar cualquier provincia, el sistema recupera su historial mensual agregando sus variables a lo largo del tiempo "
        "(2020-2026) y grafica:\n"
        "1. Denuncias de Robo (Eje vertical izquierdo, curva roja con sombreado de relleno).\n"
        "2. Comunicaciones de Recupero (Eje vertical derecho, curva verde agua sólida).\n"
        "3. Evolución de la Tasa de Recuperación porcentual a nivel mensual (Curva de trazos amarillos discretos).\n"
        "Esto dota al Ministerio de un análisis de tendencias locales 100% interactivo y de alta granularidad temporal."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 6. CONCENTRACIÓN CON PORCENTAJES ------------------
    add_custom_heading("5. Reporte de Concentración Delictiva con Porcentajes Exactos", level=1)
    
    p = doc.add_paragraph(
        "El análisis exploratorio en la pestaña de tendencias reporta ahora el porcentaje exacto de incidencia delictiva "
        "que cada una de las 24 provincias representa sobre el volumen total nacional acumulado. Este reporte combina un gráfico "
        "de rosca de alta fidelidad visual y una tabla interactiva con barras de progreso de micro-escala:"
    )
    p.paragraph_format.space_after = Pt(10)
    
    # Tabla de concentraciones
    table_pct = doc.add_table(rows=6, cols=3)
    table_pct.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_pct.autofit = True
    
    hdr_cells = table_pct.rows[0].cells
    hdr_cells[0].text = 'Jurisdicción'
    hdr_cells[1].text = 'Robos Acumulados'
    hdr_cells[2].text = 'Porcentaje de Incidencia Nacional (%)'
    
    for cell in hdr_cells:
        cell.paragraphs[0].runs[0].font.bold = True
        cell.paragraphs[0].runs[0].font.size = Pt(10)
        cell.paragraphs[0].runs[0].font.color.rgb = COLOR_PRIMARY
        
    rows_pct = [
        ('BUENOS AIRES', '156.808', '67,03%'),
        ('CIUDAD AUTÓNOMA DE BUENOS AIRES', '28.434', '12,15%'),
        ('CÓRDOBA', '19.631', '8,39%'),
        ('SANTA FE', '11.253', '4,81%'),
        ('MENDOZA', '10.977', '4,69%')
    ]
    
    for i, data_row in enumerate(rows_pct):
        cells = table_pct.rows[i+1].cells
        cells[0].text = data_row[0]
        cells[1].text = data_row[1]
        cells[2].text = data_row[2]
        
    for row in table_pct.rows[1:]:
        for cell in row.cells:
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "Este desglose porcentual exhaustivo evidencia una hiper-concentración del delito: solo 5 provincias concentran el 97,07% "
        "de la sustracción del parque automotor de toda la República Argentina, justificando de forma inmediata la centralización "
        "geográfica de presupuestos especiales de seguridad pública."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 7. MODELO CLUSTERING ------------------
    add_custom_heading("6. Modelo de Machine Learning K-Means y Clasificación de Riesgo de Recuperación", level=1)
    
    p = doc.add_paragraph(
        "Al entrenar el modelo K-Means 1D con los datos normalizados de la Tasa de Recupero Suavizada de las 24 provincias "
        "de la República Argentina, el coeficiente de silueta promedio alcanzó un valor excelente de 0,6465, lo que valida "
        "la rigurosidad del agrupamiento en base al desempeño. Las provincias se clasificaron en tres dinámicas estables:"
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "1. Clúster de Nivel de Intervención Crítico (16 Provincias): Corrientes, Buenos Aires, San Luis, Santa Fe, Mendoza, "
        "Tierra del Fuego, La Rioja, Chaco, Córdoba, Formosa, Santiago del Estero, San Juan, Tucumán, La Pampa, Santa Cruz "
        "y Catamarca. Se caracterizan por tener las tasas de recuperación suavizadas más deficientes (inferiores al 5.0%). "
        "Requieren de forma urgente la conformación de comités de auditoría de trámites locales y controles camineros.\n"
        "2. Clúster de Nivel de Eficiencia en Recupero Destacada (1 Provincia): Entre Ríos. Presenta la tasa de recuperación más "
        "eficiente del país (16,92% suavizada, 18,91% bruta), destacándose por su perfil particular de alta efectividad operativa vial.\n"
        "3. Clúster de Nivel de Intervención Moderado / Bajo (7 Provincias): Río Negro, Misiones, Jujuy, Chubut, Neuquén, Salta "
        "y Ciudad Autónoma de Buenos Aires. Jurisdicciones con niveles de efectividad de recuperación estables o moderados "
        "(tasas suavizadas entre 5,5% y 10,0%). Presentan riesgos bajo control operativo ordinario (CABA registra 9.77% suavizada)."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 8. ESTUDIO DE IMPACTO DE GESTIÓN (NUEVO) ------------------
    add_custom_heading("7. Estudio de Impacto de Gestión y Cambio de Gobierno", level=1)
    
    p = doc.add_paragraph(
        "A fin de evaluar la hipótesis sobre si la transición de gestión gubernamental (10 de Diciembre de 2023) "
        "impactó en el comportamiento y desempeño del delito automotor y en las tareas de recuperación vehicular, "
        "se incorporó un análisis comparativo dinámico comparando dos grandes periodos:\n"
        "• Gestión Anterior: Enero 2020 a Noviembre 2023 (47 meses).\n"
        "• Gestión Actual: Diciembre 2023 a Abril 2026 (29 meses)."
    )
    p.paragraph_format.space_after = Pt(10)
    
    p = doc.add_paragraph(
        "Los principales hallazgos a nivel consolidado federal demuestran que:\n"
        "1. Flujo de Sustracciones (Robos): Se registró un incremento en la media de denuncias mensuales, pasando de "
        "2.839,0 robos al mes en la gestión anterior a 3.465,9 robos mensuales en la gestión actual (+22,1%). Esto "
        "evidencia una mayor presión delictiva a nivel nacional.\n"
        "2. Eficiencia en la Recuperación: La tasa de recupero nacional promedio experimentó un incremento marginal, "
        "pasando del 3,35% en la gestión anterior al 3,57% en la gestión actual. A pesar del incremento en el volumen absoluto "
        "de delitos, los mecanismos policiales y judiciales de recupero e inscripción registral mantuvieron e incrementaron "
        "su efectividad media."
    )
    p.paragraph_format.space_after = Pt(10)
    
    # ------------------ 9. CONCLUSIONES ------------------
    add_custom_heading("8. Conclusiones Estratégicas para Seguridad Pública", level=1)
    
    p = doc.add_paragraph(
        "• Redirección de Recursos Operativos: La categorización de criticidad basada en la tasa de recuperación suavizada "
        "orienta al Ministerio para concentrar auditorías y control de autopartes en las jurisdicciones del Nivel Crítico "
        "(como Corrientes o Buenos Aires) en lugar de guiarse únicamente por volúmenes absolutos.\n"
        "• Replicabilidad del Caso Entre Ríos: El modelo identifica a Entre Ríos como un referente federal de recuperación vehicular. "
        "Estudiar sus métodos de patrullaje rural y puestos camineros de control fronterizo vial provee un marco estratégico de políticas "
        "aplicable a Santa Fe o Córdoba para salir de la zona de intervención crítica.\n"
        "• Solidez de Datos: La unificación de nombres provinciales (CABA) y la carga directa de registros sanitizados en base de datos "
        "SQLite eliminan las inconsistencias por asimetrías geográficas y volumen muestral, dotando de trazabilidad absoluta y reproducibilidad "
        "científica al estudio federal interanual."
    )
    p.paragraph_format.space_after = Pt(10)
    
    doc.save(docx_path)
    print(f"¡Documento Word Anexo_Tecnico_Clustering_y_Despliegue.docx creado y guardado exitosamente!")

if __name__ == "__main__":
    crear_reporte_docx()
