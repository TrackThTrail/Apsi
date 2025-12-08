#!/usr/bin/env python
"""Create a Django superuser from environment variables if it doesn't exist.

Intended to be called from the Start Command on the host (Render) so we
don't need an interactive shell.
"""
import os
import sys

if __name__ == '__main__':
    # Ensure project path and settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
    try:
        import django
        django.setup()
    except Exception as e:
        print('Failed to setup Django:', e)
        sys.exit(1)

    from django.contrib.auth import get_user_model

    User = get_user_model()
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

    if not username or not password:
        print('DJANGO_SUPERUSER_USERNAME or DJANGO_SUPERUSER_PASSWORD not set; skipping superuser creation')
        sys.exit(0)

    try:
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email or '', password=password)
            print('Superuser created:', username)
        else:
            print('Superuser already exists:', username)
    except Exception as e:
        print('Error creating superuser:', e)
        sys.exit(1)
