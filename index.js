// set up basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);// server uses the socket.io library
const port = process.env.PORT || 3000;// server port is 3000
const Game = require('connect-four');// import connect four library

server.listen(port, () => {
    console.log('Server listening at port %d', port);// logs server listening at port 3000
});

// routing
app.use(express.static(path.join(__dirname, 'public')));

let numUsers = 0;// variable for the number of users

let game = new Game({// game consists of 7x6 cells
    rows: 6,
    cols: 7
});

// variables for the game
let color;
let player;
let prevPlayer;
let player1;
let player2;

// once someone connects
io.on('connection', (socket) => {

    const srvSockets = io.sockets.sockets;// client gets added to the socket
    let addedUser = false;// boolean for add_user function

    //client emit events

    // client emits new message
    socket.on('new message', (data) => {

        // username and message get broadcasted
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // client emits add user
    socket.on('add user', (username) => {

        // if user is added, do nothing
        if (addedUser) return;

        // store username in socket
        socket.username = username;
        ++numUsers;// number of users increases by one
        addedUser = true;// user was added

        socket.join('game');
        if (numUsers > 2) {
            socket.emit("spectator");
        } else if (numUsers === 1) {
            player1 = username;
        } else if (numUsers === 2) {
            player2 = username;
            console.log(player1);
            console.log(player2);
        }

        if (numUsers < 1) {
            game = new Game({// game consists of 7x6 cells
                rows: 6,
                cols: 7
            });
        }

        socket.emit('login', {// client emits login
            numUsers: numUsers
        });

        // suppress warning:
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('user joined', {// all connected clients get broadcasted
            username: socket.username,
            numUsers: numUsers
        });
    });

    // client emits typing
    socket.on('typing', () => {
        // suppress warning:
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('typing', {// typing is broadcasted
            username: socket.username
        });
    });


    // client emits stop typing
    socket.on('stop typing', () => {
        // suppress warning:
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('stop typing', {// stop typing is broadcasted
            username: socket.username
        });
    });


    // client disconnects
    socket.on('disconnect', () => {

        //if he was a registered user
        if (addedUser) {

            --numUsers;//reduce number of current users

            // suppress warning:
            // noinspection JSUnresolvedVariable
            socket.broadcast.emit('user left', {// broadcast that the user has disconnected
                username: socket.username,
                numUsers: numUsers
            });
        }
    });

    socket.on('end game', (name) => {

        // noinspection JSUnresolvedVariable
        if (name === player1 && !game.ended) {
            // noinspection JSUnresolvedFunction
            game.end(player2);
        } else { // noinspection JSUnresolvedVariable
            if (name === player2 && !game.ended) {
                // noinspection JSUnresolvedFunction
                game.end(player1);
            }
        }
    });

    // client emits a game action
    socket.on('gameClick', (id, username, mColor) => {

        // if more than two clients have connected
        if (numUsers > 1) {

            color = mColor;// get colour of user

            player = username;// get username


            // if the column is valid and it is the players turn
            // noinspection JSUnresolvedFunction
            if (game.validMove(id) && player !== prevPlayer) {

                prevPlayer = player;// change to next player
                // noinspection JSUnresolvedFunction
                game.play(username, id);// move gets played
            }
        }
    });

    // function to implement the move
    // noinspection JSUnresolvedFunction
    game.on('play', function (player, coord) {

        const coords = coord['col'] + ':' + coord['row'];// convert column and row to coordinates
        socket.emit('played', coords, color);// client emits played

        // if the user wins diagonally
        if (checkDiagonalWin()) {

            // noinspection JSUnresolvedFunction
            game.end(player);// end the game with the current player as the winner
        }
    });

    // function that checks for a winner (only works for horizontal and vertical wins)
    // noinspection JSUnresolvedFunction
    game.on('end', function (winner) {

        socket.disconnect();

        socket.emit('end', winner);// client emits the end

        game = new Game({// game gets reset
            rows: 6,
            cols: 7
        });
    });
});

// additional function to check all 24 possible diagonal wins
function checkDiagonalWin() {
    // noinspection JSUnresolvedFunction
    return (game.get(0, 0) != null && game.get(0, 0) === game.get(1, 1) && game.get(0, 0) === game.get(2, 2) && game.get(0, 0) === game.get(3, 3)) ||
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
        (game.get(3, 2) != null && game.get(3, 2) === game.get(2, 3) && game.get(3, 2) === game.get(1, 4) && game.get(3, 2) === game.get(0, 5));
}