#!/usr/bin/python3

"""
WSGI config for PythonAnywhere deployment
"""

import sys
import os

# Add the path to your project directory
# This should be updated to your actual PythonAnywhere username and project path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

# Import your Flask app
from app import app as application

if __name__ == "__main__":
    application.run()
