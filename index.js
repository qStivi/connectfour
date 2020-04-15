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

io.on('connection', (socket) => {
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


    const game = new Game({
        rows: 5,
        cols: 10
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });


        // noinspection JSUnresolvedFunction
        game.play('red', 0);
        // noinspection JSUnresolvedFunction
        game.play('green', 1);
        // noinspection JSUnresolvedFunction
        game.play('red', 0);
        // noinspection JSUnresolvedFunction
        game.play('green', 2);
        // noinspection JSUnresolvedFunction
        game.play('red', 0);
        // noinspection JSUnresolvedFunction
        game.play('green', 3);
        // noinspection JSUnresolvedFunction
        game.play('red', 0);
// game ends, 'red' wins (vertically)

        // noinspection JSUnresolvedVariable
        console.log(game.winner); // 'red'
        // noinspection JSUnresolvedVariable
        console.log(game.ended); // true
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

    socket.on('gameClick', (id, username) => {
        console.log(id);
        console.log(username);
    });
});