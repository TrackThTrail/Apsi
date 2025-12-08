from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import UserSerializer, TurmaSerializer, PatientSerializer, EstagiarioSerializer, AvailabilitySerializer, ScheduleSerializer, PatientAvailabilitySerializer
from .models import Turma, Patient, Estagiario, Availability, Schedule, PatientAvailability
from django.utils import timezone


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
    # list only active patients by default
    queryset = Patient.objects.filter(is_active=True).order_by('id')
    serializer_class = PatientSerializer
    permission_classes = [IsAdminOrReadWrite]

    def destroy(self, request, pk=None):
        # soft-delete: mark patient inactive and remove future patient availabilities and schedules
        try:
            pt = Patient.objects.get(pk=pk)
        except Patient.DoesNotExist:
            return Response(status=404)
        pt.is_active = False
        pt.save()
        now = timezone.now()
        PatientAvailability.objects.filter(patient=pt, start_date__gt=now).delete()
        Schedule.objects.filter(patient=pt, start_time__gt=now).delete()
        return Response(status=204)


class EstagiarioViewSet(viewsets.ModelViewSet):
    # only list active interns by default
    queryset = Estagiario.objects.filter(is_active=True).order_by('id')
    serializer_class = EstagiarioSerializer
    permission_classes = [IsAdminOrReadWrite]

    def destroy(self, request, pk=None):
        # Instead of hard-deleting, mark intern as inactive and remove future availabilities and schedules
        try:
            est = Estagiario.objects.get(pk=pk)
        except Estagiario.DoesNotExist:
            return Response(status=404)
        # mark inactive
        est.is_active = False
        est.save()
        # remove future availabilities and schedules for this intern
        now = timezone.now()
        Availability.objects.filter(intern=est, start_date__gt=now).delete()
        Schedule.objects.filter(intern=est, start_time__gt=now).delete()
        return Response(status=204)


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
