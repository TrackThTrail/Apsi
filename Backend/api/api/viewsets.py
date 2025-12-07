from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import UserSerializer, TurmaSerializer, PatientSerializer, EstagiarioSerializer, AvailabilitySerializer, ScheduleSerializer, PatientAvailabilitySerializer
from .models import Turma, Patient, Estagiario, Availability, Schedule, PatientAvailability


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


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('id')
    serializer_class = PatientSerializer
    permission_classes = [IsAdminOrReadWrite]


class EstagiarioViewSet(viewsets.ModelViewSet):
    queryset = Estagiario.objects.all().order_by('id')
    serializer_class = EstagiarioSerializer
    permission_classes = [IsAdminOrReadWrite]


class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all().order_by('id')
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAdminOrReadWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        intern = self.request.query_params.get('intern')
        if intern is not None:
            qs = qs.filter(intern_id=intern)
        return qs



class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all().order_by('id')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrReadWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get('patient')
        intern = self.request.query_params.get('intern')
        if patient is not None:
            qs = qs.filter(patient_id=patient)
        if intern is not None:
            qs = qs.filter(intern_id=intern)
        return qs

    # allow filtering schedules by date range and text query
    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get('patient')
        intern = self.request.query_params.get('intern')
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        q = self.request.query_params.get('q')
        if patient is not None:
            qs = qs.filter(patient_id=patient)
        if intern is not None:
            qs = qs.filter(intern_id=intern)
        if start:
            qs = qs.filter(start_time__date__gte=start)
        if end:
            qs = qs.filter(end_time__date__lte=end)
        if q:
            qs = qs.filter(
                Q(intern__first_name__icontains=q) |
                Q(intern__last_name__icontains=q) |
                Q(patient__first_name__icontains=q) |
                Q(patient__last_name__icontains=q) |
                Q(room_id__icontains=q)
            )
        return qs


class PatientAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = PatientAvailability.objects.all().order_by('id')
    serializer_class = PatientAvailabilitySerializer
    permission_classes = [IsAdminOrReadWrite]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get('patient')
        if patient is not None:
            qs = qs.filter(patient_id=patient)
        return qs
