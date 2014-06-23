$(document).ready(function(){
    var url = $("#url");
    var story = $("#story");
    
    
    url.val("http://iricelino.org/rdfa/sample-annotated-page.html");
    url.val("http://www.nrc.nl");
    
    url.on('input propertychange', function () {
         url.urlive({
             render: false,
             callbacks: {
                // onStart: function () {
                //     $(".urlive-container").urlive('remove');
                // },
                onSuccess: function (data) {
                    console.log(data);
                    $("#previews").empty();
                    $("#previews").append(make_preview(data));
                    refresh_sorting();
                },
                // noData: function () {
                //     $('.loading').hide();
                // }
            }
        });
    }).trigger('input');
    
    
    refresh_sorting();
    
    
    $('#add_row_button').on('click',function(e){
       add_row(); 
    });
    
});

function refresh_sorting(){
	$('.sortable').sortable();
	$('.handles').sortable({
		handle: '.handle'
	});
	$('.connected').sortable({
		connectWith: '.connected'
	});
	$('.exclude').sortable({
		items: ':not(.disabled)'
	});
    
    $('.close').on('click',function(e){
       $(this).parent().parent().remove(); 
    });
}


function process_url(data){
    console.log(data.url);
    console.log(data.title);
}

function add_row(){
    $('#story').append(make_preview({title:'New Row',description:'New Row'}));
    refresh_sorting();
}


/*
// CONVENIENCE FUNCTIONS
*/

function make_preview(data){
    var new_preview = $('<li>');
    new_preview.addClass('preview');
    new_preview.addClass('panel panel-default')
    // new_preview.addClass('row');
    
    if(data.url && !data.id){
        new_preview.attr('id',url_to_id(data.url));
    } else if(data.id){
        new_preview.attr('id',data.id);
    } else {
        new_preview.attr('id',uuid.v4());
    }
    new_preview.attr('url',data.url);
    new_preview.attr('draggable','true');
    
    var heading =  $('<div class="panel-heading"><span class="handle">::</span> '+data.title+'<button type="button" class="close" aria-hidden="true">×</button></div>');
    
    var body = $('<div>');
    body.addClass("panel-body");
    
    if(data.image){
        var img = $('<img>');
        img.attr('src',data.image);

        var img_div = $('<div>')
        img_div.addClass('clip');
        img_div.append(img);  
        
        body.append(img_div);      
    }

    if(data.url){
        body.append('<div class="href"><a href="'+data.url+'">'+data.url+'</a></div>');
        $.get('/retrieve',{url:data.url},function(data){
           var rdf_button = $('<div class="btn btn-success btn-xs">RDF</div>');
           var rdf_area = $('<textarea>');
           rdf_area.text(data);
           rdf_area.css('display', 'block');
           rdf_area.css('width', '100%')
           rdf_area.hide();
           
           rdf_button.on('click',{target: rdf_area}, function(e){
               e.data.target.toggle();
           })
           
           body.append(rdf_button);
           body.append(rdf_area);
        });
        
    }
    
    if(data.description){
        body.append($('<p>'+data.description+'</p>'));
    }    
    
    
   
    new_preview.append(heading);
    new_preview.append(body);
    

    return new_preview
}

function url_to_id(url){
    var id = url.replace(/[:/\.&\?=]/g,"_");
    
    return id;
}