# Reporte CRISP-DM: Análisis y Agrupamiento de Robos/Recuperos

## 1. Fase de Preparación de Datos (Data Preparation)
- **Archivos CSV Unificados**: 12 archivos mensuales correspondientes al año 2023.
- **Registros Totales Consolidados**: 45,966
- **Registros Sanitizados/Eliminados**: 
  - 3 registros eliminados por duplicación exacta.
  - **Eliminación de IDs**: Se eliminaron las columnas de identificadores redundantes `titular_domicilio_provincia_id` y `titular_pais_nacimiento_id` para optimizar el dataset.
- **Tratamiento y Concordancia de Formatos**:
  - **Estructura Estricta de CSV**: Los strings, textos y campos no numéricos (incluidas las fechas) fueron englobados en comillas dobles (`""`), y los campos puramente numéricos (años, códigos, porcentajes) se guardaron sin comillas, de acuerdo con el estándar de tipos de atributos.
  - **Normalización Textual**: Las columnas de texto se unificaron a mayúsculas, removiendo espacios adicionales y controlando nulos.
  - **Formateo de Fechas**: Se garantizó el formato estricto `AAAA-MM-DD` (ej. `"2023-01-02"`) para `tramite_fecha` e `fecha_inscripcion_inicial`.
  - **Tipado de Números**: Se convirtieron los códigos y años enteros a tipo `Int64` para remover decimales innecesarios (como `.0`), y se preservó el float en porcentajes.
  - **Validación Temporal**: Todas las fechas de 2023 se validaron dentro del rango temporal del proyecto (2020-2026).

## 2. Indicadores Clave Calculados (Data Understanding)
- **Volumen Total de Robos (2023)**: 44,608 denuncias de robo.
- **Volumen Total de Recuperos (2023)**: 1,355 comunicaciones de recupero.
- **Tasa de Recupero Promedio Nacional (2023)**: 3.0376%
- **Provincia con Mayor Tasa de Recupero**: ENTRE RÍOS (26.40% de tasa de recupero; 125 robos, 33 recuperos).
- **Provincia con Menor Tasa de Recupero**: LA RIOJA y TIERRA DEL FUEGO (0.00% de tasa de recupero; 13 y 22 robos respectivamente, 0 recuperos).
- **Situación en la Jurisdicción Local (San Luis)**: SAN LUIS presenta 69 denuncias de robo, 2 recuperos registrados, resultando en una tasa del 2.8986%.
- **Concentración del Delito**: La Provincia de BUENOS AIRES concentra la gran mayoría de la actividad delictiva automotor nacional con 30,258 robos registrados (67.8% del total nacional) y una tasa de recupero del 1.74%.

## 3. Próximas Fases: Modelado (Clustering) y Evaluación
Con el dataset unificado y enriquecido (`dataset_consolidado.csv`), la siguiente iteración implementará el algoritmo de Clustering (K-Means) utilizando la biblioteca Scikit-Learn de Python. Las provincias se agruparán según su perfil de volumen de delitos y eficiencia en el recupero, respondiendo a la pregunta de investigación principal del Trabajo Final Integrador.
