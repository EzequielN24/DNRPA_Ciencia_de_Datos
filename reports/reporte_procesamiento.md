# Reporte CRISP-DM: Análisis, Normalización y Agrupamiento de Robos/Recuperos (2020-2026)
**Curso**: Fundamentos de Ciencia de Datos  
**Institución**: Universidad Nacional de San Luis (UNSL)  
**Tema**: Trabajo Final Integrador 2026 - Análisis y Agrupamiento de Robos y Recuperos de Vehículos en Argentina  
**Autores**: Ezequiel Bernaldez, Ezequiel Nodar  

---

## 1. Fase de Preparación de Datos (Data Preparation)
- **Rango Temporal del Estudio**: Enero 2020 a Abril 2026.
- **Registros Totales Consolidados**: 242,000+ registros unificados y procesados dinámicamente.
- **Registros Sanitizados**:
  - Deduplicación física de registros duplicados exactos.
  - **Eliminación de IDs**: Se removieron las columnas de identificadores redundantes `titular_domicilio_provincia_id` y `titular_pais_nacimiento_id` para optimizar el dataset final y evitar colinealidad.
- **Tratamiento y Concordancia de Formatos**:
  - **Estructura Estricta de CSV**: Los strings, textos y campos no numéricos (incluidas las fechas) fueron englobados en comillas dobles (`""`), y los campos puramente numéricos (años, códigos, porcentajes) se guardaron sin comillas.
  - **Normalización Textual**: Las columnas de texto se unificaron a mayúsculas, removiendo espacios adicionales y controlando nulos.
  - **Formateo de Fechas**: Se garantizó el formato estricto `AAAA-MM-DD` (ej. `"2023-01-02"`) para `tramite_fecha` e `fecha_inscripcion_inicial`.
  - **Tipado de Números**: Se convirtieron los códigos y años enteros a tipo `Int64` para remover decimales innecesarios (como `.0`), y se preservó el float en porcentajes.
  - **Validación Temporal**: Todas las fechas se validaron dentro del rango temporal del proyecto (2020-2026).

---

## 2. Indicadores Clave Calculados (Data Understanding)
- **Volumen Total de Robos (2020-2026)**: 233,946 denuncias de robo.
- **Volumen Total de Recuperos (2020-2026)**: 8,058 comunicaciones de recupero.
- **Tasa de Recupero Promedio Nacional**: 3.4444% (real).
- **Provincia con Mayor Tasa de Recuperación**: ENTRE RÍOS (18.91% real; 16.92% suavizada bayesiana; 698 robos, 132 recuperos).
- **Provincia con Menor Tasa de Recuperación**: LA RIOJA y TIERRA DEL FUEGO (Tasas reales bajas y suavizadas en torno al ~3.3%).
- **Situación en la Jurisdicción Local (San Luis)**: SAN LUIS presenta 330 denuncias de robo y 8 recuperos registrados, con una tasa real de 2.42% y suavizada de 2.56% (clasificada en Nivel de Intervención Crítico debido a su baja tasa de recuperación).
- **Concentración del Delito**: La Provincia de BUENOS AIRES concentra la gran mayoría de la actividad delictiva automotor nacional con 156,808 robos (67.03% del total nacional) y una tasa de recupero real de 2.17%. CABA representa el 12.15% con 28,434 robos. Entre las 5 provincias más afectadas concentran el 97.07% del delito a nivel país.

---

## 3. Fase de Modelado (Clustering) y Evaluación
Se entrenó el algoritmo de agrupamiento K-Means ($K=3$) sobre las 24 provincias argentinas empleando únicamente una variable normalizada y suavizada para evitar sesgos poblacionales y geográficos:
- **Tasa de Recuperación Suavizada (Bayesiana)**: $\frac{\text{Recuperos} + 3.0}{\text{Robos} + 100.0} \times 100$, que penaliza las variaciones por muestras pequeñas en provincias de baja densidad criminal.

De este modo, tanto los clústeres como el nivel de criticidad de intervención del Ministerio de Seguridad de la Nación dependen exclusivamente del desempeño de recuperación y no de las tasas brutas de robos, evitando penalizar injustamente a provincias densamente pobladas y permitiendo enfocar las auditorías de gestión en aquellas jurisdicciones con menor tasa de recupero.

### Ajuste de Hiperparámetros (Tuning) y Validación de Clústeres
Para validar científicamente la elección de la cantidad óptima de agrupaciones (K), se evaluó el comportamiento de la Inercia y el Coeficiente de Silueta para K entre 2 y 8:

| Número de Clústeres (K) | Inercia del Modelo | Coeficiente de Silueta |
| :---: | :---: | :---: |
| 2 | 9.7346 | **0.7538** |
| **3 (Óptimo)** | **2.2942** | **0.6465** |
| 4 | 1.3018 | 0.5161 |
| 5 | 0.5981 | 0.5351 |
| 6 | 0.3851 | 0.5052 |
| 7 | 0.2789 | 0.4663 |
| 8 | 0.1831 | 0.4681 |

* **Justificación de K=3**:
  * **Inercia y Codo**: K=3 representa el punto de "codo" óptimo, logrando un descenso drástico en la inercia (de 9.7346 a 2.2942, una caída del 76.4%).
  * **Coeficiente de Silueta**: Mantiene un valor de **0.6465**, reflejando una excelente definición y separación de clusters en el espacio 1D.
  * **Utilidad Operativa**: Aunque K=2 reporta un coeficiente de silueta más alto (0.7538), esto se debe únicamente a que aísla a la provincia de Entre Ríos (outlier con 16.92% de recupero) y agrupa a las otras 23 provincias en un solo clúster gigante. Esto carece de valor para el Ministerio, ya que agrupa indiscriminadamente a Buenos Aires (2.17%) y CABA (9.77%). El escenario K=3 provee un agrupamiento de gran valor de gestión, distinguiendo perfiles de intervención Críticos (16), Moderados/Bajos (7) y Destacados (1).

### Resultados de la Evaluación del Agrupamiento (K=3)
- **Inercia del Modelo**: 2.2942 (sobre la feature 1D escalada)
- **Coeficiente de Silueta**: **0.6465** (confirmando un agrupamiento altamente robusto).
- **Características de los Clústeres**:
  - **NIVEL DE INTERVENCIÓN CRÍTICO (16 provincias)**: Corrientes, Buenos Aires, San Luis, Santa Fe, Mendoza, Tierra del Fuego, La Rioja, Chaco, Córdoba, Formosa, Santiago del Estero, San Juan, Tucumán, La Pampa, Santa Cruz y Catamarca. Jurisdicciones con tasas de recuperación suavizadas muy deficientes (inferiores al 5.0%). Requieren de forma urgente auditorías operativas en seccionales locales e inteligencia sobre mercados de autopartes.
  - **NIVEL DE EFICIENCIA EN RECUPERO DESTACADA (1 provincia)**: Entre Ríos. Destaca por una tasa de recupero sobresaliente (16.92% suavizada, 18.91% bruta) debido a sus excelentes controles camineros.
  - **NIVEL DE INTERVENCIÓN MODERADO / BAJO (7 provincias)**: Río Negro, Misiones, Jujuy, Chubut, Neuquén, Salta y Ciudad Autónoma de Buenos Aires. Jurisdicciones con niveles estables de recuperación vehicular (tasas suavizadas entre 5.5% y 10.0%). Presentan riesgos bajo control operativo ordinario. CABA queda clasificada en esta categoría con un recupero suavizado del 9.77%.
