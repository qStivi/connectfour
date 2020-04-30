// server-side stuff
// suppressed warnings are because of difficulties with our ide

// setup for a basic express server
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
let player;
let prevPlayer;
let player1;
let player2;
let rows = 6;
let cols = 7;

// once someone connects
io.on('connection', (socket) => {

    socket.emit('update usernames', player1, player2);// update the usernames (and their colours)

    let addedUser = false;// boolean for add_user function

    // client emit events, server reacts

    // client emits "new message"
    socket.on('new message', (data) => {

        socket.emit('update usernames', player1, player2);

        // suppressed warning:
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('new message', {// username and message get broadcasted
            username: socket.username,
            message: data
        });
    });

    // client emits "add user"
    socket.on('add user', (username) => {

        // if user is already added, do nothing
        if (addedUser) return;

        // store username in socket
        socket.username = username;
        ++numUsers;// number of users increases by one
        addedUser = true;// user was added

        // assign roles to the users
        socket.join('game');
        if (numUsers > 2) {// if there are already two players
            socket.emit("spectator");// new user is registered as a spectator
            socket.emit('role', "spectator");
        } else if (numUsers === 1) {// if new user is the first to connect, give him the role of first player
            player1 = username;
            socket.emit('role', "player1");
        } else if (numUsers === 2) {// if new user is the second to connect, give him the role of second player
            player2 = username;
            socket.emit('role', "player2");
        }

        // before anyone connects
        if (numUsers < 1) {
            game = new Game({// create game of 7x6 cells
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

        // moves made before a spectator joined would be invisible to him
        // this part esures, that he can see all the previous moves
        // for every column
        for (let i = 0; i < cols; i++) {
            
            //for every row
            for (let j = 0; j < rows; j++) {
                
                // suppressed warning:
                // noinspection JSUnresolvedFunction
                if (game.get(i, j) === player1) {// if cell belongs to player one
                    
                    let coords = i + ":" + j;
                    socket.emit('played', coords, "#2d4d67");// emit his colour to the client
                } 
                else {

                    // suppressed warning:
                    // noinspection JSUnresolvedFunction
                    if (game.get(i, j) === player2) {// if cell belongs to player two

                        let coords = i + ":" + j;
                        socket.emit('played', coords, "#DE5F48");// emit his colour to the client
                    }
                }
            }
        }

        socket.emit('update usernames', player1, player2);
    });

    // client emits "typing"
    socket.on('typing', () => {
        // suppress warning:
        // noinspection JSUnresolvedVariable
        socket.broadcast.emit('typing', {// typing is broadcasted
            username: socket.username
        });
    });


    // client emits "stop typing"
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

    // if someone leaves before the game has ended
    // client emits end of game
    socket.on('end game', (name) => {

        // suppressed warning:
        // noinspection JSUnresolvedVariable
        if (name === player1 && !game.ended) {// if player one has left
            
            // suppressed warning:
            // noinspection JSUnresolvedFunction
            game.end(player2);// player two wins
        } 
        else {
            
            // suppressed warning:
            // noinspection JSUnresolvedVariable
            if (name === player2 && !game.ended) {// if player two has left
                
                // suppressed warning
                // noinspection JSUnresolvedFunction
                game.end(player1);// player one wins
            }
        }
    });

    // client emits a game action
    socket.on('gameClick', (id, username) => {

        // if more than two clients have connected
        if (numUsers > 1) {

            player = username;// get username

            // suppressed warning:
            // noinspection JSUnresolvedFunction
            if (game.validMove(id) && player !== prevPlayer) {// if the column is valid and it is the players turn

                prevPlayer = player;// change to next player
                // suppressed warning:
                // noinspection JSUnresolvedFunction
                game.play(username, id);// move gets played
            }
        }
    });

    // this implements the move the client made
    // suppressed warning:
    // noinspection JSUnresolvedFunction
    game.on('play', function (player, coord) {

        const coords = coord['col'] + ':' + coord['row'];// convert column and row to coordinates
        if (player === player1) {
            socket.emit('played', coords, "#2d4d67", player2);// player one is blue
        } else if (player === player2) {
            socket.emit('played', coords, "#DE5F48", player1);// player two is red
        }

        // if the user wins diagonally
        if (checkDiagonalWin()) {

            // suppressed warning:
            // noinspection JSUnresolvedFunction
            game.end(player);// end the game with the current player as the winner
        }
    });

    // function that checks for a winner (only works for horizontal and vertical wins)
    // suppressed warning:
    // noinspection JSUnresolvedFunction
    game.on('end', function (winner) {

        // if a player won
        if (winner != null) {
            socket.emit('end', winner);// client emits the end with the winners name
        } else {
            socket.emit('end', "nobody")// if the game ended in a draw, emit that nobody has won
        }

        game = new Game({// game gets reset
            rows: 6,
            cols: 7
        });
        setTimeout(() => {
            socket.disconnect();
        }, 1000);// users get disconnected
    });
});

// additional function to check all 24 possible diagonal wins
function checkDiagonalWin() {
    // suppressed warning:
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
