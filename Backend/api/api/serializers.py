from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Turma


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
