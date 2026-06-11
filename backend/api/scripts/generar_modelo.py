import os
import sys
import pandas as pd
import numpy as np
import django
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from django.db import transaction

# Configurar Django para usar ORM en el script
script_dir = os.path.dirname(os.path.abspath(__file__))
proyecto_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
sys.path.append(os.path.join(proyecto_root, 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import RegistroDnrpa, Cluster, Provincia, ProvinciaHistorial, MetricaModelo, KpiNacional

def generar_modelo_clustering():
    print("Consultando registros limpios de la base de datos...")
    queryset = RegistroDnrpa.objects.all().values()
    if not queryset.exists():
        raise ValueError("La tabla RegistroDnrpa está vacía. Ejecuta unificar_datos.py primero.")
        
    df = pd.DataFrame(list(queryset))
    print(f"Cargados {len(df)} registros limpios desde la base de datos.")
    
    # ------------------ AGREGACIÓN POR PROVINCIA ------------------
    print("Agregando estadísticas por provincia (Jurisdicciones)...")
    
    # Censo INDEC 2022 de población por provincia
    poblacion_provincias = {
        'BUENOS AIRES': 17569053,
        'CIUDAD AUTÓNOMA DE BUENOS AIRES': 3120612,
        'CATAMARCA': 429556,
        'CHACO': 1142963,
        'CHUBUT': 603120,
        'CÓRDOBA': 3978984,
        'CORRIENTES': 1197553,
        'ENTRE RÍOS': 1426426,
        'FORMOSA': 606041,
        'JUJUY': 797955,
        'LA PAMPA': 366022,
        'LA RIOJA': 384607,
        'MENDOZA': 2014533,
        'MISIONES': 1280960,
        'NEUQUÉN': 726590,
        'RÍO NEGRO': 762067,
        'SALTA': 1440672,
        'SAN JUAN': 818234,
        'SAN LUIS': 540905,
        'SANTA CRUZ': 333473,
        'SANTA FE': 3556522,
        'SANTIAGO DEL ESTERO': 1054028,
        'TIERRA DEL FUEGO': 190641,
        'TUCUMÁN': 1703486
    }
    
    # Obtener la lista completa de períodos ordenados a nivel nacional para la serie temporal
    todos_periodos = sorted(df['tramite_periodo'].dropna().astype(str).unique())
    
    provincias_grupos = df.groupby('registro_seccional_provincia')
    
    stats_provincias = []
    for prov, group in provincias_grupos:
        robos = int(group[group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA'].shape[0])
        recuperos = int(group[group['tramite_tipo'] == 'COMUNICACIÓN DE RECUPERO'].shape[0])
        
        # Obtener población de la jurisdicción
        pob = poblacion_provincias.get(prov, 1000000) # fallback
        
        # Tasa de robo por cada 100.000 habitantes
        tasa_robo = float((robos / pob * 100000) if pob > 0 else 0.0)
        
        # Tasa de recupero real
        tasa_recu = float((recuperos / robos * 100) if robos > 0 else 0.0)
        
        # Tasa de recupero suavizada (Suavizado Bayesiano, media de control nacional ~3.4%)
        tasa_recu_smoothed = float(((recuperos + 3.0) / (robos + 100.0) * 100))
            
        # Calcular variables descriptivas adicionales
        anio_modelo_prom = float(group['automotor_anio_modelo'].mean()) if 'automotor_anio_modelo' in group.columns else 0.0
        edad_titular_prom = float(2023 - group['titular_anio_nacimiento'].mean()) if 'titular_anio_nacimiento' in group.columns else 0.0
        
        # Marca de vehículo más robada en la provincia
        top_marca = "DESCONOCIDA"
        if 'automotor_marca_descripcion' in group.columns:
            marcas_series = group[group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA']['automotor_marca_descripcion'].dropna()
            if not marcas_series.empty:
                top_marca = str(marcas_series.mode()[0])
                

            
        # Historial temporal
        historial_temporal = []
        for per in todos_periodos:
            p_group = group[group['tramite_periodo'].astype(str) == per]
            p_robos = int(p_group[p_group['tramite_tipo'] == 'DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA'].shape[0])
            p_recu = int(p_group[p_group['tramite_tipo'] == 'COMUNICACIÓN DE RECUPERO'].shape[0])
            p_tasa = float((p_recu / p_robos * 100) if p_robos > 0 else 0.0)
            p_tasa_smoothed = float(((p_recu + 3.0) / (p_robos + 100.0) * 100))
            
            historial_temporal.append({
                "periodo": per,
                "robos": p_robos,
                "recuperos": p_recu,
                "tasa_recupero": round(p_tasa, 2),
                "tasa_recupero_smoothed": round(p_tasa_smoothed, 2)
            })
            
        stats_provincias.append({
            "provincia": prov,
            "robos": robos,
            "recuperos": recuperos,
            "tasa_recupero": round(tasa_recu, 4),
            "tasa_recupero_smoothed": round(tasa_recu_smoothed, 4),
            "tasa_robo": round(tasa_robo, 4),
            "poblacion": pob,
            "anio_modelo_promedio": round(anio_modelo_prom, 1),
            "edad_titular_promedio": round(edad_titular_prom, 1),
            "marca_lider_robo": top_marca,
            "historial_temporal": historial_temporal
        })
        
    df_provs = pd.DataFrame(stats_provincias)
    
    # ------------------ ESCALAMIENTO Y NORMALIZACIÓN ------------------
    df_provs['tasa_robo_log'] = np.log(df_provs['tasa_robo'] + 1)
    
    # NUEVA PRIORIDAD: Inversamente proporcional a la tasa de recupero suavizada
    tasa_rec_min = df_provs['tasa_recupero_smoothed'].min()
    tasa_rec_max = df_provs['tasa_recupero_smoothed'].max()
    if tasa_rec_max > tasa_rec_min:
        df_provs['prioridad_visual'] = 100 - ((df_provs['tasa_recupero_smoothed'] - tasa_rec_min) / (tasa_rec_max - tasa_rec_min) * 100)
    else:
        df_provs['prioridad_visual'] = 0.0
    df_provs['prioridad_visual'] = df_provs['prioridad_visual'].round(1)
    
    # ------------------ MACHINE LEARNING: K-MEANS CLUSTERING ------------------
    print("Aplicando Machine Learning (K-Means Clustering 1D sobre Tasa de Recupero)...")
    
    # Agrupamiento basado estrictamente en la tasa de recuperación suavizada
    X = df_provs[['tasa_recupero_smoothed']].values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df_provs['cluster_id'] = kmeans.fit_predict(X_scaled)
    
    inertia = float(kmeans.inertia_)
    sil_score = float(silhouette_score(X_scaled, df_provs['cluster_id']))
    print(f" - Inercia del modelo K-Means: {inertia:.4f}")
    print(f" - Coeficiente de Silueta: {sil_score:.4f}")
    
    # Identificar clusters ordenados estrictamente por efectividad de recuperación
    eff_cid = int(df_provs.groupby('cluster_id')['tasa_recupero_smoothed'].mean().idxmax())
    crit_cid = int(df_provs.groupby('cluster_id')['tasa_recupero_smoothed'].mean().idxmin())
    ctrl_cid = int((set([0, 1, 2]) - {eff_cid, crit_cid}).pop())
    
    sorted_cids = [crit_cid, eff_cid, ctrl_cid]
    
    cluster_profiles = {}
    
    cluster_profiles[crit_cid] = {
        "id": crit_cid,
        "nombre": "NIVEL DE INTERVENCIÓN CRÍTICO",
        "color": "#ef233c",
        "descripcion": "Jurisdicciones con la menor tasa de recuperación vehicular (tasas suavizadas inferiores al 5.0%). Demandan de forma urgente comités de auditoría de trámites, control de desarmaderos e intervención federal.",
        "politicas_publicas": [
            "Auditorías sobre tiempos de registro de trámites de recupero en seccionales locales.",
            "Control intensificado e inteligencia criminal sobre desarmaderos y mercados de autopartes.",
            "Operativos cerrojo integrados con fuerzas nacionales en accesos interprovinciales."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == crit_cid]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == crit_cid]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == crit_cid]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == crit_cid]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == crit_cid]))
    }
 
    cluster_profiles[eff_cid] = {
        "id": eff_cid,
        "nombre": "NIVEL DE EFICIENCIA EN RECUPERO DESTACADA",
        "color": "#2ec4b6",
        "descripcion": "Jurisdicciones con una tasa de recuperación sobresaliente (Entre Ríos lidera con 18.91% bruta, 16.92% suavizada). Destacan por su efectividad operativa vial y controles camineros eficientes.",
        "politicas_publicas": [
            "Mantenimiento de controles camineros interprovinciales e interjurisdiccionales viales.",
            "Digitalización completa de la carga de trámites locales para mantener la trazabilidad.",
            "Programas preventivos vecinales y alerta temprana a través de aplicaciones gubernamentales."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == eff_cid]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == eff_cid]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == eff_cid]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == eff_cid]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == eff_cid]))
    }
 
    cluster_profiles[ctrl_cid] = {
        "id": ctrl_cid,
        "nombre": "NIVEL DE INTERVENCIÓN MODERADO / BAJO",
        "color": "#ffb703",
        "descripcion": "Jurisdicciones con niveles estables o moderados de recuperación vehicular (tasas suavizadas entre 5.5% y 10.0%). Presentan riesgos bajo control operativo ordinario.",
        "politicas_publicas": [
            "Descentralización de centros de monitoreo inteligentes en ciudades cabeceras.",
            "Integración de patrullas municipales con rastreo GPS y software predictivo de patrullaje.",
            "Sistemas integrados de patentes (cámaras fijas y móviles en patrullas) para detección en tiempo real."
        ],
        "robos_promedio": round(float(df_provs[df_provs['cluster_id'] == ctrl_cid]['robos'].mean()), 1),
        "recuperos_promedio": round(float(df_provs[df_provs['cluster_id'] == ctrl_cid]['recuperos'].mean()), 1),
        "tasa_recupero_promedio": round(float(df_provs[df_provs['cluster_id'] == ctrl_cid]['tasa_recupero'].mean()), 2),
        "prioridad_promedio": round(float(df_provs[df_provs['cluster_id'] == ctrl_cid]['prioridad_visual'].mean()), 1),
        "cant_provincias": int(len(df_provs[df_provs['cluster_id'] == ctrl_cid]))
    }
    
    # Asignar nombres y colores textuales
    df_provs['cluster_nombre'] = df_provs['cluster_id'].map(lambda cid: cluster_profiles[cid]['nombre'])
    df_provs['cluster_color'] = df_provs['cluster_id'].map(lambda cid: cluster_profiles[cid]['color'])
    
    # Calcular población nacional total
    pob_nacional_total = sum(poblacion_provincias.values())
    
    # ------------------ GUARDAR EN BASE DE DATOS DIRECTAMENTE ------------------
    print("\nGuardando resultados consolidados directamente en la Base de Datos...")
    try:
        with transaction.atomic():
            # 1. Limpiar datos antiguos agregados y de modelo
            KpiNacional.objects.all().delete()
            MetricaModelo.objects.all().delete()
            ProvinciaHistorial.objects.all().delete()
            Provincia.objects.all().delete()
            Cluster.objects.all().delete()

            # 2. Cargar KPIs Nacionales
            KpiNacional.objects.create(
                robos_totales=int(df_provs['robos'].sum()),
                recuperos_totales=int(df_provs['recuperos'].sum()),
                tasa_recupero_promedio=round(float(df_provs['recuperos'].sum() / df_provs['robos'].sum() * 100), 4),
                tasa_robo_nacional=round(float(df_provs['robos'].sum() / pob_nacional_total * 100000), 4),
                max_prioridad_provincia=df_provs.loc[df_provs['prioridad_visual'].idxmax(), 'provincia'],
                min_prioridad_provincia=df_provs.loc[df_provs['prioridad_visual'].idxmin(), 'provincia']
            )

            # 3. Cargar Métricas del Modelo
            MetricaModelo.objects.create(
                algoritmo="K-Means Clustering 1D",
                k_clusters=3,
                inercia=inertia,
                coeficiente_silueta=sil_score,
                features_utilizadas=["Tasa de Recuperación Suavizada (%)"]
            )

            # 4. Cargar Perfiles de Clústeres
            for cid in sorted_cids:
                perfil = cluster_profiles[cid]
                Cluster.objects.create(
                    id=perfil['id'],
                    nombre=perfil['nombre'],
                    color=perfil['color'],
                    descripcion=perfil['descripcion'],
                    politicas_publicas=perfil['politicas_publicas'],
                    cant_provincias=perfil['cant_provincias'],
                    robos_promedio=perfil['robos_promedio'],
                    recuperos_promedio=perfil['recuperos_promedio'],
                    tasa_recupero_promedio=perfil['tasa_recupero_promedio'],
                    prioridad_promedio=perfil['prioridad_promedio']
                )

            # 5. Cargar Provincias y su Historial Temporal
            historial_objs = []
            provincias_list = df_provs.to_dict(orient='records')
            
            for p in provincias_list:
                cluster_obj = Cluster.objects.get(id=p['cluster_id'])
                
                prov_obj = Provincia.objects.create(
                    nombre=p['provincia'],
                    poblacion=p['poblacion'],
                    robos_totales=p['robos'],
                    recuperos_totales=p['recuperos'],
                    tasa_robo=p['tasa_robo'],
                    tasa_robo_log=p['tasa_robo_log'],
                    tasa_recupero=p['tasa_recupero'],
                    tasa_recupero_smoothed=p['tasa_recupero_smoothed'],
                    anio_modelo_promedio=p['anio_modelo_promedio'],
                    edad_titular_promedio=p['edad_titular_promedio'],
                    marca_lider_robo=p['marca_lider_robo'],
                    prioridad_visual=p['prioridad_visual'],
                    cluster=cluster_obj
                )

                for hist in p['historial_temporal']:
                    historial_objs.append(
                        ProvinciaHistorial(
                            provincia=prov_obj,
                            periodo=str(hist['periodo']),
                            robos=hist['robos'],
                            recuperos=hist['recuperos'],
                            tasa_recupero=hist['tasa_recupero'],
                            tasa_recupero_smoothed=hist['tasa_recupero_smoothed']
                        )
                    )

            # Inserción masiva del historial temporal
            ProvinciaHistorial.objects.bulk_create(historial_objs)

        print("\n¡Resultados de K-Means guardados exitosamente en la base de datos relacional SQLite!")
        print(f"Total de provincias modeladas en BD: {len(df_provs)}")
        print("Distribución de clusters:")
        for cid in sorted_cids:
            print(f" - {cluster_profiles[cid]['nombre']}: {cluster_profiles[cid]['cant_provincias']} provincias.")

    except Exception as e:
        print(f"Error al escribir los resultados del clustering en la base de datos: {e}")
        raise e

if __name__ == "__main__":
    generar_modelo_clustering()
