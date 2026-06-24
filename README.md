# Instalación y Ejecución del Sistema

## Requisitos Previos

Estos son los requisitos para poder correr el programa:
- Python 3.10 o superior.
- Pipenv.
- Node.js y NPM.
- Git (opcional, para clonar el repositorio).
---

## Paso 1: En la consola, ubicarse en la la raiz del proyecto

```bash
cd Trabajo_Integrador
```

---

## Paso 2: Instalar las Dependencias del Backend

El backend está desarrollado con Python y Django. Para instalar todas las dependencias necesarias ejecute:

```bash
python -m pipenv install
```

Este comando creará automáticamente un entorno virtual e instalará las librerías requeridas.

---

## Paso 3: Preparar los Datos y Generar el Modelo

Para inicializar completamente el proyecto (cargar datos, generar la base de datos, entrenar el modelo y crear el reporte), ejecute:

```bash
python -m pipenv run python init_proyecto.py
```

Este proceso realiza automáticamente:

- Integración y limpieza de los datos.
- Creación de la base de datos SQLite.
- Entrenamiento del modelo de Machine Learning.
- Generación del informe técnico.

> **Nota:** Este proceso puede tardar algunos minutos dependiendo de las características del equipo.

---

## Paso 4: Iniciar el Backend

Una vez finalizada la preparación de los datos, inicie el servidor Django:

```bash
python -m pipenv run python backend/manage.py runserver
```

El backend quedará disponible en:

```text
http://localhost:8000
```

---

## Paso 5: Instalar las Dependencias del Frontend

Abra una nueva terminal y diríjase a la carpeta del frontend:

```bash
cd Trabajo_Integrador/frontend
```

Instale las dependencias de React:

```bash
npm install
```

---

## Paso 6: Iniciar la Aplicación Web

Ejecute:

```bash
npm start
```

La aplicación se abrirá automáticamente en el navegador en:

```text
http://localhost:3000
```

Desde esta interfaz podrá acceder a todas las funcionalidades del sistema y visualizar los resultados del análisis.

---