from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import UserSerializer, TurmaSerializer
from .models import Turma


class IsAdminOrReadWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        # require authentication for any action
        return request.user and request.user.is_authenticated


class UserViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadWrite]


class TurmaViewSet(viewsets.ModelViewSet):
    queryset = Turma.objects.all().order_by('id')
    serializer_class = TurmaSerializer
    permission_classes = [IsAdminOrReadWrite]
