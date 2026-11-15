"""Production WSGI entry point, compatible with Windows and Linux."""
import os
from waitress import serve
from config.wsgi import application
if __name__ == '__main__':
    serve(application, host='0.0.0.0', port=int(os.environ.get('PORT', '8000')))
