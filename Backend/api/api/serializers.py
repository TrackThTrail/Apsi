from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Turma, Patient, Estagiario, Availability, Schedule, PatientAvailability


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = get_user_model()
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {'username': {'required': False}}

    def create(self, validated_data):
        User = get_user_model()
        username = validated_data.get('username') or validated_data.get('email')
        user = User(
            username=username,
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class TurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turma
        fields = ('id', 'name', 'description', 'start_date', 'end_date')


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ('id', 'first_name', 'last_name', 'email', 'phone')


class EstagiarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estagiario
        fields = ('id', 'first_name', 'last_name', 'email')


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ('id', 'intern', 'start_date', 'end_date')


class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ('id', 'intern', 'patient', 'room_id', 'start_time', 'end_time')


class PatientAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAvailability
        fields = ('id', 'patient', 'start_date', 'end_date')
        # DRF will map DateTimeField automatically; keep ISO format in/out
