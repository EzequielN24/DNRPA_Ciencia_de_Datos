# 🚗 Tablero de Control de Gestión y Priorización del Delito Automotor en Argentina
### Trabajo Final Integrador (2026) — Fundamentos de Ciencia de Datos (UNSL)
**Autores**: Ezequiel Bernaldez, Ezequiel Nodar  

---

[![Python 3.14](https://img.shields.io/badge/python-3.14-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pipenv](https://img.shields.io/badge/Pipenv-Containerized-green.svg?style=for-the-badge&logo=python&logoColor=white)](https://pipenv.pypa.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Django](https://img.shields.io/badge/Django-REST_Framework-092E20.svg?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![CRISP-DM](https://img.shields.io/badge/Metodolog%C3%ADa-CRISP--DM-9013FE.svg?style=for-the-badge)](https://en.wikipedia.org/wiki/Cross-industry_standard_process_for_data_mining)

Este proyecto desarrolla un sistema de análisis, modelado y visualización analítica (**SFM-DA**) sobre las denuncias de robos y recuperos de vehículos registrados por la **Dirección Nacional de los Registros Nacionales de la Propiedad del Automotor (DNRPA)** en Argentina para el rango temporal 2020-2026. 

El sistema utiliza **Machine Learning (K-Means Clustering)** para segmentar las 24 jurisdicciones del país según perfiles de riesgo y eficiencia en la recuperación vehicular, desplegando un dashboard interactivo compuesto por un backend en **Django REST Framework** y un frontend en **React** (creado con `npm` y `create-react-app`).

---

## 📂 Estructura del Repositorio

```text
Trabajo Integrador/
└── DNRPA_Ciencia_de_Datos/
    ├── Pipfile                   # Archivo de entorno virtual Pipenv
    ├── Pipfile.lock              # Bloqueo de dependencias de Pipenv
    ├── data/
    │   └── original/             # CSVs brutos de la DNRPA (2020-2026)
    ├── backend/                  # Servidor de API en Django REST Framework
    │   ├── db.sqlite3            # Base de datos relacional SQLite del sistema
    │   ├── api/                  # Código de la aplicación Django
    │   │   ├── scripts/          # Pipeline de Ciencia de Datos y Reporte
    │   │   │   ├── unificar_datos.py
    │   │   │   ├── generar_modelo.py
    │   │   │   └── crear_reporte_docx.py
    │   │   ├── models.py         # Definición de tablas relacionales de la BD
    │   │   └── views.py          # Endpoints que consumen de la BD
    │   └── backend/              # Configuración de Django (CORS, Settings)
    ├── frontend/                 # Aplicación de React (npm start / build)
    │   ├── public/               # Plantilla HTML y CDN de Leaflet
    │   └── src/                  # Componentes de React (Dashboard, Mapa, K-Means)
    ├── reports/
    │   ├── limpieza_y_preparacion_datos.md # Metodología de sanitización y outliers
    │   └── reporte_procesamiento.md        # Indicadores de procesamiento y modelado
    └── Anexo_Tecnico_Clustering_y_Despliegue.docx # Reporte técnico formal
```

---

## 🛠️ Fundamento Metodológico y Normalizaciones

Para mitigar el sesgo de escala geográfica y la asimetría poblacional, el análisis reemplaza las métricas volumétricas crudas por tasas normalizadas utilizando el **Censo Nacional INDEC 2022**:

1. **Tasa de Robo Logarítmica (ln(Tasa + 1))**: La tasa de robo se calcula por cada 100.000 habitantes (estándar criminológico de la UNODC). Debido a que CABA/Buenos Aires presentan volúmenes ~50 veces mayores a otras provincias, aplicar el logaritmo natural comprime la escala euclidiana y estabiliza el agrupamiento de K-Means.
2. **Tasa de Recupero Suavizada (Bayesiana)**: Previene la distorsión por muestras pequeñas en provincias de baja delincuencia aplicando Laplace Smoothing hacia la media nacional (~3.4%):
   $$\text{Tasa de Recupero Suavizada} = \frac{\text{Recuperos} + 3.0}{\text{Robos} + 100.0} \times 100$$
3. **Estandarización Z-Score**: StandardScaler centra las variables en media 0 y varianza 1 antes de entrenar K-Means.

---

## 📈 Hallazgos Clave del Modelo (2020-2026)

| Indicador | Valor Nacional / Jurisdicciones Destacadas |
| :--- | :---: |
| **Robos Totales Acumulados** | **233,946** denuncias |
| **Recuperos Totales Acumulados** | **8,058** recuperos |
| **Tasa de Recupero Real Promedio** | **3.44%** |
| **Mayor Eficiencia Regional (Suavizada)** | **ENTRE RÍOS** (18.91% real; 16.92% suavizada bayesiana) |
| **Concentración del Delito** | **BUENOS AIRES** (67.03% de robos) y **CABA** (12.15%). Top 5 provincias concentran **97.07%** |
| **Coeficiente de Silueta K-Means** | **0.5037** (Fuerza de agrupamiento robusta) |
| **Clasificación en Clústeres** | **Crítico** (6 provincias), **Destacado** (1 provincia), **Moderado/Bajo** (17 provincias) |

---

## 🚀 Instalación y Despliegue Local (Pipenv + NPM)

### 1. Clonación e Instalación de Python (Backend)
El backend corre en un entorno virtual aislado administrado por `pipenv` para asegurar que las dependencias estén completamente contenidas:
```bash
# Entrar al directorio raíz del proyecto
cd DNRPA_Ciencia_de_Datos

# Instalar y activar las dependencias de Pipenv
python -m pipenv install
```

### 2. Inicializar la Base de Datos y el Modelo (Automatizado)
Para aplicar las migraciones de base de datos, sanitizar los datos brutos insertándolos en SQLite, entrenar el modelo K-Means y generar el informe Word en un solo paso, ejecuta el script de inicialización:
```bash
python -m pipenv run python init_proyecto.py
```

Si prefieres ejecutar el pipeline científico paso a paso:
```bash
# 1. Unificar, sanitizar e insertar los 242.004 registros en la base de datos SQLite
python -m pipenv run python backend/api/scripts/unificar_datos.py

# 2. Correr el clustering K-Means leyendo desde SQLite y guardando los resultados directamente en las tablas relacionales de SQLite
python -m pipenv run python backend/api/scripts/generar_modelo.py

# 3. Generar el documento formal Word
python -m pipenv run python backend/api/scripts/crear_reporte_docx.py
```

### 3. Iniciar el Backend de Django
Una vez generados los resultados del modelo, puedes levantar la API de desarrollo:
```bash
# Ir a la carpeta backend e iniciar Django
python -m pipenv run python backend/manage.py runserver
```
La API estará disponible en `http://127.0.0.1:8000/`. Endpoints clave:
* `http://127.0.0.1:8000/api/summary/` (KPIs nacionales)
* `http://127.0.0.1:8000/api/provinces/` (Ranking de provincias y clústeres)
* `http://127.0.0.1:8000/api/model-info/` (Inercia, silueta y políticas públicas sugeridas)

### 4. Iniciar el Frontend en React (NPM)
La interfaz web está construida en React puro y se ejecuta con `npm`:
```bash
# Abrir otra terminal, ir a la carpeta de React
cd DNRPA_Ciencia_de_Datos/frontend

# Instalar los módulos de node
npm install

# Correr el servidor de desarrollo de React
npm start
```
El navegador se abrirá automáticamente en `http://localhost:3000/`, consumiendo los endpoints de Django sin errores de CORS.
Para compilar la aplicación para producción:
```bash
npm run build
```

---

## 🎓 Autores
* **Ezequiel Bernaldez**
* **Ezequiel Nodar**

*Universidad Nacional de San Luis (UNSL) — Facultad de Ciencias Físico Matemáticas y Naturales.*
