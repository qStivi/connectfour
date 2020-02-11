const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('create room', function (room) {
        console.log('creating room... ' + room);
        socket.join(room);
        console.log('room ' + room + ' created');
    });


    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log(socket.rooms[0] + ': message: ' + msg);
        io.to('lol').emit('chat message', msg);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low)
}