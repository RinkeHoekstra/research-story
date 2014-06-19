from flask import render_template, request, make_response, jsonify
from rdflib import Graph

from app import app, socketio
import sockets

@app.route('/')
def index():
    return render_template('base.html')
    
@app.route('/retrieve',methods=['GET'])
def retrieve():
    url = request.args.get('url',None)
    
    if url:
        g = Graph()
        g.load(url,format='rdfa')
        turtle = g.serialize(format='turtle')
        
        print turtle
        
        return turtle
    else :
        print "ERROR"
        return "ERROR"
    