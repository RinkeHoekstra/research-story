from flask import render_template, request, make_response, jsonify
from rdflib import Graph, Namespace, OWL, URIRef
from bs4 import BeautifulSoup
import requests
import re
import urllib

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

    
    rdf_headers = {'Accept':'application/rdf+xml;q=0.5, application/xhtml+xml;q=0.3, text/xml;q=0.2,application/xml;q=0.2, text/html;q=0.3, text/plain;q=0.1, text/n3;q=0.5, text/rdf+n3;q=0.5, application/x-turtle;q=0.8, text/turtle;q=1'}
    html_headers = {'Accept': 'application/xhtml+xml, text/xml, text/html'}
    
    
    

    
    if url:
        graph = Graph()
        
        graph.bind('owl',OWL)
        graph.bind('prov',PROV)
        
        final_rdf_url = None
        final_html_url = None
        rdf_host = None
        html_host = None
        
        # Perform an request to the url, expecting RDF content in response
        rdf_r = requests.get(url, headers=rdf_headers, timeout=1)
        print "RDF request performed"
        
        # If the status code is below 400, we've made a succesful request (no page not found or internal server errors)
        if rdf_r.status_code < 400 :
            ## Determine the final URL, in case we went through a couple of redirects
            final_rdf_url = rdf_r.url
            
            # Find the RDF host 
            try: 
                rdf_host = re.match(r'(http://.*?)/.*',final_rdf_url).group(1)
            except :
                print "No match for RDF host"
                rdf_host = final_rdf_url
            
            print "RDF Host", rdf_host
            
            ## Determine the Content Type of the response
            content_type = rdf_r.headers['content-type']
            if ';' in content_type:
                (content_type,_) = content_type.split(';',1)
        
            ## Run rdflib parser on URL, and add to our graph
            graph.parse(data=rdf_r.content,publicID=url, format=content_type)
        
        # Perform a request to the url, expecting HTML content in response
        html_r = requests.get(url, headers=html_headers, timeout=1)
        print "HTML request performed"
        # If the status code is belof 400, we've made a succesful request (no page not found or internal server errors)
        if html_r.status_code < 400 :
            ## Determine the final URL, if we went through a couple of redirects
            final_html_url = html_r.url
            
            # If we're dealing with Elsevier content, we need to follow the redirect URL included in the original response
            if 'linkinghub.elsevier.com' in final_html_url:
                print "Found ELSEVIER Linkinghub Redirect"
                soup = BeautifulSoup(html_r.content)
                redirect_input = soup.find(id="redirectURL")
                redirect_url = redirect_input['value']
                
                html_r = requests.get(redirect_url, headers=html_headers, timeout=1)
                
                final_html_url = html_r.url
                
                
            
            # Find the HTML host
            html_host = re.match(r'(http://.*?)/.*',final_html_url).group(1)
            
            print "HTML Host", html_host
            
            ## Determine the Content Type of the response
            content_type = html_r.headers['content-type']
            if ';' in content_type:
                (content_type,_) = content_type.split(';',1)
        
            ## Run rdflib parser on URL
            graph.parse(data=html_r.content,publicID=final_html_url, format=content_type)   
            
        
        # If the final HTML url is different from the original URL, we assert a sameAs link between the two.
        if final_html_url and url != final_html_url:
            print "Adding sameAs"
            
            graph.add((URIRef(url),OWL['sameAs'],URIRef(final_html_url)))
        

        # Perform naive sameAs inferencing on the graph (two steps-deep)
        graph = naive_owl_sameas(graph)
        
        # Follow PROV generatedBy relations in the graph, to incorporate provenance information.
        for s,p,o in graph.triples( (None, PROV['wasGeneratedBy'], None) ):
            r = requests.get(url, headers=rdf_headers)
    
            content_type = r.headers['content-type']
            graph.parse(data=r.content,format=content_type)

        response = prepare_json_response(url, rdf_host, final_rdf_url, html_host, final_html_url, graph)
        
        return jsonify(response)
    else :
        print "ERROR"
        return "ERROR"
        
        
def naive_owl_sameas(graph):
    
    for one,p,two in graph.triples((None,OWL['sameAs'],None)):
        
        ## Forward one step
        for s,p,o in graph.triples((one, None, None)):
            graph.add((two,p,o))
        for s,p,o in graph.triples((two, None, None)):
            graph.add((one,p,o))
            
        ## Backward one step
        for s,p,o in graph.triples((None, None, one)):
            graph.add((s,p,two))
        for s,p,o in graph.triples((None, None, two)):
            graph.add((s,p,one))
            
            
    return graph


def prepare_json_response(url, rdf_host, final_rdf_url, html_host, final_html_url, graph):
    """Query the graph for relevant metadata around the URL"""
    
    title = None
    description = None
    image = set()
    license = None
    date = None
    creator = set()
    parent = None
    publisher = None
    
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
    
    metadata = {}
    
    result = graph.query(query)
    
    turtle = graph.serialize(format='turtle')
    
    
    for (rdf_title, rdf_description, rdf_image, rdf_license, rdf_date, rdf_creator, rdf_publisher, rdf_parent ) in result:
        if rdf_title:
            title = unicode(rdf_title).strip()
        if rdf_description:
            description = unicode(rdf_description).strip()
        if rdf_image :
            image.add(unicode(urllib.unquote(rdf_image)))
        if rdf_license :
            license = unicode(urllib.unquote(rdf_license))
        if rdf_date :
            date = unicode(rdf_date)
        if rdf_creator :
            creator.add(unicode(urllib.unquote(rdf_creator)))
        if rdf_publisher :
            publisher = unicode(rdf_publisher)
        if rdf_parent :
            parent = unicode(rdf_parent)
    
    response = {
        'rdf': turtle,
        'url': url,
        'html_host': html_host,
        'rdf_host': rdf_host,
        'final_rdf_url': final_rdf_url,
        'final_html_url': final_html_url,
        'title': title,
        'description': description,
        'image': list(image),
        'license': license,
        'date': date,
        'creator': list(creator),
        'publisher': publisher,
        'parent': parent
    }
    
    return response











