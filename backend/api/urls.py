from django.urls import path
from . import views

urlpatterns = [
    path('resumen/', views.obtener_resumen, name='obtener_resumen'),
    path('provincias/', views.listar_provincias, name='listar_provincias'),
    path('provincias/<str:nombre>/', views.obtener_detalle_provincia, name='obtener_detalle_provincia'),
    path('modelo/', views.obtener_info_modelo, name='obtener_info_modelo'),
    path('impacto-gestion/', views.obtener_impacto_gestion, name='obtener_impacto_gestion'),
]
