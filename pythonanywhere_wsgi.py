#!/usr/bin/python3

import sys
import os

path = '/home/Pixel01/mysite'
if path not in sys.path:
    sys.path.insert(0, path)

from pythonanywhere_app import app as application

if __name__ == "__main__":
    application.run() 