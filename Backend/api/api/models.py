from django.db import models


class Turma(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


class Patient(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.last_name else self.first_name


class Estagiario(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.last_name else self.first_name


class Availability(models.Model):
    # availability represents an intern's available date range (no patient)
    intern = models.ForeignKey(Estagiario, related_name='availabilities', on_delete=models.CASCADE)
    # store availability with date+time so UI can pick day and start/end times
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    def __str__(self):
        return f"Availability intern={self.intern_id} {self.start_date} - {self.end_date}"
    

class PatientAvailability(models.Model):
    # availability represents an intern's available date range (no patient)
    patient = models.ForeignKey(Patient, related_name='availabilities', on_delete=models.CASCADE)
    # store availability with date+time so user can pick day and start/end times
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()

    def __str__(self):
        return f"PatientAvailability patient={self.patient_id} {self.start_date} - {self.end_date}"


class Schedule(models.Model):
    # schedule ties an intern to a patient at a specific datetime range (a booking)
    intern = models.ForeignKey(Estagiario, related_name='schedules', on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, related_name='schedules', on_delete=models.CASCADE)
    room_id = models.IntegerField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return f"Schedule intern={self.intern_id} patient={self.patient_id} {self.start_time} - {self.end_time}"
