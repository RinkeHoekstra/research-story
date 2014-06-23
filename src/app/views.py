from flask import render_template, request, make_response, jsonify
from rdflib import Graph
import requests

from app import app, socketio
import sockets

@app.route('/')
def index():
    return render_template('base.html')
    
@app.route('/retrieve',methods=['GET'])
def retrieve():
    url = request.args.get('url',None)
    
    r = requests.get(url)
    
    content_type = r.headers['content-type']
    (content_type,_) = content_type.split(';',1)
    
    if url:
        graph = Graph()
        graph.load(url,format=content_type)
        turtle = graph.serialize(format='turtle')
        
        print turtle
        
        return turtle
    else :
        print "ERROR"
        return "ERROR"
    