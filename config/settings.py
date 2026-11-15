import os
import secrets
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
ON_VERCEL = os.environ.get('VERCEL') == '1'
DEBUG = os.environ.get('DEBUG', '0' if ON_VERCEL else '1') == '1'
# No login/session signing is used. A supplied stable SECRET_KEY is recommended
# if sessions/authentication are added; this fallback is generated, never public.
SECRET_KEY = os.environ.get('SECRET_KEY') or (secrets.token_urlsafe(48) if ON_VERCEL else 'local-development-only-fnf-rupture')
if not DEBUG and SECRET_KEY == 'local-development-only-fnf-rupture':
    raise RuntimeError('Configure SECRET_KEY em produção.')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,[::1]').split(',')
if DEBUG:
    import socket
    try:
        ALLOWED_HOSTS += socket.gethostbyname_ex(socket.gethostname())[2]
    except OSError:
        pass
if ON_VERCEL:
    ALLOWED_HOSTS += ['.vercel.app']
    ALLOWED_HOSTS += [os.environ[k] for k in ('VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL','VERCEL_BRANCH_URL') if os.environ.get(k)]
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO','https') if ON_VERCEL else None
ROOT_URLCONF = 'config.urls'
INSTALLED_APPS = ['django.contrib.staticfiles', 'game']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', 'whitenoise.middleware.WhiteNoiseMiddleware', 'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware', 'django.middleware.clickjacking.XFrameOptionsMiddleware']
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[BASE_DIR / 'templates'],'APP_DIRS':True}]
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
WSGI_APPLICATION = 'config.wsgi.application'
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = ON_VERCEL
SECURE_HSTS_SECONDS = 31536000 if ON_VERCEL else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = ON_VERCEL
SECURE_HSTS_PRELOAD = ON_VERCEL
X_FRAME_OPTIONS = 'DENY'
