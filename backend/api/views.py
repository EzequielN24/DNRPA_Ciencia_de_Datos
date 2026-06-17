from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.models import Cluster, Provincia, ProvinciaHistorial, MetricaModelo, KpiNacional

@api_view(['GET'])
def obtener_resumen(request):
    kpis_nacionales = KpiNacional.objects.first()
    if not kpis_nacionales:
        return Response(
            {"error": "KPIs nacionales no encontrados en la base de datos. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        "robos_totales": kpis_nacionales.robos_totales,
        "recuperos_totales": kpis_nacionales.recuperos_totales,
        "tasa_recupero_promedio": kpis_nacionales.tasa_recupero_promedio,
        "tasa_robo_nacional": kpis_nacionales.tasa_robo_nacional,
        "max_prioridad_provincia": kpis_nacionales.max_prioridad_provincia,
        "min_prioridad_provincia": kpis_nacionales.min_prioridad_provincia
    })

@api_view(['GET'])
def listar_provincias(request):
    provincias = Provincia.objects.select_related('cluster').all()
    if not provincias.exists():
        return Response(
            {"error": "Datos de provincias no encontrados. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    resumen_provincias = []
    for provincia in provincias:
        resumen_provincias.append({
            "provincia": provincia.nombre,
            "poblacion": provincia.poblacion,
            "robos": provincia.robos_totales,
            "recuperos": provincia.recuperos_totales,
            "tasa_recupero": provincia.tasa_recupero,
            "tasa_recupero_smoothed": provincia.tasa_recupero_smoothed,
            "tasa_robo": provincia.tasa_robo,
            "anio_modelo_promedio": provincia.anio_modelo_promedio,
            "edad_titular_promedio": provincia.edad_titular_promedio,
            "marca_lider_robo": provincia.marca_lider_robo,
            "tasa_robo_log": provincia.tasa_robo_log,
            "prioridad_visual": provincia.prioridad_visual,
            "cluster_id": provincia.cluster.id,
            "cluster_nombre": provincia.cluster.nombre,
            "cluster_color": provincia.cluster.color
        })
        
    return Response(resumen_provincias)

@api_view(['GET'])
def obtener_detalle_provincia(request, nombre):
    nombre_mayusculas = nombre.strip().upper()
    if nombre_mayusculas in ["TODAS", "NACIONAL", "NIVEL NACIONAL", "TODAS LAS PROVINCIAS"]:
        from django.db.models import Sum, Avg
        historial_nacional = (
            ProvinciaHistorial.objects
            .values('periodo')
            .annotate(robos=Sum('robos'), recuperos=Sum('recuperos'))
            .order_by('periodo')
        )
        
        lista_historial = []
        for registro_historial in historial_nacional:
            robos_cantidad = registro_historial['robos']
            recuperos_cantidad = registro_historial['recuperos']
            tasa = float((recuperos_cantidad / robos_cantidad * 100) if robos_cantidad > 0 else 0.0)
            tasa_suavizada = float(((recuperos_cantidad + 3.0) / (robos_cantidad + 100.0) * 100))
            
            lista_historial.append({
                "periodo": registro_historial['periodo'],
                "robos": robos_cantidad,
                "recuperos": recuperos_cantidad,
                "tasa_recupero": round(tasa, 2),
                "tasa_recupero_smoothed": round(tasa_suavizada, 2)
            })
            
        kpi_nacional = KpiNacional.objects.first()
        lista_provincias = Provincia.objects.all()
        anio_promedio = lista_provincias.aggregate(Avg('anio_modelo_promedio'))['anio_modelo_promedio__avg'] or 2009.0
        edad_promedio = lista_provincias.aggregate(Avg('edad_titular_promedio'))['edad_titular_promedio__avg'] or 43.0
        
        return Response({
            "provincia": "TODAS LAS PROVINCIAS",
            "poblacion": sum(provincia.poblacion for provincia in lista_provincias),
            "robos": kpi_nacional.robos_totales if kpi_nacional else 0,
            "recuperos": kpi_nacional.recuperos_totales if kpi_nacional else 0,
            "tasa_recupero": kpi_nacional.tasa_recupero_promedio if kpi_nacional else 0.0,
            "tasa_recupero_smoothed": kpi_nacional.tasa_recupero_promedio if kpi_nacional else 0.0,
            "tasa_robo": kpi_nacional.tasa_robo_nacional if kpi_nacional else 0.0,
            "anio_modelo_promedio": round(anio_promedio, 1),
            "edad_titular_promedio": round(edad_promedio, 1),
            "marca_lider_robo": "VOLKSWAGEN",
            "tasa_robo_log": 6.16,
            "cluster_id": 99,
            "cluster_nombre": "CONSOLIDADO FEDERAL",
            "cluster_color": "#1e3a8a",
            "historial_temporal": lista_historial
        })

    try:
        provincia = Provincia.objects.select_related('cluster').get(nombre=nombre_mayusculas)
    except Provincia.DoesNotExist:
        return Response(
            {"error": f"Provincia '{nombre}' no encontrada."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    historial = provincia.historial.all()
    lista_historial = []
    for registro_historial in historial:
        lista_historial.append({
            "periodo": registro_historial.periodo,
            "robos": registro_historial.robos,
            "recuperos": registro_historial.recuperos,
            "tasa_recupero": registro_historial.tasa_recupero,
            "tasa_recupero_smoothed": registro_historial.tasa_recupero_smoothed
        })
        
    return Response({
        "provincia": provincia.nombre,
        "poblacion": provincia.poblacion,
        "robos": provincia.robos_totales,
        "recuperos": provincia.recuperos_totales,
        "tasa_recupero": provincia.tasa_recupero,
        "tasa_recupero_smoothed": provincia.tasa_recupero_smoothed,
        "tasa_robo": provincia.tasa_robo,
        "anio_modelo_promedio": provincia.anio_modelo_promedio,
        "edad_titular_promedio": provincia.edad_titular_promedio,
        "marca_lider_robo": provincia.marca_lider_robo,
        "tasa_robo_log": provincia.tasa_robo_log,
        "prioridad_visual": provincia.prioridad_visual,
        "cluster_id": provincia.cluster.id,
        "cluster_nombre": provincia.cluster.nombre,
        "cluster_color": provincia.cluster.color,
        "historial_temporal": lista_historial
    })

@api_view(['GET'])
def obtener_info_modelo(request):
    metricas = MetricaModelo.objects.first()
    if not metricas:
        return Response(
            {"error": "Métricas del modelo no encontradas. Ejecuta python manage.py importar_resultados primero."},
            status=status.HTTP_404_NOT_FOUND
        )
        
    clusters = Cluster.objects.all().order_by('id')
    perfiles = []
    for cluster in clusters:
        perfiles.append({
            "id": cluster.id,
            "nombre": cluster.nombre,
            "color": cluster.color,
            "descripcion": cluster.descripcion,
            "politicas_publicas": cluster.politicas_publicas,
            "robos_promedio": cluster.robos_promedio,
            "recuperos_promedio": cluster.recuperos_promedio,
            "tasa_recupero_promedio": cluster.tasa_recupero_promedio,
            "prioridad_promedio": cluster.prioridad_promedio,
            "cant_provincias": cluster.cant_provincias
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
def obtener_impacto_gestion(request):
    from django.db.models import Count, Q, Sum
    from api.models import RegistroDnrpa, ProvinciaHistorial
    
    # 1. Cantidad de meses por periodo
    meses_periodo_a = RegistroDnrpa.objects.filter(tramite_periodo__lt='202312').values('tramite_periodo').distinct().count() or 47
    meses_periodo_b = RegistroDnrpa.objects.filter(tramite_periodo__gte='202312').values('tramite_periodo').distinct().count() or 29
    
    # 2. Métricas consolidadas nacionales
    registros_periodo_a = RegistroDnrpa.objects.filter(tramite_periodo__lt='202312')
    robos_periodo_a = registros_periodo_a.filter(tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA').count()
    recuperos_periodo_a = registros_periodo_a.filter(tramite_tipo='COMUNICACIÓN DE RECUPERO').count()
    tasa_periodo_a = (recuperos_periodo_a / robos_periodo_a * 100) if robos_periodo_a > 0 else 0.0
    
    registros_periodo_b = RegistroDnrpa.objects.filter(tramite_periodo__gte='202312')
    robos_periodo_b = registros_periodo_b.filter(tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA').count()
    recuperos_periodo_b = registros_periodo_b.filter(tramite_tipo='COMUNICACIÓN DE RECUPERO').count()
    tasa_periodo_b = (recuperos_periodo_b / robos_periodo_b * 100) if robos_periodo_b > 0 else 0.0
    
    promedio_robos_periodo_a = robos_periodo_a / meses_periodo_a
    promedio_recuperos_periodo_a = recuperos_periodo_a / meses_periodo_a
    promedio_robos_periodo_b = robos_periodo_b / meses_periodo_b
    promedio_recuperos_periodo_b = recuperos_periodo_b / meses_periodo_b
    
    nacional = {
        "periodo_a": {
            "robos": robos_periodo_a,
            "recuperos": recuperos_periodo_a,
            "robos_mensuales": round(promedio_robos_periodo_a, 2),
            "recuperos_mensuales": round(promedio_recuperos_periodo_a, 2),
            "tasa_recupero": round(tasa_periodo_a, 2)
        },
        "periodo_b": {
            "robos": robos_periodo_b,
            "recuperos": recuperos_periodo_b,
            "robos_mensuales": round(promedio_robos_periodo_b, 2),
            "recuperos_mensuales": round(promedio_recuperos_periodo_b, 2),
            "tasa_recupero": round(tasa_periodo_b, 2)
        },
        "diferencias": {
            "robos_mensuales": round(promedio_robos_periodo_b - promedio_robos_periodo_a, 2),
            "recuperos_mensuales": round(promedio_recuperos_periodo_b - promedio_recuperos_periodo_a, 2),
            "tasa_recupero": round(tasa_periodo_b - tasa_periodo_a, 2)
        }
    }
    
    # 3. Comparativa provincial
    resultados = RegistroDnrpa.objects.values('registro_seccional_provincia').annotate(
        robos_a=Count('id', filter=Q(tramite_periodo__lt='202312', tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA')),
        recuperos_a=Count('id', filter=Q(tramite_periodo__lt='202312', tramite_tipo='COMUNICACIÓN DE RECUPERO')),
        robos_b=Count('id', filter=Q(tramite_periodo__gte='202312', tramite_tipo='DENUNCIA DE ROBO O HURTO / RETENCION INDEBIDA')),
        recuperos_b=Count('id', filter=Q(tramite_periodo__gte='202312', tramite_tipo='COMUNICACIÓN DE RECUPERO')),
    ).order_by('registro_seccional_provincia')
    
    lista_provincias = []
    for resultado in resultados:
        nombre_provincia = resultado['registro_seccional_provincia']
        if not nombre_provincia:
            continue
            
        provincia_robos_periodo_a = resultado['robos_a']
        provincia_recuperos_periodo_a = resultado['recuperos_a']
        provincia_tasa_periodo_a = (provincia_recuperos_periodo_a / provincia_robos_periodo_a * 100) if provincia_robos_periodo_a > 0 else 0.0
        
        provincia_robos_periodo_b = resultado['robos_b']
        provincia_recuperos_periodo_b = resultado['recuperos_b']
        provincia_tasa_periodo_b = (provincia_recuperos_periodo_b / provincia_robos_periodo_b * 100) if provincia_robos_periodo_b > 0 else 0.0
        
        provincia_diferencia_tasa = provincia_tasa_periodo_b - provincia_tasa_periodo_a
        provincia_promedio_robos_mensuales_periodo_a = provincia_robos_periodo_a / meses_periodo_a
        provincia_promedio_robos_mensuales_periodo_b = provincia_robos_periodo_b / meses_periodo_b
        provincia_diferencia_robos_mensuales = provincia_promedio_robos_mensuales_periodo_b - provincia_promedio_robos_mensuales_periodo_a
        
        lista_provincias.append({
            "provincia": nombre_provincia,
            "periodo_a": {
                "robos": provincia_robos_periodo_a,
                "robos_mensuales": round(provincia_promedio_robos_mensuales_periodo_a, 2),
                "recuperos": provincia_recuperos_periodo_a,
                "tasa_recupero": round(provincia_tasa_periodo_a, 2)
            },
            "periodo_b": {
                "robos": provincia_robos_periodo_b,
                "robos_mensuales": round(provincia_promedio_robos_mensuales_periodo_b, 2),
                "recuperos": provincia_recuperos_periodo_b,
                "tasa_recupero": round(provincia_tasa_periodo_b, 2)
            },
            "diferencias": {
                "tasa_recupero": round(provincia_diferencia_tasa, 2),
                "robos_mensuales": round(provincia_diferencia_robos_mensuales, 2)
            }
        })
        
    # 4. Serie temporal nacional
    historial_nacional = (
        ProvinciaHistorial.objects
        .values('periodo')
        .annotate(robos=Sum('robos'), recuperos=Sum('recuperos'))
        .order_by('periodo')
    )
    
    serie_temporal = []
    for historial_item in historial_nacional:
        robos_cantidad = historial_item['robos']
        recuperos_cantidad = historial_item['recuperos']
        tasa = float((recuperos_cantidad / robos_cantidad * 100) if robos_cantidad > 0 else 0.0)
        tasa_suavizada = float(((recuperos_cantidad + 3.0) / (robos_cantidad + 100.0) * 100))
        
        serie_temporal.append({
            "periodo": historial_item['periodo'],
            "robos": robos_cantidad,
            "recuperos": recuperos_cantidad,
            "tasa_recupero": round(tasa, 2),
            "tasa_recupero_smoothed": round(tasa_suavizada, 2)
        })
        
    return Response({
        "nacional": nacional,
        "provincias": lista_provincias,
        "serie_temporal": serie_temporal
    })
