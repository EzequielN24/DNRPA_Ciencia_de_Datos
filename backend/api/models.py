from django.db import models

class Cluster(models.Model):
    id = models.IntegerField(primary_key=True)  # IDs 0, 1, 2 asignados por K-Means
    nombre = models.CharField(max_length=255)
    color = models.CharField(max_length=20)
    descripcion = models.TextField()
    politicas_publicas = models.JSONField(default=list)
    cant_provincias = models.IntegerField()
    robos_promedio = models.FloatField()
    recuperos_promedio = models.FloatField()
    tasa_recupero_promedio = models.FloatField()
    prioridad_promedio = models.FloatField()

    def __str__(self):
        return self.nombre

class Provincia(models.Model):
    nombre = models.CharField(max_length=100, primary_key=True)
    poblacion = models.IntegerField()
    robos_totales = models.IntegerField()
    recuperos_totales = models.IntegerField()
    tasa_robo = models.FloatField()
    tasa_robo_log = models.FloatField()
    tasa_recupero = models.FloatField()
    tasa_recupero_smoothed = models.FloatField()
    anio_modelo_promedio = models.FloatField()
    edad_titular_promedio = models.FloatField()
    marca_lider_robo = models.CharField(max_length=100)
    prioridad_visual = models.FloatField()
    cluster = models.ForeignKey(Cluster, on_delete=models.CASCADE, related_name='provincias')

    def __str__(self):
        return self.nombre

class ProvinciaHistorial(models.Model):
    provincia = models.ForeignKey(Provincia, on_delete=models.CASCADE, related_name='historial')
    periodo = models.CharField(max_length=6)  # Formato YYYYMM (ej. 202301)
    robos = models.IntegerField()
    recuperos = models.IntegerField()
    tasa_recupero = models.FloatField()
    tasa_recupero_smoothed = models.FloatField()

    class Meta:
        ordering = ['periodo']
        unique_together = ('provincia', 'periodo')

    def __str__(self):
        return f"{self.provincia.nombre} - {self.periodo}"

class MetricaModelo(models.Model):
    algoritmo = models.CharField(max_length=255)
    k_clusters = models.IntegerField()
    inercia = models.FloatField()
    coeficiente_silueta = models.FloatField()
    features_utilizadas = models.JSONField(default=list)

    def __str__(self):
        return f"{self.algoritmo} (K={self.k_clusters})"

class KpiNacional(models.Model):
    robos_totales = models.IntegerField()
    recuperos_totales = models.IntegerField()
    tasa_recupero_promedio = models.FloatField()
    tasa_robo_nacional = models.FloatField()
    max_prioridad_provincia = models.CharField(max_length=100)
    min_prioridad_provincia = models.CharField(max_length=100)

    def __str__(self):
        return "KPIs Nacionales"

class RegistroDnrpa(models.Model):
    tramite_tipo = models.CharField(max_length=255)
    tramite_fecha = models.DateField()
    fecha_inscripcion_inicial = models.DateField(null=True, blank=True)
    registro_seccional_codigo = models.IntegerField()
    registro_seccional_descripcion = models.CharField(max_length=255)
    registro_seccional_provincia = models.CharField(max_length=100, db_index=True)
    automotor_origen = models.CharField(max_length=100)
    automotor_anio_modelo = models.IntegerField()
    automotor_tipo_codigo = models.CharField(max_length=100, null=True, blank=True)
    automotor_tipo_descripcion = models.CharField(max_length=255, null=True, blank=True)
    automotor_marca_codigo = models.CharField(max_length=100, null=True, blank=True)
    automotor_marca_descripcion = models.CharField(max_length=255, null=True, blank=True)
    automotor_modelo_codigo = models.CharField(max_length=100, null=True, blank=True)
    automotor_modelo_descripcion = models.CharField(max_length=255, null=True, blank=True)
    automotor_uso_codigo = models.IntegerField(null=True, blank=True)
    automotor_uso_descripcion = models.CharField(max_length=255, null=True, blank=True)
    titular_tipo_persona = models.CharField(max_length=100, null=True, blank=True)
    titular_domicilio_localidad = models.CharField(max_length=255, null=True, blank=True)
    titular_domicilio_provincia = models.CharField(max_length=100, null=True, blank=True)
    titular_genero = models.CharField(max_length=50, null=True, blank=True)
    titular_anio_nacimiento = models.IntegerField(null=True, blank=True)
    titular_pais_nacimiento = models.CharField(max_length=100, null=True, blank=True)
    titular_porcentaje_titularidad = models.FloatField(null=True, blank=True)
    tramite_anio = models.IntegerField(db_index=True)
    tramite_mes = models.IntegerField()
    tramite_periodo = models.CharField(max_length=6, db_index=True)

    def __str__(self):
        return f"{self.tramite_tipo} - {self.registro_seccional_provincia} - {self.tramite_fecha}"
