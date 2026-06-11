from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.models import Cluster, Provincia, ProvinciaHistorial, MetricaModelo, KpiNacional

@api_view(['GET'])
def get_summary(request):
    kpi = KpiNacional.objects.first()
    if not kpi:
        return Response(
            {"error": "KPIs nacionales no encontrados en la base de datos. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        "robos_totales": kpi.robos_totales,
        "recuperos_totales": kpi.recuperos_totales,
        "tasa_recupero_promedio": kpi.tasa_recupero_promedio,
        "tasa_robo_nacional": kpi.tasa_robo_nacional,
        "max_prioridad_provincia": kpi.max_prioridad_provincia,
        "min_prioridad_provincia": kpi.min_prioridad_provincia
    })

@api_view(['GET'])
def list_provinces(request):
    provincias = Provincia.objects.select_related('cluster').all()
    if not provincias.exists():
        return Response(
            {"error": "Datos de provincias no encontrados. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    provinces_summary = []
    for p in provincias:
        provinces_summary.append({
            "provincia": p.nombre,
            "poblacion": p.poblacion,
            "robos": p.robos_totales,
            "recuperos": p.recuperos_totales,
            "tasa_recupero": p.tasa_recupero,
            "tasa_recupero_smoothed": p.tasa_recupero_smoothed,
            "tasa_robo": p.tasa_robo,
            "anio_modelo_promedio": p.anio_modelo_promedio,
            "edad_titular_promedio": p.edad_titular_promedio,
            "marca_lider_robo": p.marca_lider_robo,
            "tasa_robo_log": p.tasa_robo_log,
            "prioridad_visual": p.prioridad_visual,
            "cluster_id": p.cluster.id,
            "cluster_nombre": p.cluster.nombre,
            "cluster_color": p.cluster.color
        })
        
    return Response(provinces_summary)

@api_view(['GET'])
def get_province_detail(request, name):
    name_upper = name.strip().upper()
    if name_upper in ["TODAS", "NACIONAL", "NIVEL NACIONAL", "TODAS LAS PROVINCIAS"]:
        from django.db.models import Sum, Avg
        historial_nacional = (
            ProvinciaHistorial.objects
            .values('periodo')
            .annotate(robos=Sum('robos'), recuperos=Sum('recuperos'))
            .order_by('periodo')
        )
        
        historial_list = []
        for h in historial_nacional:
            r = h['robos']
            rec = h['recuperos']
            tasa = float((rec / r * 100) if r > 0 else 0.0)
            tasa_smoothed = float(((rec + 3.0) / (r + 100.0) * 100))
            
            historial_list.append({
                "periodo": h['periodo'],
                "robos": r,
                "recuperos": rec,
                "tasa_recupero": round(tasa, 2),
                "tasa_recupero_smoothed": round(tasa_smoothed, 2)
            })
            
        kpi = KpiNacional.objects.first()
        pvs = Provincia.objects.all()
        anio_prom = pvs.aggregate(Avg('anio_modelo_promedio'))['anio_modelo_promedio__avg'] or 2009.0
        edad_prom = pvs.aggregate(Avg('edad_titular_promedio'))['edad_titular_promedio__avg'] or 43.0
        
        return Response({
            "provincia": "TODAS LAS PROVINCIAS",
            "poblacion": sum(p.poblacion for p in pvs),
            "robos": kpi.robos_totales if kpi else 0,
            "recuperos": kpi.recuperos_totales if kpi else 0,
            "tasa_recupero": kpi.tasa_recupero_promedio if kpi else 0.0,
            "tasa_recupero_smoothed": kpi.tasa_recupero_promedio if kpi else 0.0,
            "tasa_robo": kpi.tasa_robo_nacional if kpi else 0.0,
            "anio_modelo_promedio": round(anio_prom, 1),
            "edad_titular_promedio": round(edad_prom, 1),
            "marca_lider_robo": "VOLKSWAGEN",
            "tasa_robo_log": 6.16,
            "cluster_id": 99,
            "cluster_nombre": "CONSOLIDADO FEDERAL",
            "cluster_color": "#ffffff",
            "historial_temporal": historial_list
        })

    try:
        p = Provincia.objects.select_related('cluster').get(nombre=name_upper)
    except Provincia.DoesNotExist:
        return Response(
            {"error": f"Provincia '{name}' no encontrada."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Obtener el historial temporal ordenado
    historial = p.historial.all()
    historial_list = []
    for h in historial:
        historial_list.append({
            "periodo": h.periodo,
            "robos": h.robos,
            "recuperos": h.recuperos,
            "tasa_recupero": h.tasa_recupero,
            "tasa_recupero_smoothed": h.tasa_recupero_smoothed
        })
        
    return Response({
        "provincia": p.nombre,
        "poblacion": p.poblacion,
        "robos": p.robos_totales,
        "recuperos": p.recuperos_totales,
        "tasa_recupero": p.tasa_recupero,
        "tasa_recupero_smoothed": p.tasa_recupero_smoothed,
        "tasa_robo": p.tasa_robo,
        "anio_modelo_promedio": p.anio_modelo_promedio,
        "edad_titular_promedio": p.edad_titular_promedio,
        "marca_lider_robo": p.marca_lider_robo,
        "tasa_robo_log": p.tasa_robo_log,
        "prioridad_visual": p.prioridad_visual,
        "cluster_id": p.cluster.id,
        "cluster_nombre": p.cluster.nombre,
        "cluster_color": p.cluster.color,
        "historial_temporal": historial_list
    })

@api_view(['GET'])
def get_model_info(request):
    metricas = MetricaModelo.objects.first()
    if not metricas:
        return Response(
            {"error": "Métricas del modelo no encontradas. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
        
    clusters = Cluster.objects.all().order_by('id')
    perfiles = []
    for c in clusters:
        # Los clusters tienen IDs dinámicos según el cálculo de K-Means, ordenados por id
        perfiles.append({
            "id": c.id,
            "nombre": c.nombre,
            "color": c.color,
            "descripcion": c.descripcion,
            "politicas_publicas": c.politicas_publicas,
            "robos_promedio": c.robos_promedio,
            "recuperos_promedio": c.recuperos_promedio,
            "tasa_recupero_promedio": c.tasa_recupero_promedio,
            "prioridad_promedio": c.prioridad_promedio,
            "cant_provincias": c.cant_provincias
        })
        
    return Response({
        "metricas_modelo": {
            "inercia": metricas.inercia,
            "coeficiente_silueta": metricas.coeficiente_silueta,
            "algoritmo": metricas.algoritmo,
            "k_clusters": metricas.k_clusters,
            "features_utilizadas": metricas.features_utilizadas
        },
        "perfiles_clusters": perfiles
    })

@api_view(['GET'])
def get_management_impact(request):
    from django.db.models import Count, Avg, F, Q, Sum
    from api.models import RegistroDnrpa, ProvinciaHistorial
    
    # 1. Period months counts
    months_a = RegistroDnrpa.objects.filter(tramite_periodo__lt='202312').values('tramite_periodo').distinct().count() or 47
    months_b = RegistroDnrpa.objects.filter(tramite_periodo__gte='202312').values('tramite_periodo').distinct().count() or 29
    
    # 2. National consolidated metrics
    qs_a = RegistroDnrpa.objects.filter(tramite_periodo__lt='202312')
    robos_a = qs_a.filter(tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA').count()
    recuperos_a = qs_a.filter(tramite_tipo='COMUNICACIÓN DE RECUPERO').count()
    rate_a = (recuperos_a / robos_a * 100) if robos_a > 0 else 0.0
    
    qs_b = RegistroDnrpa.objects.filter(tramite_periodo__gte='202312')
    robos_b = qs_b.filter(tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA').count()
    recuperos_b = qs_b.filter(tramite_tipo='COMUNICACIÓN DE RECUPERO').count()
    rate_b = (recuperos_b / robos_b * 100) if robos_b > 0 else 0.0
    
    avg_robos_a = robos_a / months_a
    avg_recuperos_a = recuperos_a / months_a
    avg_robos_b = robos_b / months_b
    avg_recuperos_b = recuperos_b / months_b
    
    nacional = {
        "periodo_a": {
            "robos": robos_a,
            "recuperos": recuperos_a,
            "robos_mensuales": round(avg_robos_a, 2),
            "recuperos_mensuales": round(avg_recuperos_a, 2),
            "tasa_recupero": round(rate_a, 2)
        },
        "periodo_b": {
            "robos": robos_b,
            "recuperos": recuperos_b,
            "robos_mensuales": round(avg_robos_b, 2),
            "recuperos_mensuales": round(avg_recuperos_b, 2),
            "tasa_recupero": round(rate_b, 2)
        },
        "diferencias": {
            "robos_mensuales": round(avg_robos_b - avg_robos_a, 2),
            "recuperos_mensuales": round(avg_recuperos_b - avg_recuperos_a, 2),
            "tasa_recupero": round(rate_b - rate_a, 2)
        }
    }
    
    # 3. Provincial comparison using conditional aggregation
    results = RegistroDnrpa.objects.values('registro_seccional_provincia').annotate(
        robos_a=Count('id', filter=Q(tramite_periodo__lt='202312', tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA')),
        recuperos_a=Count('id', filter=Q(tramite_periodo__lt='202312', tramite_tipo='COMUNICACIÓN DE RECUPERO')),
        robos_b=Count('id', filter=Q(tramite_periodo__gte='202312', tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA')),
        recuperos_b=Count('id', filter=Q(tramite_periodo__gte='202312', tramite_tipo='COMUNICACIÓN DE RECUPERO')),
    ).order_by('registro_seccional_provincia')
    
    provincias_list = []
    for r in results:
        p = r['registro_seccional_provincia']
        if not p:
            continue
            
        p_robos_a = r['robos_a']
        p_recuperos_a = r['recuperos_a']
        p_rate_a = (p_recuperos_a / p_robos_a * 100) if p_robos_a > 0 else 0.0
        
        p_robos_b = r['robos_b']
        p_recuperos_b = r['recuperos_b']
        p_rate_b = (p_recuperos_b / p_robos_b * 100) if p_robos_b > 0 else 0.0
        
        p_diff_rate = p_rate_b - p_rate_a
        p_avg_robos_mensuales_a = p_robos_a / months_a
        p_avg_robos_mensuales_b = p_robos_b / months_b
        p_diff_robos_mensuales = p_avg_robos_mensuales_b - p_avg_robos_mensuales_a
        
        provincias_list.append({
            "provincia": p,
            "periodo_a": {
                "robos": p_robos_a,
                "robos_mensuales": round(p_avg_robos_mensuales_a, 2),
                "recuperos": p_recuperos_a,
                "tasa_recupero": round(p_rate_a, 2)
            },
            "periodo_b": {
                "robos": p_robos_b,
                "robos_mensuales": round(p_avg_robos_mensuales_b, 2),
                "recuperos": p_recuperos_b,
                "tasa_recupero": round(p_rate_b, 2)
            },
            "diferencias": {
                "tasa_recupero": round(p_diff_rate, 2),
                "robos_mensuales": round(p_diff_robos_mensuales, 2)
            }
        })
        
    # 4. Timeseries
    historial_nacional = (
        ProvinciaHistorial.objects
        .values('periodo')
        .annotate(robos=Sum('robos'), recuperos=Sum('recuperos'))
        .order_by('periodo')
    )
    
    timeseries = []
    for h in historial_nacional:
        r = h['robos']
        rec = h['recuperos']
        tasa = float((rec / r * 100) if r > 0 else 0.0)
        tasa_smoothed = float(((rec + 3.0) / (r + 100.0) * 100))
        
        timeseries.append({
            "periodo": h['periodo'],
            "robos": r,
            "recuperos": rec,
            "tasa_recupero": round(tasa, 2),
            "tasa_recupero_smoothed": round(tasa_smoothed, 2)
        })
        
    return Response({
        "nacional": nacional,
        "provincias": provincias_list,
        "timeseries": timeseries
    })
