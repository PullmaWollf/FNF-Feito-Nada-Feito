from django.urls import path
from game import views
urlpatterns = [path('', views.index), path('api/levels/', views.levels), path('api/charts/<int:level>/', views.chart)]
