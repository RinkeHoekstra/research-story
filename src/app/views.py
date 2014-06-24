from flask import render_template, request, make_response, jsonify
from rdflib import Graph, Namespace
import requests

from app import app, socketio
import sockets

PROV = Namespace('http://www.w3.org/ns/prov#')

@app.route('/')
def index():
    return render_template('base.html')
    
@app.route('/retrieve',methods=['GET'])
def retrieve():
    url = request.args.get('url',None)
    
    headers = {'Accept':'application/rdf+xml, application/xhtml+xml;q=0.3, text/xml;q=0.2,application/xml;q=0.2, text/html;q=0.3, text/plain;q=0.1, text/n3, text/rdf+n3;q=0.5, application/x-turtle;q=0.2, text/turtle;q=1'}
    
    
    r = requests.get(url, headers=headers)
    
    content_type = r.headers['content-type']
    
    print content_type
    
    if ';' in content_type:
        (content_type,_) = content_type.split(';',1)
    

    
    if url:
        graph = Graph()
        graph.parse(data=r.content,format=content_type)
        
        graph.bind('prov',PROV)
        
        for s,p,o in graph.triples( (None, PROV['wasGeneratedBy'], None) ):
            r = requests.get(url, headers=headers)
    
            content_type = r.headers['content-type']
            graph.parse(data=r.content,format=content_type)
        
        
        
        turtle = graph.serialize(format='turtle')
        
        print turtle
        
        return turtle
    else :
        print "ERROR"
        return "ERROR"
    