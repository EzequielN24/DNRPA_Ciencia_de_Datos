from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.get_summary, name='get_summary'),
    path('provinces/', views.list_provinces, name='list_provinces'),
    path('provinces/<str:name>/', views.get_province_detail, name='get_province_detail'),
    path('model-info/', views.get_model_info, name='get_model_info'),
    path('management-impact/', views.get_management_impact, name='get_management_impact'),
]
