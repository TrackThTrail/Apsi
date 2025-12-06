from rest_framework_simplejwt.views import TokenObtainPairView
from .token_serializers import EmailTokenObtainPairSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    """Token view that uses EmailTokenObtainPairSerializer."""
    serializer_class = EmailTokenObtainPairSerializer
