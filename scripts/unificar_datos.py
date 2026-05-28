import os
import glob
import pandas as pd
import numpy as np
import csv

def clean_text_column(series):
    """Auxiliar para normalizar columnas de texto."""
    return series.astype(str).str.strip().str.upper().replace({'NAN': np.nan, 'NONE': np.nan, '': np.nan})

def unificar_y_preparar(input_dir, output_path):
    print(f"Buscando archivos CSV en: {input_dir}")
    
    # Buscar todos los archivos CSV recursivamente
    search_path = os.path.join(input_dir, "**", "*.csv")
    csv_files = glob.glob(search_path, recursive=True)
    
    if not csv_files:
        # Intentar también en la carpeta raíz directa
        search_path_direct = os.path.join(input_dir, "*.csv")
        csv_files = glob.glob(search_path_direct)
        
    if not csv_files:
        raise FileNotFoundError(f"No se encontraron archivos CSV en la ruta: {input_dir}")
        
    print(f"Se encontraron {len(csv_files)} archivos CSV para procesar:")
    for f in csv_files:
        print(f" - {os.path.basename(f)}")
        
    dfs = []
    for filepath in csv_files:
        try:
            # Leer el archivo CSV
            df = pd.read_csv(filepath, low_memory=False)
            dfs.append(df)
            print(f"Cargado {os.path.basename(filepath)} con {len(df)} registros.")
        except Exception as e:
            print(f"Error al leer {filepath}: {e}")
            
    if not dfs:
        raise ValueError("No se pudo cargar ningún dataset válido.")
        
    # Unificar dataframes
    print("Unificando conjuntos de datos...")
    df_consolidado = pd.concat(dfs, ignore_index=True)
    total_original = len(df_consolidado)
    print(f"Dataset unificado. Registros totales originales: {total_original}")
    
    # ------------------ FASE DE SANITIZACIÓN ------------------
    print("Ejecutando limpieza y normalización...")
    
    # 1. Eliminar duplicados exactos
    df_consolidado = df_consolidado.drop_duplicates()
    duplicados_eliminados = total_original - len(df_consolidado)
    print(f"Duplicados eliminados: {duplicados_eliminados}")
    
    # 2. Eliminar columnas de IDs que no son necesarias
    ids_to_drop = ['titular_domicilio_provincia_id', 'titular_pais_nacimiento_id']
    dropped_cols = []
    for col in ids_to_drop:
        if col in df_consolidado.columns:
            df_consolidado = df_consolidado.drop(columns=[col])
            dropped_cols.append(col)
    print(f"Columnas de IDs eliminadas: {dropped_cols}")
    
    # 3. Sanitizar columnas clave de texto (strings)
    text_cols = [
        'tramite_tipo', 'registro_seccional_descripcion', 'registro_seccional_provincia',
        'automotor_origen', 'automotor_tipo_descripcion', 'automotor_marca_descripcion',
        'automotor_modelo_descripcion', 'automotor_uso_descripcion', 'titular_tipo_persona',
        'titular_domicilio_localidad', 'titular_domicilio_provincia', 'titular_genero',
        'titular_pais_nacimiento'
    ]
    for col in text_cols:
        if col in df_consolidado.columns:
            df_consolidado[col] = clean_text_column(df_consolidado[col])
            
    # Normalización estándar de nombres de provincias para evitar duplicados y colinealidades
    prov_mapping = {
        'CIUDAD AUTÓNOMA DE BS.AS.': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
        'C.AUTONOMA DE BS.AS': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
        'C.AUTÓNOMA DE BS.AS.': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
        'C. AUTÓNOMA DE BS. AS.': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
        'CABA': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
        'CORDOBA': 'CÓRDOBA',
        'SGO.DEL ESTERO': 'SANTIAGO DEL ESTERO',
        'SGO. DEL ESTERO': 'SANTIAGO DEL ESTERO',
        'TUCUMAN': 'TUCUMÁN',
        'ENTRE RIOS': 'ENTRE RÍOS',
        'NEUQUEN': 'NEUQUÉN',
        'RIO NEGRO': 'RÍO NEGRO',
        'T.DEL FUEGO': 'TIERRA DEL FUEGO',
        'T. DEL FUEGO': 'TIERRA DEL FUEGO',
        'T DEL FUEGO': 'TIERRA DEL FUEGO',
        'SANTA FÉ': 'SANTA FE'
    }
    for col in ['registro_seccional_provincia', 'titular_domicilio_provincia']:
        if col in df_consolidado.columns:
            df_consolidado[col] = df_consolidado[col].replace(prov_mapping)
            
    # Eliminar nulos en registro_seccional_provincia para evitar grupos inválidos
    if 'registro_seccional_provincia' in df_consolidado.columns:
        df_consolidado = df_consolidado.dropna(subset=['registro_seccional_provincia'])

            
    # 4. Tratamiento y conversión de fechas (estricto formato AAAA-MM-DD en string para salida)
    date_cols = ['tramite_fecha', 'fecha_inscripcion_inicial']
    for col in date_cols:
        if col in df_consolidado.columns:
            # Convertir a datetime y luego formatear a string YYYY-MM-DD
            dt_series = pd.to_datetime(df_consolidado[col], errors='coerce')
            df_consolidado[col] = dt_series.dt.strftime('%Y-%m-%d').replace({np.nan: None})
            
    # Eliminar filas donde tramite_fecha sea nulo, ya que es la variable temporal de análisis principal
    nulos_tramite_fecha = df_consolidado['tramite_fecha'].isna().sum()
    df_consolidado = df_consolidado.dropna(subset=['tramite_fecha'])
    print(f"Filas eliminadas debido a tramite_fecha nulo o inválido: {nulos_tramite_fecha}")
    
    # 5. Imputación de valores faltantes (NaNs)
    print("Imputando valores faltantes...")
    # Categóricas
    if 'titular_domicilio_localidad' in df_consolidado.columns:
        df_consolidado['titular_domicilio_localidad'] = df_consolidado['titular_domicilio_localidad'].fillna("DESCONOCIDO")
    
    # 6. Tratamiento de Outliers y Anomalias (Detección y Capping con Mediana)
    print("Detectando y tratando outliers numéricos...")
    
    # A. Año Modelo del Automotor
    if 'automotor_anio_modelo' in df_consolidado.columns:
        # Convertir a numérico primero
        df_consolidado['automotor_anio_modelo'] = pd.to_numeric(df_consolidado['automotor_anio_modelo'], errors='coerce')
        # Calcular mediana de referencia
        median_anio_modelo = df_consolidado['automotor_anio_modelo'].median()
        # Imputar NaNs con la mediana
        df_consolidado['automotor_anio_modelo'] = df_consolidado['automotor_anio_modelo'].fillna(median_anio_modelo)
        # Identificar y tratar outliers (modelos antes de 1960 o posteriores a 2027)
        outliers_anio_modelo = (df_consolidado['automotor_anio_modelo'] < 1960) | (df_consolidado['automotor_anio_modelo'] > 2027)
        df_consolidado.loc[outliers_anio_modelo, 'automotor_anio_modelo'] = median_anio_modelo
        print(f" - Outliers en año modelo tratados (reemplazados por mediana {median_anio_modelo}): {outliers_anio_modelo.sum()}")
        
    # B. Año de Nacimiento del Titular
    if 'titular_anio_nacimiento' in df_consolidado.columns:
        df_consolidado['titular_anio_nacimiento'] = pd.to_numeric(df_consolidado['titular_anio_nacimiento'], errors='coerce')
        median_naci_titular = df_consolidado['titular_anio_nacimiento'].median()
        df_consolidado['titular_anio_nacimiento'] = df_consolidado['titular_anio_nacimiento'].fillna(median_naci_titular)
        # Identificar y tratar outliers (titulares nacidos antes de 1920 -edad > 106- o después de 2009 -edad < 17-)
        outliers_naci_titular = (df_consolidado['titular_anio_nacimiento'] < 1920) | (df_consolidado['titular_anio_nacimiento'] > 2009)
        df_consolidado.loc[outliers_naci_titular, 'titular_anio_nacimiento'] = median_naci_titular
        print(f" - Outliers en año de nacimiento del titular tratados (reemplazados por mediana {median_naci_titular}): {outliers_naci_titular.sum()}")

    # C. Porcentaje de Titularidad
    if 'titular_porcentaje_titularidad' in df_consolidado.columns:
        df_consolidado['titular_porcentaje_titularidad'] = pd.to_numeric(df_consolidado['titular_porcentaje_titularidad'], errors='coerce')
        # Capping entre 0 y 100%
        df_consolidado['titular_porcentaje_titularidad'] = df_consolidado['titular_porcentaje_titularidad'].clip(0.0, 100.0)

    # 7. Normalizar números (cast estricto a tipos numéricos para preservarlos sin comillas)
    # Usamos el tipo nullable 'Int64' de pandas para enteros que pueden contener nulos sin forzarlos a float (.0)
    int_cols = [
        'registro_seccional_codigo', 'automotor_anio_modelo', 'automotor_tipo_codigo',
        'automotor_marca_codigo', 'automotor_modelo_codigo', 'automotor_uso_codigo',
        'titular_anio_nacimiento'
    ]
    for col in int_cols:
        if col in df_consolidado.columns:
            df_consolidado[col] = pd.to_numeric(df_consolidado[col], errors='coerce').round().astype('Int64')
            
    float_cols = ['titular_porcentaje_titularidad']
    for col in float_cols:
        if col in df_consolidado.columns:
            df_consolidado[col] = pd.to_numeric(df_consolidado[col], errors='coerce').astype('float64')
            
    # 8. Filtrar rango de fechas (1/1/2020 al 30/4/2026) según la consigna
    registros_antes_filtro = len(df_consolidado)
    df_consolidado = df_consolidado[
        (df_consolidado['tramite_fecha'] >= '2020-01-01') & 
        (df_consolidado['tramite_fecha'] <= '2026-04-30')
    ]
    fuera_de_rango = registros_antes_filtro - len(df_consolidado)
    print(f"Registros eliminados por estar fuera del rango temporal (2020-2026): {fuera_de_rango}")
    
    # ------------------ ENRIQUECIMIENTO (FEATURE ENGINEERING) ------------------
    print("Enriqueciendo dataset con nuevas características...")
    # Extraer año, mes e identificador de período (AAAAMM) del string de tramite_fecha
    dt_temp = pd.to_datetime(df_consolidado['tramite_fecha'])
    df_consolidado['tramite_anio'] = dt_temp.dt.year.astype('Int64')
    df_consolidado['tramite_mes'] = dt_temp.dt.month.astype('Int64')
    # tramite_periodo es un string, por ende saldrá con comillas
    df_consolidado['tramite_periodo'] = dt_temp.dt.strftime('%Y%m')
    
    # Guardar dataset final
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Explicación de to_csv:
    # - date_format='%Y-%m-%d' formatea las fechas si quedara algún objeto Timestamp.
    # - quoting=csv.QUOTE_NONNUMERIC engloba entre comillas dobles todos los campos string y no numéricos (como las fechas y períodos),
    #   mientras que los números (Int64, float64) se guardan puramente como números (sin comillas).
    df_consolidado.to_csv(
        output_path, 
        index=False, 
        encoding='utf-8', 
        quoting=csv.QUOTE_NONNUMERIC, 
        quotechar='"'
    )
    
    print(f"\n¡Proceso finalizado con éxito!")
    print(f"Dataset unificado y sanitizado guardado en: {output_path}")
    print(f"Registros finales: {len(df_consolidado)}")
    
    # Generar resumen_procesamiento.txt en la raíz del proyecto (un nivel arriba del directorio de scripts)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proyecto_root = os.path.dirname(script_dir)
    txt_report_path = os.path.join(proyecto_root, "resumen_procesamiento.txt")
    
    # Contar trámites
    robo_count = df_consolidado[df_consolidado['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA'].shape[0]
    recu_count = df_consolidado[df_consolidado['tramite_tipo'] == 'COMUNICACIÓN DE RECUPERO'].shape[0]
    tasa_recu = (recu_count / robo_count * 100) if robo_count > 0 else 0.0
    
    try:
        with open(txt_report_path, "w", encoding="utf-8") as f:
            f.write(f"Originales: {total_original}\n")
            f.write(f"Duplicados eliminados: {duplicados_eliminados}\n")
            f.write(f"Procesados finales: {len(df_consolidado)}\n\n")
            f.write("--- Trámites ---\n")
            f.write(f"Denuncias de Robo: {robo_count}\n")
            f.write(f"Comunicaciones de Recupero: {recu_count}\n")
            f.write(f"Tasa de Recupero: {tasa_recu:.4f}%\n\n")
            f.write("--- Outliers Tratados ---\n")
            f.write(f"Año Modelo Corregidos: {outliers_anio_modelo.sum()}\n")
            f.write(f"Año Nacimiento Corregidos: {outliers_naci_titular.sum()}\n")
        print(f"Resumen de procesamiento guardado en: {txt_report_path}")
    except Exception as e:
        print(f"Error al escribir resumen_procesamiento.txt: {e}")
        
    # Generar un reporte en consola
    print("\n--- Resumen Estadístico Rápido ---")
    print(df_consolidado['tramite_tipo'].value_counts())

if __name__ == "__main__":
    # Obtener el directorio raíz del proyecto de forma dinámica (un nivel arriba de scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proyecto_root = os.path.dirname(script_dir)
    
    # Definir rutas relativas
    INPUT_DIR = os.path.join(proyecto_root, "data", "original", "dataset-dnrpa-robos-recuperos-autos")
    OUTPUT_PATH = os.path.join(proyecto_root, "data", "procesada", "dataset_consolidado.csv")
    
    # Si no existe la carpeta específica en original, busca directamente en original/
    if not os.path.exists(INPUT_DIR):
        INPUT_DIR = os.path.join(proyecto_root, "data", "original")
        
    unificar_y_preparar(INPUT_DIR, OUTPUT_PATH)
