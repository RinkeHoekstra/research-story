from flask import render_template, request, make_response, jsonify
from rdflib import Graph, Namespace
import requests
import re

from app import app, socketio
import sockets

PROV = Namespace('http://www.w3.org/ns/prov#')
OG = Namespace('http://ogp.me/ns#')
BIBO = Namespace('http://purl.org/ontology/bibo/')

@app.route('/')
def index():
    return render_template('base.html')
    
    
    
    
@app.route('/retrieve',methods=['GET'])
def retrieve():
    url = request.args.get('url',None)
    title = request.args.get('title',None)
    description = request.args.get('description',None)
    image = request.args.get('image',None)
    license = None
    date = None
    creator = None
    parent = None
    publisher = None
    
    headers = {'Accept':'application/rdf+xml;q=0.5, application/xhtml+xml;q=0.3, text/xml;q=0.2,application/xml;q=0.2, text/html;q=0.3, text/plain;q=0.1, text/n3;q=0.5, text/rdf+n3;q=0.5, application/x-turtle;q=0.8, text/turtle;q=1'}
    
    
    
    

    query = """
        PREFIX prov: <http://www.w3.org/ns/prov#>
        PREFIX og: <http://ogp.me/ns#>
        PREFIX dct: <http://purl.org/dc/terms/>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX cc: <http://creativecommons.org/ns#>
        PREFIX bibo: <http://purl.org/ontology/bibo/>
        PREFIX prism: <http://prismstandard.org/namespaces/basic/2.1/>
        PREFIX schema: <http://schema.org/>
        PREFIX md: <http://www.w3.org/ns/md#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?title ?description ?image ?license ?date ?creator ?publisher ?parent WHERE {{
            OPTIONAL {{
                <{URL}>    og:title|dct:title|skos:prefLabel|skos:altLabel|rdfs:label|md:item/rdf:first/schema:headline  ?title .
            }} 
            OPTIONAL {{
                <{URL}>    og:description|dct:description|md:item/rdf:first/schema:description ?description .
            }} 
            OPTIONAL {{
                <{URL}>    og:image|foaf:depiction|md:item/rdf:first/schema:image ?image .
            }}
            OPTIONAL {{
                <{URL}>    cc:license ?license .
            }}
            OPTIONAL {{
                <{URL}>    dct:date ?date .
            }}
            OPTIONAL {{
                <{URL}>    dct:creator/foaf:name|md:item/rdf:first/schema:author/schema:name ?creator .
            }}
            OPTIONAL {{
                <{URL}>    dct:publisher ?publisher .
            }}
            OPTIONAL {{
                <{URL}>    dct:isPartOf/dct:title ?parent .
            }}
            
        }}
    
    """.format(URL = url)
    
    print query 
    
    if url:
        r = requests.get(url, headers=headers)
        
        ## Determine the final URL, if we went through a couple of redirects
        final_url = r.url
        host = re.match(r'(http://.*?)/.*',final_url).group(1)
        
        if image and not image.startswith('http'):
            image = host + image
            
            image_r = requests.get(image)
            if image_r.status_code >= 400:
                image = None
        
        ## Determine the Content Type of the response
        content_type = r.headers['content-type']
        if ';' in content_type:
            (content_type,_) = content_type.split(';',1)
        
        
        ## Run rdflib parser on URL
        
        graph = Graph()

        graph.parse(data=r.content,publicID=url, format=content_type)
        
        graph.bind('prov',PROV)
        
        for s,p,o in graph.triples( (None, PROV['wasGeneratedBy'], None) ):
            r = requests.get(url, headers=headers)
    
            content_type = r.headers['content-type']
            graph.parse(data=r.content,format=content_type)
            
        metadata = {}
        
        result = graph.query(query)
        
        turtle = graph.serialize(format='turtle')
        
        
        for (rdf_title, rdf_description, rdf_image, rdf_license, rdf_date, rdf_creator, rdf_publisher, rdf_parent ) in result:
            if rdf_title:
                title = unicode(rdf_title)
            if rdf_description:
                description = unicode(rdf_description)
            if rdf_image :
                print rdf_image
                image = unicode(rdf_image)
            if rdf_license :
                license = unicode(rdf_license)
            if rdf_date :
                date = unicode(rdf_date)
            if rdf_creator :
                creator = unicode(rdf_creator)
            if rdf_publisher :
                publisher = unicode(rdf_publisher)
            if rdf_parent :
                parent = unicode(rdf_parent)
        
        response = {
            'rdf': turtle,
            'url': url,
            'host': host,
            'final_url': final_url,
            'title': title,
            'description': description,
            'image': image,
            'license': license,
            'date': date,
            'creator': creator,
            'publisher': publisher,
            'parent': parent
        }
        
        
        
        return jsonify(response)
    else :
        print "ERROR"
        return "ERROR"
    