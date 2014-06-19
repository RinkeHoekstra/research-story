var socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('connect', function() {
    console.log('Connected')
    socket.emit('message', {data: 'I\'m connected!'});
});
