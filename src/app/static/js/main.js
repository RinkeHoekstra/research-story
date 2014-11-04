$(document).ready(function(){
    var url = $("#url");
    var story = $("#story");
    
    $("#loading").hide();
    
    url.val("http://iricelino.org/rdfa/sample-annotated-page.html");
    url.val("http://www.nrc.nl");
    url.val("http://dx.doi.org/10.1007/978-3-642-25093-4_9");
    url.val("http://dx.doi.org/10.1007/978-3-642-16438-5_23");
    
    
    $("#url-form").on('submit', function (e) {
        e.preventDefault();
        
        $("#previews").empty();
        $("#loading").show();
        var url = $('#url').val();
        console.log(url);
        data = {url: url, target: "#previews"};
        make_preview(data);
    });
    
    

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
    var target = $('#story');
    get_metadata({title:'New Row',description:'New Row'},target);
}


/*
// CONVENIENCE FUNCTIONS
*/

function make_preview(data){
    console.log("Now in make_preview");
    console.log(data.target);
    var target = $(data.target);
    // console.log(target);
    
    $.ajax({
        url: '/retrieve',
        data: data,
        success: $.proxy(get_metadata_wrapper,target),
        error: function(){
            console.log('Fail!');
            $('#loading').hide();
            var alert = $('<div class="alert alert-dismissable alert-danger"><button type="button" class="close" data-dismiss="alert">×</button><strong>Aw snap!</strong> Something went wrong. </div>')
            $('#previews').append(alert);
        }
    });
}


function get_metadata_wrapper(data){  
    var target = $(this);
    get_metadata(data, target);
}

function get_metadata(data, target) {
      
    console.log("Now in get_metadata");
    console.log(data);
    
    var new_preview = $('<li>',{'class':'preview'});
    var preview_panel = $('<div>',{'class':'panel panel-default','url':data.url});
    

    if(data.url && !data.id){
        new_preview.attr('id',url_to_id(data.url));
    } else if(data.id){
        new_preview.attr('id',data.id);
    } else {
        new_preview.attr('id',uuid.v4());
    }


    var heading = new_heading(data.title);
    
    var body = new_body(data.description, data.image);


    
    
    
    preview_panel.append(heading);
    preview_panel.append(body);
    new_preview.append(preview_panel);
    
    if(data.url) {
        var details = $('<div>',{'class':'panel panel-default','style':'clear:both;'});
        var details_heading = $('<div>',{'class':'panel-heading'});
        var details_body = $('<div>',{'class':'panel-body'});
        var details_toggle = $('<span>',{'class':'caret pull-right'});
    
        details_heading.text('Details');
        details_heading.append(details_toggle);
    
        details_toggle.on('click',{target: details_body},function(e){
            e.data.target.toggle();
        })
    
        details.append(details_heading);
        details.append(details_body);


        var table = $('<table>',{
            'class':'table table-striped',
            'style':'clear:both;'
        });

        table.append('<tr><th>URL:</th><td class="href"><a href="'+data.url+'" target="_new">'+data.url+'</a></td></tr>');




    
        if(data.license) {
            table.append($('<tr><th>License:</th><td><a href="'+data.license+'">'+data.license+'</a></td></tr>'));
        }
        if(data.date) {
            table.append($('<tr><th>Date:</th><td>'+data.date+'</td></tr>'));
        }
        if(data.creator && data.creator.length > 0) {
            console.log(data.creator)
            var tr = $('<tr>');
            var th = $('<th>Creator:</th>');
            var td = $('<td>');
        
        
            for (var c in data.creator) {
                var div = $('<div class="creator">' + data.creator[c] +'</div>');
                td.append(div);
                console.log(td);
            }
            tr.append(th);
            tr.append(td);
            table.append(tr);
        
        }
        if(data.publisher) {
            table.append($('<tr><th>Publisher:</th><td><a href="'+data.publisher+'">'+data.publisher+'</a></td></tr>'));
        }
        if(data.parent) {
            table.append($('<tr><th>Part of:</th><td><a href="'+data.parent+'">'+data.parent+'</a></td></tr>'));
        }
    
        details_body.append(table);
    



    
    

        var rdf_button = $('<div class="btn btn-success btn-xs">RDF</div>');
        var rdf_area = $('<textarea>');
        rdf_area.text(data.rdf);
        rdf_area.css('display', 'block');
        rdf_area.css('width', '100%');
        rdf_area.css('height', '250px');
        rdf_area.attr('id',uuid.v4());


        details_body.append(rdf_button);
        details_body.append(rdf_area);
    
    

        rdf_area.hide();

        var rdf_codemirror = CodeMirror.fromTextArea(rdf_area.get(0), {
           mode: "text/turtle",
           lineNumbers: true,
           readOnly: true,
           autofocus: true
        });

        var rdf_codemirror_wrapper = $(rdf_codemirror.getWrapperElement());

        rdf_codemirror_wrapper.css('clear','both');
        rdf_codemirror_wrapper.hide();



        rdf_button.on('click',{target: rdf_codemirror_wrapper}, function(e){
           e.data.target.toggle();
           setTimeout( rdf_codemirror.refresh, 1 )
        })


        // new_preview.append(details);
        preview_panel.append(details);
    }
    
    

    $("#loading").hide();
    target.append(new_preview);
    
    refresh_sorting();
}

function new_heading(text){
    var heading =  $('<div>',{'class':'panel-heading'});
    var handle = $('<div>',{'class':'handle'});
    handle.text('::');
    heading.append(handle);
    
    if (!text){
        text = '';
    }
    
    var textarea = $('<input>',{'class': 'heading_textarea form-control', 'type':'text','value': text,'width':'80%'});
    textarea.hide();
    
    var text_span = $('<div>', {'class': 'heading_text_span'});
    text_span.html(text);
    
    text_span.on('click',{'textarea':textarea},function(e){
        e.data.textarea.show();
        e.data.textarea.focus();
        $(this).hide();
    })
    
    textarea.on('blur',{'text_span':text_span}, function(e){
        $(this).hide();
        e.data.text_span.html(markdown.toHTML($(this).val()));
        e.data.text_span.show();
        
    });
    

    
    heading.append(textarea);
    heading.append(text_span);
    
    
    var close_button = $('<button type="button" class="close" aria-hidden="true">×</button>');
    heading.append(close_button);
    
    
    return heading;
}

function new_body(text, image){
    var body = $('<div>',{'class':'panel-body'});
    var row = $('<div>',{'class': 'row'});
    
    if (image && image.length>0) {
      var textcol = $('<div>',{'class':'col-md-9'});
      var imgcol = $('<div>',{'class':'col-md-3'});
      
      for (var i in image) {
          var img = $('<img>',{'src': image[i]});

          var img_div = $('<div>',{'class': 'clip pull-left'});
          img_div.append(img);
          imgcol.append(img_div);  
      }
      
      row.append(imgcol);
      
    } else {
      var textcol = $('<div>',{'class':'col-md-12'});
      // no imgcol!!!
    }

    if (!text){
        text = '';
    }
    
    var textarea = $('<textarea>',{'class': 'textarea form-control'});
    textarea.text(text);
    textarea.hide();
    
    var text_span = $('<div>', {'class': 'text_span'});
    text_span.html(text);
    
    text_span.on('click',{'textarea':textarea},function(e){
        e.data.textarea.show();
        e.data.textarea.focus();
        $(this).hide();
    })
    
    textarea.on('blur',{'text_span':text_span}, function(e){
        $(this).hide();
        e.data.text_span.html(markdown.toHTML($(this).val()));
        e.data.text_span.show();
        
    });
    
    textcol.append(textarea);
    textcol.append(text_span);
    row.append(textcol)
    
    body.append(row);

    
    return body;
}

function url_to_id(url){
    var id = url.replace(/[:/\.&\?=]/g,"_");
    
    return id;
}