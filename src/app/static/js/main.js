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
        
        
        //  url.urlive({
        //      render: false,
        //      callbacks: {
        //         // onStart: function () {
        //         //     $(".urlive-container").urlive('remove');
        //         // },
        //         onSuccess: function (data) {
        //             console.log(data);
        //
        //             data.target = "#previews";
        //             make_preview(data);
        //
        //         },
        //         noData: function () {
        //             console.log("No data from URLive");
        //             data = {url: url, target: "#previews"};
        //             make_preview(data);
        //         },
        //         imgError: function() {
        //             $("#loading").toggle();
        //             console.log("Image error");
        //         },
        //         onFail: function() {
        //             $("#loading").toggle();
        //             console.log("Fail");
        //         }
        //     }
        // });
    });
    
    

    // .trigger('input');
    
    
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
    make_preview({title:'New Row',description:'New Row',target: '#story'});
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
        success: $.proxy(get_metadata,target)
    });
}


function get_metadata(data){    
    console.log("Now in get_metadata");
    console.log(data);
    var target = $(this);

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

    if(data.description){
        body.append($('<p>'+data.description+'</p>'));
    }    
    
    if(data.url){
        body.append('<div class="href"><a href="'+data.url+'" target="_new">'+data.url+'</a></div>');
    }
        
    if(data.license||data.url||data.date||data.creator||data.publisher||data.parent) {
        var table = $('<table>',{
            'class':'table table-striped',
            'style':'clear:both;'
        });
        
        if(data.license) {
            table.append($('<tr><th>License:</th><td><a href="'+data.license+'">'+data.license+'</a></td></tr>'));
        }
        if(data.date) {
            table.append($('<tr><th>Date:</th><td>'+data.date+'</td></tr>'));
        }
        if(data.creator.length > 0) {
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
        body.append(table);
    }



    
    

    var rdf_button = $('<div class="btn btn-success btn-xs">RDF</div>');
    var rdf_area = $('<textarea>');
    rdf_area.text(data.rdf);
    rdf_area.css('display', 'block');
    rdf_area.css('width', '100%');
    rdf_area.attr('id',uuid.v4());


    body.append(rdf_button);
    body.append(rdf_area);

    rdf_area.hide();

    var rdf_codemirror = CodeMirror.fromTextArea(rdf_area.get(0), {
       mode: "text/turtle",
       lineNumbers: true,
       readOnly: true,
       autofocus: false
    });

    var rdf_codemirror_wrapper = $(rdf_codemirror.getWrapperElement());

    rdf_codemirror_wrapper.css('clear','both');
    rdf_codemirror_wrapper.hide();


    rdf_button.on('click',{target: rdf_codemirror_wrapper}, function(e){
       e.data.target.toggle();
    })



    new_preview.append(heading);
    new_preview.append(body);


    target.append(new_preview);
    refresh_sorting();
}

function url_to_id(url){
    var id = url.replace(/[:/\.&\?=]/g,"_");
    
    return id;
}