from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Allow obtaining tokens by email or username.
    Accepts either 'email' or 'username' in the request body.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # allow 'email' to be submitted and don't require 'username' when email is provided
        # TokenObtainPairSerializer defines 'username' by default; make it not strictly required
        self.fields['email'] = serializers.CharField(write_only=True, required=False)
        if 'username' in self.fields:
            # make username optional so validation won't fail when client sends email only
            self.fields['username'].required = False

    def validate(self, attrs):
        # attrs may contain 'email' or 'username' and 'password'. If email provided, map it
        email = attrs.get('email')
        username = attrs.get('username')

        User = get_user_model()
        if email and ("@" in str(email)):
            try:
                user = User.objects.get(email=email)
                # ensure the underlying authentication uses the actual username
                attrs['username'] = user.get_username()
            except User.DoesNotExist:
                # leave attrs as-is; authentication will fail downstream with proper message
                pass

        return super().validate(attrs)
