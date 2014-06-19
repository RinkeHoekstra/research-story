from flask import Flask
from flask_bootstrap import Bootstrap
from flask.ext.socketio import SocketIO, emit

import os

TEMPLATE_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
STATIC_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

app = Flask(__name__, template_folder = TEMPLATE_FOLDER, static_folder = STATIC_FOLDER)
app.config['SECRET_KEY'] = 'veryverysecretsecret!'


socketio = SocketIO(app)
Bootstrap(app)

app.debug = True

import views

