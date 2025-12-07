from django.contrib import admin
from .models import Turma, Patient, Estagiario, Availability, PatientAvailability, Schedule


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'start_date', 'end_date')
    search_fields = ('name',)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'phone')
    search_fields = ('first_name', 'last_name', 'email')


@admin.register(Estagiario)
class EstagiarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email')
    search_fields = ('first_name', 'last_name', 'email')


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'intern', 'start_date', 'end_date')
    list_filter = ('intern',)


@admin.register(PatientAvailability)
class PatientAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'start_date', 'end_date')
    list_filter = ('patient',)


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'intern', 'patient', 'room_id', 'start_time', 'end_time')
    list_filter = ('intern', 'patient')
    search_fields = ('intern__first_name', 'intern__last_name', 'patient__first_name', 'patient__last_name')
