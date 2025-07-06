#!/usr/bin/python3

"""
WSGI config for PythonAnywhere deployment
"""

import sys
import os

# Add your project directory to the Python path
path = '/home/Pixel01/mysite'  # PythonAnywhere path
if path not in sys.path:
    sys.path.insert(0, path)

# Import your Flask application
from pythonanywhere_app import app as application

# For local testing
if __name__ == "__main__":
    application.run() 