from flask import render_template, request, make_response, jsonify
from rdflib import Graph, Namespace
import requests

from app import app, socketio
import sockets

PROV = Namespace('http://www.w3.org/ns/prov#')
OG = Namespace('http://ogp.me/ns#')

@app.route('/')
def index():
    return render_template('base.html')
    
    
    
    
@app.route('/retrieve',methods=['GET'])
def retrieve():
    url = request.args.get('url',None)
    title = request.args.get('title',None)
    description = request.args.get('description',None)
    image = request.args.get('image',None)
    
    headers = {'Accept':'application/rdf+xml, application/xhtml+xml;q=0.3, text/xml;q=0.2,application/xml;q=0.2, text/html;q=0.3, text/plain;q=0.1, text/n3, text/rdf+n3;q=0.5, application/x-turtle;q=0.2, text/turtle;q=1'}
    
    
    r = requests.get(url, headers=headers)
    
    content_type = r.headers['content-type']
    
    print content_type
    
    if ';' in content_type:
        (content_type,_) = content_type.split(';',1)
    

    query = """
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX og: <http://ogp.me/ns#>
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX cc: <http://creativecommons.org/ns#>
        
        SELECT ?title ?description ?image ?license WHERE {{
            OPTIONAL {{
                <{URL}>    og:title|dct:title|skos:prefLabel|skos:altLabel|rdfs:label  ?title .
            }} 
            OPTIONAL {{
                <{URL}>    og:description|dct:description ?description .
            }} 
            OPTIONAL {{
                <{URL}>    og:image|foaf:depiction ?image .
            }}
            OPTIONAL {{
                <{URL}>    cc:license ?license .
            }}
        }}
    
    """.format(URL = url)
    
    print query 
    
    if url:
        graph = Graph()

        graph.parse(data=r.content,publicID=url, format=content_type,media_type=r.headers['content-type'])
        
        graph.bind('prov',PROV)
        
        for s,p,o in graph.triples( (None, PROV['wasGeneratedBy'], None) ):
            r = requests.get(url, headers=headers)
    
            content_type = r.headers['content-type']
            graph.parse(data=r.content,format=content_type)
            
        metadata = {}
        
        result = graph.query(query)
        
        for (rdf_title, rdf_description, rdf_image, rdf_license) in result:
            if rdf_title:
                title = unicode(rdf_title)
            if rdf_description:
                description = unicode(rdf_description)
            if rdf_image :
                image = unicode(rdf_image)
            if rdf_license :
                license = unicode(rdf_license)
        
        turtle = graph.serialize(format='turtle')
        
        response = {
            'rdf': turtle,
            'title': title,
            'description': description,
            'image': image,
            'url': url,
            'license': license
        }
        
        
        return jsonify(response)
    else :
        print "ERROR"
        return "ERROR"
    