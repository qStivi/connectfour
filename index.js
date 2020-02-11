const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
var roomName;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    socket.leaveAll();
    console.log('a user connected');

    socket.on('create room', function (room) {
        console.log('creating room... ' + room);
        socket.join(room);
        console.log('room ' + room + ' created');
        roomName = room;
    });


    socket.on('disconnect', function () {
        roomName = 'üpoiuztrewqasdfghjklö.,mnbvcxysertzuiolkjgvd"§$%&/()OPOLJHGFTE$%$%/(ZU'; // leave room
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log(socket.rooms[0] + ': message: ' + msg);
            io.to(roomName).emit('chat message', msg);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low)
}