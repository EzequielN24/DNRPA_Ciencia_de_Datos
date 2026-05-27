---
name: ciencia-de-datos
description: Procesa, sanitiza, unifica y modela datos de robos y recuperos de la DNRPA (2020-2026) aplicando la metodología CRISP-DM y agrupamiento por Clustering de eficiencia.
---

# Ciencia de Datos (CRISP-DM - Robos y Recuperos)

## Cuándo usar este skill
- Para el desarrollo del Trabajo Final Integrador de Fundamentos de Ciencia de Datos (UNSL).
- Al realizar la limpieza, preparación, unificación y análisis exploratorio del dataset de la DNRPA sobre robos y recuperos de vehículos en Argentina (2020-2026).
- Al modelar perfiles de eficiencia regional o temporal en el recupero de vehículos utilizando técnicas de **Clustering** (Aprendizaje No Supervisado).
- Al generar visualizaciones interactivas y reportes analíticos para el despliegue del proyecto en el sitio web final.

## Inputs necesarios
- **Dataset de origen (DNRPA)**: Carpeta con los archivos CSV mensuales (ej. `dnrpa-robos-recuperos-autos-202301.csv`, etc.).
- **Rango Temporal**: Rango de análisis (1/1/2020 al 30/4/2026).
- **Parámetros del Modelo**: Semilla fija (`random_state`) y número de clústeres esperado (K) para el agrupamiento.

## Metodología de Proceso (CRISP-DM)

### 1. Comprensión del Negocio (Business Understanding)
- **Objetivo**: Evaluar y comparar la eficiencia en el recupero de vehículos robados a nivel geográfico (provincias) y temporal (meses/períodos) en Argentina.
- **Métricas de negocio**: Tasa de recupero (Relación entre trámites de Recupero frente a Robos) e Índice de delincuencia automotor por habitante (opcional, si se integran datos poblacionales del INDEC).
- **Público Objetivo**: Ministerios de seguridad, gobiernos provinciales, compañías de seguros y ciudadanos.

### 2. Comprensión de los Datos (Data Understanding)
- **Exploración Inicial**: Perfilado de las 25 variables provistas por la DNRPA (tipo de trámite, provincia del registro, marca, modelo, uso, año modelo, género del titular, edad, etc.).
- **Detección de anomalías**: Identificar inconsistencias en campos críticos (ej. fechas de inscripción inicial inconsistentes, años modelo futuros o nulos, provincias mal codificadas).

### 3. Preparación de los Datos (Data Preparation)
- **Unificación Dinámica e Interanual**: Consolidar en un único dataframe todos los archivos CSV mensuales detectados de forma recursiva en el directorio del proyecto, permitiendo la escalabilidad para integrar 5 o más años de datos (consecutivos o no).
- **Sanitización y Limpieza Estricta**:
  - Eliminar registros duplicados y corregir valores nulos en columnas clave (`tramite_tipo`, `tramite_fecha`, `registro_seccional_provincia`).
  - Estandarizar textos (remover espacios adicionales, normalizar caracteres especiales y unificar mayúsculas/minúsculas).
  - **Eliminación de IDs**: Eliminar del dataset final columnas de identificadores que no aportan valor analítico o que resultan redundantes para el tratamiento y modelado de datos, específicamente `titular_domicilio_provincia_id` y `titular_pais_nacimiento_id`.
  - **Concordancia de Formatos y Tipos**:
    - **Fechas**: Asegurar el formato estricto `AAAA-MM-DD` (ej. `2023-01-25`) para `tramite_fecha` e `fecha_inscripcion_inicial`.
    - **Números**: Conversión rigurosa de columnas numéricas (`automotor_anio_modelo`, `titular_anio_nacimiento`, `titular_porcentaje_titularidad`, etc.) a sus respectivos formatos numéricos correspondientes, eliminando decimales en campos que representen años u códigos enteros.
    - **Strings y Formato CSV**: Forzar que todos los campos de tipo string/texto y no-numéricos en el CSV de salida queden estrictamente englobados entre comillas dobles (`""`), permitiendo una correcta lectura estándar.
  - **Tratamiento de Outliers y Anomalías**:
    - **Año de Modelo (`automotor_anio_modelo`)**: Identificar modelos atípicos o imposibles (años menores a `1960` o mayores a `2027`). Los outliers identificados y los valores faltantes se imputan utilizando la mediana histórica (`2009.0`) para evitar sesgos y mantener coherencia temporal.
    - **Año de Nacimiento del Titular (`titular_anio_nacimiento`)**: Detectar edades inconsistentes (años de nacimiento anteriores a `1920` -edad mayor a 106 años- o posteriores a `2009` -menores de 17 años-). Los outliers y valores faltantes se imputan utilizando la mediana poblacional (`1980.0`).
    - **Porcentaje de Titularidad (`titular_porcentaje_titularidad`)**: Aplicar recorte por límites (*capping*) para restringir los valores estrictamente en el rango lógico de `[0.0, 100.0]`.
  - **Anonimización**: Descartar o no incluir datos que puedan vulnerar la privacidad de los titulares.
- **Enriquecimiento (Ingeniería de Características)**:
  - Extraer características temporales (`año`, `mes`, `trimestre`) de la fecha del trámite.
  - Calcular la **tasa de recupero** por provincia y período: `(Recuperos / Robos) * 100`.
- **Almacenamiento**: Generar el dataset final limpio unificado en formato `.csv` o `.parquet`.

### 4. Modelado (Modeling)
- **Algoritmo de Clustering**: Aplicar K-Means u otro algoritmo de agrupamiento sobre las provincias o períodos.
- **Variables del modelo**:
  - Tasa de recuperación de vehículos.
  - Volumen absoluto de robos por provincia.
  - Distribución por tipo de vehículo y uso predominante.
- **Reproducibilidad**: Forzar el uso de `random_state` fijo.

### 5. Evaluación (Evaluation)
- **Métricas de Calidad**: Evaluar el agrupamiento usando el método del codo (Elbow Method) y la puntuación de Silueta (Silhouette Score).
- **Interpretación del Perfil**: Describir y perfilar semánticamente cada clúster (ej. *Clúster 1: Alta tasa de recupero y bajo volumen*, *Clúster 2: Baja eficiencia y alta tasa de robo*).
- **Contraste con Objetivos**: Validar si las agrupaciones responden adecuadamente a las preguntas de investigación formuladas.

### 6. Despliegue (Deployment)
- **Sitio Web e Interactividad**: Estructurar los resultados para integrarlos en el dashboard del sitio web (HTML/CSS/JS o Streamlit).
- **Estructura del Reporte Final**: Planificar el documento en PDF de 8 a 15 páginas respetando las directrices de la consigna.

---

## Checklist de Calidad
- [x] Estructura alineada en un 100% con las 6 fases de la metodología CRISP-DM.
- [x] Lógica de consolidación dinámica de múltiples CSVs mensuales implementada sin rutas fijas absolutas o nombres rígidos.
- [x] Exclusión de datos personales que comprometan la privacidad y anonimización de titulares.
- [x] Fijación de semillas estocásticas (`random_state`) en todos los procesos de modelado para asegurar reproducibilidad.
- [x] Validación visual y estadística de los clústeres generados.

---

## Output (formato exacto)

1. **Dataset Unificado y Limpio**: `agent/skills/ciencia-de-datos/recursos/dataset_consolidado.csv`
2. **Reporte de Preparación y Modelado**: Un archivo Markdown en `agent/skills/ciencia-de-datos/recursos/reporte_procesamiento.md` estructurado de la siguiente forma:

```markdown
# Reporte CRISP-DM: Análisis y Agrupamiento de Robos/Recuperos

## 1. Fase de Preparación de Datos (Data Preparation)
- **Archivos CSV Unificados**: [Lista/Cantidad]
- **Registros Totales Consolidados**: [N]
- **Registros Sanitizados/Eliminados**: [N]
- **Tratamiento de Nulos y Duplicados**: [Explicación detallada]

## 2. Indicadores Clave Calculados
- **Tasa de Recupero Promedio Nacional**: [X]%
- **Provincia con Mayor Tasa de Recupero**: [Provincia] ([X]%)
- **Provincia con Menor Tasa de Recupero**: [Provincia] ([X]%)

## 3. Fase de Modelado (Clustering - K-Means)
- **Número de Clústeres (K) óptimo**: [K]
- **Métricas de Evaluación**:
  - Silhouette Score: [Valor]
  - Inercia (WCSS): [Valor]

## 4. Perfiles de Clústeres Identificados
- **Clúster 0**: [Descripción y Provincias asociadas]
- **Clúster 1**: [Descripción y Provincias asociadas]
- **Clúster 2**: [Descripción y Provincias asociadas]
```
