// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const Game = require('connect-four');

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chat room

let numUsers = 0;

var game = new Game({
    rows: 6,
    cols: 7
});

var color;
var player;
var prevPlayer;

io.on('connection', (socket) => {
    var srvSockets = io.sockets.sockets;
    let addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        // we tell the client to execute 'new message'
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });



    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });


    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            // noinspection JSUnresolvedVariable
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });


    socket.on('gameClick', (id, username, mColor) => {
        if (Object.keys(srvSockets).length > 1) {

            color = mColor;

            player = username;

            if (game.validMove(id) && player !== prevPlayer) {
                prevPlayer = player;
                game.play(username, id);
            }
        }
    });
    game.on('play', function (player, coord) {
        var coords = coord['col'] + ':' + coord['row'];
        socket.broadcast.emit('played', coords, color);
        socket.emit('played', coords, color);
        if (checkDiagonalWin()) {
            game.end(player);
        }
    });
    game.on('end', function (winner, gameState) {
        socket.broadcast.emit('end', winner);
        socket.emit('end', winner);
        game = new Game({
            rows: 6,
            cols: 7
        });
    });
});

function checkDiagonalWin() {
    if (
        (game.get(0, 0) != null && game.get(0, 0) === game.get(1, 1) && game.get(0, 0) === game.get(2, 2) && game.get(0, 0) === game.get(3, 3)) ||
        (game.get(1, 0) != null && game.get(1, 0) === game.get(2, 1) && game.get(1, 0) === game.get(3, 2) && game.get(1, 0) === game.get(4, 3)) ||
        (game.get(2, 0) != null && game.get(2, 0) === game.get(3, 1) && game.get(2, 0) === game.get(4, 2) && game.get(2, 0) === game.get(5, 3)) ||
        (game.get(3, 0) != null && game.get(3, 0) === game.get(4, 1) && game.get(3, 0) === game.get(5, 2) && game.get(3, 0) === game.get(6, 3)) ||

        (game.get(0, 1) != null && game.get(0, 1) === game.get(1, 2) && game.get(0, 1) === game.get(2, 3) && game.get(0, 1) === game.get(3, 4)) ||
        (game.get(1, 1) != null && game.get(1, 1) === game.get(2, 2) && game.get(1, 1) === game.get(3, 3) && game.get(1, 1) === game.get(4, 4)) ||
        (game.get(2, 1) != null && game.get(2, 1) === game.get(3, 2) && game.get(2, 1) === game.get(4, 3) && game.get(2, 1) === game.get(5, 4)) ||
        (game.get(3, 1) != null && game.get(3, 1) === game.get(4, 2) && game.get(3, 1) === game.get(5, 3) && game.get(3, 1) === game.get(6, 4)) ||

        (game.get(0, 2) != null && game.get(0, 2) === game.get(1, 3) && game.get(0, 2) === game.get(2, 4) && game.get(0, 2) === game.get(3, 5)) ||
        (game.get(1, 2) != null && game.get(1, 2) === game.get(2, 3) && game.get(1, 2) === game.get(3, 4) && game.get(1, 2) === game.get(4, 5)) ||
        (game.get(2, 2) != null && game.get(2, 2) === game.get(3, 3) && game.get(2, 2) === game.get(4, 4) && game.get(2, 2) === game.get(5, 5)) ||
        (game.get(3, 2) != null && game.get(3, 2) === game.get(4, 3) && game.get(3, 2) === game.get(5, 4) && game.get(3, 2) === game.get(6, 5)) ||

        (game.get(6, 0) != null && game.get(6, 0) === game.get(5, 1) && game.get(6, 0) === game.get(4, 2) && game.get(6, 0) === game.get(3, 3)) ||
        (game.get(5, 0) != null && game.get(5, 0) === game.get(4, 1) && game.get(5, 0) === game.get(3, 2) && game.get(5, 0) === game.get(2, 3)) ||
        (game.get(4, 0) != null && game.get(4, 0) === game.get(3, 1) && game.get(4, 0) === game.get(2, 2) && game.get(4, 0) === game.get(1, 3)) ||
        (game.get(3, 0) != null && game.get(3, 0) === game.get(2, 1) && game.get(3, 0) === game.get(1, 2) && game.get(3, 0) === game.get(0, 3)) ||

        (game.get(6, 1) != null && game.get(6, 1) === game.get(5, 2) && game.get(6, 1) === game.get(4, 3) && game.get(6, 1) === game.get(3, 4)) ||
        (game.get(5, 1) != null && game.get(5, 1) === game.get(4, 2) && game.get(5, 1) === game.get(3, 3) && game.get(5, 1) === game.get(2, 4)) ||
        (game.get(4, 1) != null && game.get(4, 1) === game.get(3, 2) && game.get(4, 1) === game.get(2, 3) && game.get(4, 1) === game.get(1, 4)) ||
        (game.get(3, 1) != null && game.get(3, 1) === game.get(2, 2) && game.get(3, 1) === game.get(1, 3) && game.get(3, 1) === game.get(0, 4)) ||

        (game.get(6, 2) != null && game.get(6, 2) === game.get(5, 3) && game.get(6, 2) === game.get(4, 4) && game.get(6, 2) === game.get(3, 5)) ||
        (game.get(5, 2) != null && game.get(5, 2) === game.get(4, 3) && game.get(5, 2) === game.get(3, 4) && game.get(5, 2) === game.get(2, 5)) ||
        (game.get(4, 2) != null && game.get(4, 2) === game.get(3, 3) && game.get(4, 2) === game.get(2, 4) && game.get(4, 2) === game.get(1, 5)) ||
        (game.get(3, 2) != null && game.get(3, 2) === game.get(2, 3) && game.get(3, 2) === game.get(1, 4) && game.get(3, 2) === game.get(0, 5))
    ) {
        return true;
    } else {
        return false;
    }
}