import os
import sys
import glob
import pandas as pd
import numpy as np
import django

# Configurar Django para usar ORM en el script
script_dir = os.path.dirname(os.path.abspath(__file__))
proyecto_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
sys.path.append(os.path.join(proyecto_root, 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import RegistroDnrpa

def clean_text_column(series):
    """Auxiliar para normalizar columnas de texto."""
    return series.astype(str).str.strip().str.upper().replace({'NAN': np.nan, 'NONE': np.nan, '': np.nan})

def normalizar_marcas(series):
    """Normaliza y unifica la descripción de las marcas de los vehículos."""
    series_clean = series.astype(str).str.strip().str.upper()
    # 1. Remover códigos prefijos del formato "-XXX-" o "XXX-"
    series_clean = series_clean.str.replace(r'^[-|\d\s]+-\s*', '', regex=True)
    # 2. Remover números sueltos al inicio (ej. "3PEUGEOT" -> "PEUGEOT")
    series_clean = series_clean.str.replace(r'^\d+\s*', '', regex=True)
    # 3. Remover códigos y paréntesis al final (ej. "RENAULT (112)")
    series_clean = series_clean.str.replace(r'\s*\(\d+\)\s*$', '', regex=True)
    # 4. Remover caracteres no alfanuméricos sobrantes al inicio/fin (ej. ".CHEVROLET" -> "CHEVROLET")
    series_clean = series_clean.str.replace(r'^[^\w]+|[^\w]+$', '', regex=True)
    
    # 5. Mapeos de marcas mal escritas
    diccionario_correcciones = {
        r'.*VOLKS.*': 'VOLKSWAGEN',
        r'.*WOLKS.*': 'VOLKSWAGEN',
        r'.*VOKL.*': 'VOLKSWAGEN',
        r'.*VLOK.*': 'VOLKSWAGEN',
        r'.*CHEVR.*': 'CHEVROLET',
        r'.*CHEVO.*': 'CHEVROLET',
        r'.*CHERV.*': 'CHEVROLET',
        r'.*PEUG.*': 'PEUGEOT',
        r'.*PEOG.*': 'PEUGEOT',
        r'.*PEUI.*': 'PEUGEOT',
        r'.*RENAU.*': 'RENAULT',
        r'.*REAN.*': 'RENAULT',
        r'.*MERCED.*': 'MERCEDES BENZ',
        r'.*MERCE.*': 'MERCEDES BENZ',
        r'^M\.BENZ$': 'MERCEDES BENZ',
        r'.*CITRO.*': 'CITROEN',
    }
    
    for patron, reemplazo in diccionario_correcciones.items():
        series_clean = series_clean.str.replace(patron, reemplazo, regex=True)
        
    series_clean = series_clean.str.replace(r'\s+', ' ', regex=True).str.strip()
    
    valores_invalidos = ["NAN", "NONE", "NO POSEE", "NO CONSTA", "SIN IDENTIFICACION", "SIN MARCA REGISTRADA", "MARCA INVALIDA", "*", "19"]
    series_clean = series_clean.replace(valores_invalidos, "DESCONOCIDO")
    
    return series_clean

def unificar_y_preparar(input_dir):
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
        raise ValueError("No se pudo cargar ningún dataframe válido.")
        
    # Concatenar todos los DataFrames cargados
    print("Concatenando dataframes...")
    df_consolidado = pd.concat(dfs, ignore_index=True)
    total_original = len(df_consolidado)
    print(f"Total de registros originales acumulados: {total_original}")
    
    # 1. Deduplicación
    print("Buscando duplicados exactos...")
    duplicados_antes = df_consolidado.duplicated().sum()
    df_consolidado = df_consolidado.drop_duplicates()
    duplicados_eliminados = duplicados_antes
    print(f"Duplicados eliminados: {duplicados_eliminados}. Registros restantes: {len(df_consolidado)}")
    
    # 2. Eliminación de Columnas de IDs Redundantes
    cols_a_eliminar = ['titular_domicilio_provincia_id', 'titular_pais_nacimiento_id']
    for col in cols_a_eliminar:
        if col in df_consolidado.columns:
            df_consolidado = df_consolidado.drop(columns=[col])
            print(f"Columna redundante eliminada: {col}")
            
    # 3. Concordancia y Estandarización de Strings a Mayúsculas
    print("Estandarizando columnas categóricas (Strings a Mayúsculas)...")
    str_cols = [
        'tramite_tipo', 'registro_seccional_descripcion', 'registro_seccional_provincia',
        'automotor_origen', 'automotor_tipo_descripcion', 'automotor_marca_descripcion',
        'automotor_modelo_descripcion', 'automotor_uso_descripcion', 'titular_tipo_persona',
        'titular_domicilio_localidad', 'titular_domicilio_provincia', 'titular_genero',
        'titular_pais_nacimiento'
    ]
    for col in str_cols:
        if col in df_consolidado.columns:
            df_consolidado[col] = clean_text_column(df_consolidado[col])
            
    if 'automotor_marca_descripcion' in df_consolidado.columns:
        df_consolidado['automotor_marca_descripcion'] = normalizar_marcas(df_consolidado['automotor_marca_descripcion'])
        print("Marcas de vehículos normalizadas y unificadas.")
            
    # Unificar nombres de Ciudad Autónoma de Buenos Aires (CABA) y eliminar nulos
    if 'registro_seccional_provincia' in df_consolidado.columns:
        df_consolidado['registro_seccional_provincia'] = df_consolidado['registro_seccional_provincia'].replace({
            'CIUDAD AUTÓNOMA DE BS.AS.': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
            'CIUDAD AUTÓNOMA DE BS. AS.': 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
            'CAPITAL FEDERAL': 'CIUDAD AUTÓNOMA DE BUENOS AIRES'
        })
        df_consolidado = df_consolidado.dropna(subset=['registro_seccional_provincia'])

    # 4. Tratamiento y conversión de fechas (estricto formato AAAA-MM-DD en string para salida)
    date_cols = ['tramite_fecha', 'fecha_inscripcion_inicial']
    for col in date_cols:
        if col in df_consolidado.columns:
            dt_series = pd.to_datetime(df_consolidado[col], errors='coerce')
            df_consolidado[col] = dt_series.dt.strftime('%Y-%m-%d').replace({np.nan: None})
            
    # Eliminar filas donde tramite_fecha sea nulo
    nulos_tramite_fecha = df_consolidado['tramite_fecha'].isna().sum()
    df_consolidado = df_consolidado.dropna(subset=['tramite_fecha'])
    print(f"Filas eliminadas debido a tramite_fecha nulo o inválido: {nulos_tramite_fecha}")
    
    # 5. Imputación de valores faltantes (NaNs)
    print("Imputando valores faltantes...")
    if 'titular_domicilio_localidad' in df_consolidado.columns:
        df_consolidado['titular_domicilio_localidad'] = df_consolidado['titular_domicilio_localidad'].fillna("DESCONOCIDO")
    
    # 6. Tratamiento de Outliers (Capping con Mediana)
    print("Detectando y tratando outliers numéricos...")
    
    # A. Año Modelo del Automotor
    if 'automotor_anio_modelo' in df_consolidado.columns:
        df_consolidado['automotor_anio_modelo'] = pd.to_numeric(df_consolidado['automotor_anio_modelo'], errors='coerce')
        registros_antes = len(df_consolidado)
        df_consolidado = df_consolidado[
            (df_consolidado['automotor_anio_modelo'] >= 1886) & 
            (df_consolidado['automotor_anio_modelo'] <= 2026)
        ]
        eliminados_anio_modelo = registros_antes - len(df_consolidado)
        print(f" - Registros eliminados por año modelo fuera del rango [1886, 2026]: {eliminados_anio_modelo}")
        
    # B. Año de Nacimiento del Titular
    if 'titular_anio_nacimiento' in df_consolidado.columns:
        df_consolidado['titular_anio_nacimiento'] = pd.to_numeric(df_consolidado['titular_anio_nacimiento'], errors='coerce')
        median_naci_titular = df_consolidado['titular_anio_nacimiento'].median()
        df_consolidado['titular_anio_nacimiento'] = df_consolidado['titular_anio_nacimiento'].fillna(median_naci_titular)
        outliers_naci_titular = (df_consolidado['titular_anio_nacimiento'] < 1920) | (df_consolidado['titular_anio_nacimiento'] > 2009)
        df_consolidado.loc[outliers_naci_titular, 'titular_anio_nacimiento'] = median_naci_titular
        print(f" - Outliers en año nacimiento tratados: {outliers_naci_titular.sum()}")

    # C. Porcentaje de Titularidad
    if 'titular_porcentaje_titularidad' in df_consolidado.columns:
        df_consolidado['titular_porcentaje_titularidad'] = pd.to_numeric(df_consolidado['titular_porcentaje_titularidad'], errors='coerce')
        df_consolidado['titular_porcentaje_titularidad'] = df_consolidado['titular_porcentaje_titularidad'].clip(0.0, 100.0)

    # 7. Normalizar números
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
            
    # 8. Filtrar rango de fechas (1/1/2020 al 30/4/2026)
    registros_antes_filtro = len(df_consolidado)
    df_consolidado = df_consolidado[
        (df_consolidado['tramite_fecha'] >= '2020-01-01') & 
        (df_consolidado['tramite_fecha'] <= '2026-04-30')
    ]
    fuera_de_rango = registros_antes_filtro - len(df_consolidado)
    print(f"Registros eliminados por estar fuera del rango temporal (2020-2026): {fuera_de_rango}")
    
    # ------------------ ENRIQUECIMIENTO (FEATURE ENGINEERING) ------------------
    print("Enriqueciendo dataset con nuevas características...")
    dt_temp = pd.to_datetime(df_consolidado['tramite_fecha'])
    df_consolidado['tramite_anio'] = dt_temp.dt.year.astype('Int64')
    df_consolidado['tramite_mes'] = dt_temp.dt.month.astype('Int64')
    df_consolidado['tramite_periodo'] = dt_temp.dt.strftime('%Y%m')
    
    # ------------------ GUARDAR EN BASE DE DATOS (MIGRADO DE CSV) ------------------
    print("Limpiando registros antiguos de la tabla RegistroDnrpa...")
    RegistroDnrpa.objects.all().delete()
    
    print("Preparando objetos para bulk_create...")
    records = df_consolidado.to_dict(orient='records')
    objs = []
    
    def to_int(val):
        if pd.isna(val) or val is None:
            return None
        return int(val)
        
    def to_float(val):
        if pd.isna(val) or val is None:
            return None
        return float(val)

    def to_str(val):
        if pd.isna(val) or val is None:
            return None
        return str(val)

    for r in records:
        objs.append(
            RegistroDnrpa(
                tramite_tipo=to_str(r.get('tramite_tipo')),
                tramite_fecha=to_str(r.get('tramite_fecha')),
                fecha_inscripcion_inicial=to_str(r.get('fecha_inscripcion_inicial')),
                registro_seccional_codigo=to_int(r.get('registro_seccional_codigo')),
                registro_seccional_descripcion=to_str(r.get('registro_seccional_descripcion')),
                registro_seccional_provincia=to_str(r.get('registro_seccional_provincia')),
                automotor_origen=to_str(r.get('automotor_origen')),
                automotor_anio_modelo=to_int(r.get('automotor_anio_modelo')),
                automotor_tipo_codigo=to_str(r.get('automotor_tipo_codigo')),
                automotor_tipo_descripcion=to_str(r.get('automotor_tipo_descripcion')),
                automotor_marca_codigo=to_str(r.get('automotor_marca_codigo')),
                automotor_marca_descripcion=to_str(r.get('automotor_marca_descripcion')),
                automotor_modelo_codigo=to_str(r.get('automotor_modelo_codigo')),
                automotor_modelo_descripcion=to_str(r.get('automotor_modelo_descripcion')),
                automotor_uso_codigo=to_int(r.get('automotor_uso_codigo')),
                automotor_uso_descripcion=to_str(r.get('automotor_uso_descripcion')),
                titular_tipo_persona=to_str(r.get('titular_tipo_persona')),
                titular_domicilio_localidad=to_str(r.get('titular_domicilio_localidad')),
                titular_domicilio_provincia=to_str(r.get('titular_domicilio_provincia')),
                titular_genero=to_str(r.get('titular_genero')),
                titular_anio_nacimiento=to_int(r.get('titular_anio_nacimiento')),
                titular_pais_nacimiento=to_str(r.get('titular_pais_nacimiento')),
                titular_porcentaje_titularidad=to_float(r.get('titular_porcentaje_titularidad')),
                tramite_anio=to_int(r.get('tramite_anio')),
                tramite_mes=to_int(r.get('tramite_mes')),
                tramite_periodo=to_str(r.get('tramite_periodo'))
            )
        )
        
    print(f"Guardando masivamente {len(objs)} registros en SQLite...")
    batch_size = 5000
    for i in range(0, len(objs), batch_size):
        RegistroDnrpa.objects.bulk_create(objs[i:i+batch_size])
        print(f" - Guardados {min(i+batch_size, len(objs))} de {len(objs)} registros.")
        
    print(f"\n¡Proceso finalizado con éxito!")
    print(f"Registros limpios guardados en la tabla RegistroDnrpa: {len(df_consolidado)}")
    
    # Generar resumen_procesamiento.txt en la raíz del proyecto
    txt_report_path = os.path.join(proyecto_root, "resumen_procesamiento.txt")
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
            f.write(f"Año Modelo Eliminados: {eliminados_anio_modelo}\n")
            f.write(f"Año Nacimiento Corregidos: {outliers_naci_titular.sum()}\n")
        print(f"Resumen de procesamiento guardado en: {txt_report_path}")
    except Exception as e:
        print(f"Error al escribir resumen_procesamiento.txt: {e}")

if __name__ == "__main__":
    INPUT_DIR = os.path.join(proyecto_root, "data", "original", "dataset-dnrpa-robos-recuperos-autos")
    if not os.path.exists(INPUT_DIR):
        INPUT_DIR = os.path.join(proyecto_root, "data", "original")
        
    unificar_y_preparar(INPUT_DIR)
