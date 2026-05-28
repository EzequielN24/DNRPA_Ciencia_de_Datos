import os
import pandas as pd
import numpy as np
import json
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

def generar_modelo_clustering():
    # Rutas dinámicas
    script_dir = os.path.dirname(os.path.abspath(__file__))
    proyecto_root = os.path.dirname(script_dir)
    csv_path = os.path.join(proyecto_root, "data", "procesada", "dataset_consolidado.csv")
    output_json_path = os.path.join(proyecto_root, "data", "procesada", "resultados_modelo.json")
    
    print(f"Cargando dataset consolidado desde: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"No se encontró el dataset consolidado en {csv_path}. Ejecuta unificar_datos.py primero.")
        
    df = pd.read_csv(csv_path)
    
    # ------------------ AGREGACIÓN POR PROVINCIA ------------------
    print("Agregando estadísticas por provincia (Jurisdicciones)...")
    
    # Obtener la lista completa de períodos ordenados a nivel nacional para la serie temporal
    todos_periodos = sorted(df['tramite_periodo'].dropna().astype(str).unique())
    
    provincias_grupos = df.groupby('registro_seccional_provincia')
    
    stats_provincias = []
    for prov, group in provincias_grupos:
        robos = int(group[group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA'].shape[0])
        recuperos = int(group[group['tramite_tipo'] == 'COMUNICACIÓN DE RECUPERO'].shape[0])
        tasa_recu = float((recuperos / robos * 100) if robos > 0 else 0.0)
        
        # Calcular IPI absoluto (autos perdidos)
        ipi = robos - recuperos
        if ipi < 0:
            ipi = 0
            
        # Calcular variables descriptivas adicionales
        anio_modelo_prom = float(group['automotor_anio_modelo'].mean()) if 'automotor_anio_modelo' in group.columns else 0.0
        edad_titular_prom = float(2023 - group['titular_anio_nacimiento'].mean()) if 'titular_anio_nacimiento' in group.columns else 0.0
        
        # Marca de vehículo más robada en la provincia
        top_marca = "DESCONOCIDA"
        if 'automotor_marca_descripcion' in group.columns:
            marcas_series = group[group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA']['automotor_marca_descripcion'].dropna()
            if not marcas_series.empty:
                top_marca = str(marcas_series.mode()[0])
                
        # Porcentaje de origen nacional
        pct_nacional = 0.0
        if 'automotor_origen' in group.columns:
            pct_nacional = float((group['automotor_origen'] == 'NACIONAL').mean() * 100)
            
        # ------------------ TENDENCIA TEMPORAL MENSUAL DE LA PROVINCIA ------------------
        historial_temporal = []
        for per in todos_periodos:
            p_group = group[group['tramite_periodo'].astype(str) == per]
            p_robos = int(p_group[p_group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA'].shape[0])
            p_recu = int(p_group[p_group['tramite_tipo'] == 'COMUNICACIÓN DE RECUPERO'].shape[0])
            p_tasa = float((p_recu / p_robos * 100) if p_robos > 0 else 0.0)
            
            historial_temporal.append({
                "periodo": per,
                "robos": p_robos,
                "recuperos": p_recu,
                "tasa_recupero": round(p_tasa, 2)
            })
            
        stats_provincias.append({
            "provincia": prov,
            "robos": robos,
            "recuperos": recuperos,
            "tasa_recupero": round(tasa_recu, 4),
            "ipi": ipi,
            "anio_modelo_promedio": round(anio_modelo_prom, 1),
            "edad_titular_promedio": round(edad_titular_prom, 1),
            "marca_lider_robo": top_marca,
            "porcentaje_nacional": round(pct_nacional, 2),
            "historial_temporal": historial_temporal
        })
        
    df_provs = pd.DataFrame(stats_provincias)
    
    # ------------------ ESCALAMIENTO Y NORMALIZACIÓN ------------------
    # 1. Aplicar escala logarítmica sobre el IPI para comprimir la brecha de volumen
    df_provs['ipi_log'] = np.log(df_provs['ipi'] + 1)
    
    # 2. Generar Prioridad Visual de Seguridad (0 a 100)
    ipi_log_min = df_provs['ipi_log'].min()
    ipi_log_max = df_provs['ipi_log'].max()
    if ipi_log_max > ipi_log_min:
        df_provs['prioridad_visual'] = ((df_provs['ipi_log'] - ipi_log_min) / (ipi_log_max - ipi_log_min) * 100)
    else:
        df_provs['prioridad_visual'] = 0.0
    df_provs['prioridad_visual'] = df_provs['prioridad_visual'].round(1)
    
    # ------------------ MACHINE LEARNING: K-MEANS CLUSTERING ------------------
    print("Aplicando Machine Learning (K-Means Clustering)...")
    
    X = df_provs[['ipi_log', 'tasa_recupero']].values
    
    # Estandarización estricta Z-score
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Ajustar K-Means con K=3 clusters
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df_provs['cluster_id'] = kmeans.fit_predict(X_scaled)
    
    # Calcular métricas de evaluación
    inertia = float(kmeans.inertia_)
    sil_score = float(silhouette_score(X_scaled, df_provs['cluster_id']))
    print(f" - Inercia del modelo K-Means: {inertia:.4f}")
    print(f" - Coeficiente de Silueta: {sil_score:.4f}")
    
    # Clasificación conceptual y mapeo de perfiles de clusters
    centroids = kmeans.cluster_centers_
    sorted_cids = sorted(range(3), key=lambda cid: df_provs[df_provs['cluster_id'] == cid]['prioridad_visual'].mean(), reverse=True)
    
    cluster_profiles = {}
    
    cluster_profiles[sorted_cids[0]] = {
        "id": sorted_cids[0],
        "nombre": "NIVEL DE INTERVENCIÓN CRÍTICO",
        "color": "#ef233c",
        "descripcion": "Jurisdicciones con masivo volumen delictivo acumulado. Buenos Aires y CABA lideran con prioridad máxima debido a la concentración absoluta del robo de vehículos a escala nacional.",
        "politicas_publicas": [
            "Despliegue reforzado de Fuerzas Federales en accesos clave (Anillo Digital).",
            "Control exhaustivo e inteligencia criminal sobre desarmaderos y venta online de autopartes.",
            "Automatización tecnológica para acortar a minutos la alerta de robo entre DNRPA y fuerzas operativas."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[0]]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[0]]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[0]]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[0]]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == sorted_cids[0]]))
    }

    cluster_profiles[sorted_cids[1]] = {
        "id": sorted_cids[1],
        "nombre": "NIVEL DE INTERVENCIÓN MODERADO",
        "color": "#ffb703",
        "descripcion": "Provincias con incidencia delictiva mediana a moderada (Córdoba, Santa Fe, Mendoza). Cuentan con estructuras delictivas consolidadas pero controlables mediante inversión tecnológica regional.",
        "politicas_publicas": [
            "Descentralización de centros de monitoreo inteligentes en ciudades cabeceras.",
            "Integración de patrullas municipales con rastreo GPS y software predictivo de patrullaje.",
            "Sistemas integrados de patentes (cámaras fijas y móviles en patrullas) para detección en tiempo real."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[1]]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[1]]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[1]]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[1]]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == sorted_cids[1]]))
    }

    cluster_profiles[sorted_cids[2]] = {
        "id": sorted_cids[2],
        "nombre": "NIVEL DE EFICIENCIA DESTACADA / CONTROLADO",
        "color": "#2ec4b6",
        "descripcion": "Jurisdicciones con baja incidencia absoluta (Neuquén, San Luis, Chubut) o con tasas de recupero sobresalientes en base a su flujo (Entre Ríos con 18.9%). Presentan riesgos bajo control operativo.",
        "politicas_publicas": [
            "Mantenimiento de controles camineros interprovinciales (muy efectivo en Entre Ríos).",
            "Digitalización completa de la carga de trámites locales para mantener la trazabilidad.",
            "Programas preventivos vecinales y alerta temprana a través de aplicaciones gubernamentales."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[2]]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[2]]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[2]]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == sorted_cids[2]]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == sorted_cids[2]]))
    }
    
    # Asignar nombres textuales descriptivos del cluster a cada provincia para consumo directo del JS
    df_provs['cluster_nombre'] = df_provs['cluster_id'].map(lambda cid: cluster_profiles[cid]['nombre'])
    df_provs['cluster_color'] = df_provs['cluster_id'].map(lambda cid: cluster_profiles[cid]['color'])
    
    # Convertir estadísticas de provincias a formato JSON estructurado
    provincias_list = df_provs.to_dict(orient='records')
    
    # Estructura final del JSON para el Dashboard
    dataset_final = {
        "nacionales": {
            "robos_totales": int(df_provs['robos'].sum()),
            "recuperos_totales": int(df_provs['recuperos'].sum()),
            "tasa_recupero_promedio": round(float(df_provs['recuperos'].sum() / df_provs['robos'].sum() * 100), 4),
            "ipi_total": int(df_provs['ipi'].sum()),
            "max_prioridad_provincia": df_provs.loc[df_provs['prioridad_visual'].idxmax(), 'provincia'],
            "min_prioridad_provincia": df_provs.loc[df_provs['prioridad_visual'].idxmin(), 'provincia']
        },
        "metricas_modelo": {
            "inercia": inertia,
            "coeficiente_silueta": sil_score,
            "algoritmo": "K-Means Clustering",
            "k_clusters": 3,
            "features_utilizadas": ["IPI Logarítmico (ln(IPI+1))", "Tasa de Recuperación (%)"]
        },
        "perfiles_clusters": [cluster_profiles[cid] for cid in sorted_cids],
        "provincias": provincias_list
    }
    
    # Escribir archivo JSON
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(dataset_final, f, indent=4, ensure_ascii=False)
        
    print(f"\n¡Modelo de Machine Learning generado y guardado en JSON!")
    print(f"Archivo de salida: {output_json_path}")
    print(f"Total de provincias modeladas: {len(df_provs)}")
    print("Distribución de clusters:")
    for cid in sorted_cids:
        print(f" - {cluster_profiles[cid]['nombre']}: {cluster_profiles[cid]['cant_provincias']} provincias.")

if __name__ == "__main__":
    generar_modelo_clustering()
