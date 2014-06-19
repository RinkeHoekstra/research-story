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
                    $("#previews").append(make_preview(data));
                },
                // noData: function () {
                //     $('.loading').hide();
                // }
            }
        });
    }).trigger('input');
    
    story.droppable({
        accept: ".preview",
        drop: function(event, ui) {

            var row = new_story_row(ui.draggable);
            row.addClass('dropped');
            $(this).append(row);
            
            var d = $(ui.draggable);
            d.removeClass('ui-draggable');
            console.log(d);
            var href = $('#' + d.attr('id')).children().attr('href');

            $.get('retrieve',{'url': href}, function(data){
               console.log(data); 
            });
        },
        over: function(event, ui) {
            console.log("Over!");
        }
    }).sortable({
        items: "div.dropped",
        sort: function(){
            $(this).removeClass('ui-state-default');
        }
    });
    
});




function process_url(data){
    console.log(data.url);
    console.log(data.title);
}



/*
// CONVENIENCE FUNCTIONS
*/

function make_preview(data){
    var new_preview = $('<div>');
    new_preview.addClass('preview');
    // new_preview.addClass('row');
    
    new_preview.attr('id',url_to_id(data.url));
    new_preview.attr('url',data.url);
    
    var img = $('<img>');
    img.attr('src',data.image);


    
    var text_col = $('<div>');
    text_col.append(img);
    text_col.append($('<h4>'+data.title+'</h4>'));
    text_col.append($('<p><a href="'+data.url+'">'+data.url+'</a></p>'));
    
    if(data.description){
        text_col.append($('<p>'+data.description+'</p>'));
    }
    
    text_col.append($('<br style="clear: both;"/>'));
    
    

    new_preview.append(text_col);
    new_preview.draggable({
        revert: "invalid",
        containment: "document",
        helper: "clone",
        cursor: "move"
    });
    return new_preview
}

function new_story_row(content){
    var row = $('<div>');
    row.addClass('row');
    row.css('padding','1ex');
    
    var col1 = $('<div>');
    col1.addClass('col-md-1');
    var col2 = $('<div>');
    col2.addClass('col-md-11');
    
    var move = $('<span class="glyphicon glyphicon-move"></span>');
    var remove = $('<span class="glyphicon glyphicon-remove"></span>');
    remove.on('click',function(e){
        $(this).parent().parent().remove();
    })
    
    col1.append(move);
    col1.append(remove);
    
    col2.append(content);
    row.append(col1);
    row.append(col2);
    return(row);
}

function url_to_id(url){
    var id = url.replace(/[:/\.&\?=]/g,"_");
    
    return id;
}


function new_row(content){
    var row = $('<div>');
    row.addClass('row');
    var col = $('<div>');
    col.addClass('col-md-12');
    col.append(content);
    row.append(col);
    return(row);
}