"""
URL configuration for api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .token_views import EmailTokenObtainPairView
from .users_views import UserListView
from rest_framework import routers
from django.urls import include
from .viewsets import UserViewSet, TurmaViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'turmas', TurmaViewSet, basename='turma')

urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT auth endpoints (used by frontend to obtain access/refresh tokens)
    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# include router URLs under /api/
urlpatterns += [path('api/', include((router.urls, 'api'), namespace='api'))]
