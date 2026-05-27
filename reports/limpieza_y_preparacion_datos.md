# Metodología y Reporte de Limpieza y Preparación de Datos
**Curso**: Fundamentos de Ciencia de Datos  
**Institución**: Universidad Nacional de San Luis (UNSL)  
**Tema**: Trabajo Final Integrador 2026 - Análisis y Agrupamiento de Robos y Recuperos de Vehículos en Argentina  
**Autores**: Ezequiel Bernaldez, Ezequiel Nodar  

---

## 1. Introducción y Marco Metodológico (CRISP-DM)
En concordancia con la metodología **CRISP-DM**, la fase de **Preparación de los Datos (Data Preparation)** constituye una de las etapas más críticas para asegurar la validez, representatividad y robustez de los modelos analíticos y de aprendizaje automático posteriores (Clustering). 

Los datos en bruto provistos por la Dirección Nacional de los Registros Nacionales de la Propiedad del Automotor (DNRPA) para el año 2023 presentaban diversas inconsistencias:
* Dispersión de la información en 12 archivos mensuales CSV independientes.
* Registros duplicados exactos.
* Ausencia de estandarización en textos, codificaciones regionales y formatos de fecha.
* Valores faltantes (nulos) en variables continuas y categóricas.
* Anomalías y valores atípicos (*outliers*) en variables cuantitativas (años de modelo y nacimiento).
* Presencia de identificadores numéricos redundantes.

Este documento detalla específicamente los métodos aplicados, su justificación científica y los resultados cuantitativos del procesamiento de sanitización y limpieza implementado de manera reproducible y escalable.

---

## 2. Justificación de Métodos de Sanitización y Limpieza

### A. Unificación Dinámica e Interanual
* **Método**: Lectura recursiva y concatenación automatizada de archivos CSV mensuales.
* **Justificación**: El proyecto abarca un rango temporal amplio (2020-2026). Consolidar de forma manual los archivos mensuales introduce riesgos de pérdida de datos. La unificación programática asegura escalabilidad absoluta para procesar 5 o más años consecutivos o no.

### B. Eliminación de Columnas de Identificadores (IDs)
* **Método**: Drop físico de las columnas `titular_domicilio_provincia_id` y `titular_pais_nacimiento_id`.
* **Justificación**: Estas columnas actúan como claves externas para bases de datos relacionales, pero carecen de valor estadístico o semántico directo para técnicas de agrupamiento. Dado que el dataset ya cuenta con las columnas categóricas completas normalizadas (`titular_domicilio_provincia` y `titular_pais_nacimiento`), los IDs representan redundancia informacional (colinealidad categórica exacta), lo que sobrecarga innecesariamente el costo de memoria del modelo.

### C. Concordancia y Estandarización de Tipos de Atributos
* **Método**:
  1. Fechas forzadas al estándar de texto `AAAA-MM-DD`.
  2. Enteros nulos o vacíos casteados a tipo nullable `Int64` de Pandas (removiendo decimales `.0`).
  3. Strings y no-numéricos delimitados estrictamente por comillas dobles (`""`), y numéricos escritos sin comillas.
* **Justificación**: Un error común en el manejo de CSVs con Pandas es que al existir valores nulos, los enteros se autoconvierten en flotantes (por ejemplo, año `2023.0`). Al tipar con `Int64` nullable conservamos la precisión del entero sin decimales y manteniendo la capacidad de almacenar NaNs. Delimitar estrictamente los strings con comillas dobles evita errores de lectura (parsers) cuando los nombres de modelos o localidades contienen comas o caracteres especiales.

### D. Imputación de Valores Faltantes (NaNs)
* **Variables Categóricas (`titular_domicilio_localidad`)**: Imputadas con el valor explicativo `"DESCONOCIDO"`.
  * *Justificación*: Evita sesgos en la moda geográfica y conserva el registro para el análisis regional.
* **Variables Numéricas (`automotor_anio_modelo` y `titular_anio_nacimiento`)**: Imputadas con la **Mediana**.
  * *Justificación*: La mediana es una medida de tendencia central sumamente robusta frente a la presencia de valores atípicos. Imputar con la **Media** (promedio) introduciría un fuerte sesgo debido a errores de carga extrema presentes en los datos brutos.

---

## 3. Detección y Tratamiento de Outliers (Valores Atípicos)

Los outliers cuantitativos representan observaciones imposibles o muy improbables en el dominio de estudio que distorsionan gravemente el cálculo de distancias (como la distancia euclidiana en K-Means).

### A. Año Modelo del Vehículo (`automotor_anio_modelo`)
* **Detección**: Límites lógicos definidos en el rango `[1960, 2027]`.
* **Justificación**: Un año menor a 1960 representa vehículos de más de 65 años de antigüedad en circulación masiva, lo cual es extremadamente inusual para estadísticas de robo ordinarias y suele ser un error de tipeo. Un año superior a 2027 representa una imposibilidad física dado que el dataset fue consultado en 2026.
* **Tratamiento**: **Capping por Mediana**. Los 16 outliers detectados y los 90 valores nulos se reemplazaron por la mediana del dataset (`2009.0`).

### B. Año de Nacimiento del Titular (`titular_anio_nacimiento`)
* **Detección**: Límites lógicos definidos en el rango `[1920, 2009]`.
* **Justificación**: Un nacimiento anterior a 1920 implicaría un titular de vehículo activo de más de 106 años de edad en 2026. Un nacimiento posterior a 2009 implicaría un propietario menor de 17 años de edad (la edad legal mínima para poseer la titularidad de un vehículo en Argentina). Muchos nulos o fechas erróneas corresponden a cargas genéricas de concesionarias o personas jurídicas.
* **Tratamiento**: **Capping por Mediana**. Los 503 outliers detectados y los 6 valores nulos se reemplazaron por la mediana del dataset (`1980.0`).

### C. Porcentaje de Titularidad (`titular_porcentaje_titularidad`)
* **Detección y Tratamiento**: Recorte (*capping*) estricto al intervalo numérico lógico `[0.0, 100.0]`.
* **Justificación**: Previene errores aritméticos de carga que superen el 100% de la propiedad del bien o presenten valores negativos.

---

## 4. Cuadro Cuantitativo del Procesamiento (Dataset 2023)

| Fase de Limpieza | Métrica / Variable Afectada | Registros Originales / Afectados | Estado Post-Procesamiento / Justificación |
| :--- | :--- | :---: | :--- |
| **Unificación** | Carga de 12 CSVs Mensuales | 45,966 | **45,966** unificados programáticamente de forma dinámica. |
| **Deduplicación** | Registros duplicados exactos | 3 | **Eliminados**. Se conservaron 45,963 filas únicas. |
| **Eliminación IDs** | `titular_domicilio_provincia_id`<br>`titular_pais_nacimiento_id` | 45,963 | **Removidas completamente** del CSV final para evitar redundancia y colinealidad. |
| **Imputación Categórica** | `titular_domicilio_localidad` | 44 nulos | Reemplazados por `"DESCONOCIDO"` para evitar pérdida de registros. |
| **Imputación Numérica** | `automotor_anio_modelo` | 90 nulos | Reemplazados por la mediana robusta: `2009.0`. |
| **Imputación Numérica** | `titular_anio_nacimiento` | 6 nulos | Reemplazados por la mediana robusta: `1980.0`. |
| **Tratamiento Outliers** | `automotor_anio_modelo` | 16 outliers | Reemplazados por la mediana: `2009.0`. Rango final: `[1960, 2026]`. |
| **Tratamiento Outliers** | `titular_anio_nacimiento` | 503 outliers | Reemplazados por la mediana: `1980.0`. Rango final: `[1920, 2009]`. |
| **Capping porcentual** | `titular_porcentaje_titularidad`| - | Valores acotados estrictamente entre `0.0` y `100.0`. |

---

## 5. Conclusión
El conjunto de datos unificado y sanitizado resultante en `dataset_consolidado.csv` consta de **45,963 registros limpios** y **26 atributos** consistentes. 

Gracias a la concordancia estricta de tipos de datos implementada, el archivo CSV final se almacena en un formato universalmente predecible y optimizado para la fase de **Modelado** (Clustering), libre de sesgos por imputación inapropiada de modas y sin ruidos estadísticos causados por outliers o IDs colineales.
