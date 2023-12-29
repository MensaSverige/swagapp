"""
WSGI entrypoint for backend project.

This is how the app is started in production.
"""
import sys
from server import app, initialize_app

initialize_app()

if __name__ == '__main__' and 'sphinx' not in sys.modules:
    app.run()
