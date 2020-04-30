$(function () {

    const FADE_TIME = 150; // 150 ms to fade the massage
    const TYPING_TIMER_LENGTH = 400; // "typing" message only gets shown for 400 ms after user stops typing
    const COLORS = [// each user gets a different colour
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // website contents
    const $window = $(window);// window
    const $usernameInput = $('.usernameInput'); // username
    const $messages = $('.messages'); // message area
    const $inputMessage = $('.inputMessage'); // input for messages
    const $loginPage = $('.login.page'); // login page
    const $chatPage = $('.chat.page'); // ConnectFour page with chat box


    // variables
    let username;
    let connected = false;
    let typing = false;
    let lastTypingTime;
    // suppressed Warning:
    // noinspection JSDeprecatedSymbols
    let $currentInput = $usernameInput.focus();

    // initialize socket
    const socket = io();

    // no spectators yet
    let spectator = false;

    let player1;
    let player2;


    // message for the number of current participants
    const addParticipantsMessage = (data) => {

        let message = '';// variable for the message

        if (data.numUsers === 1) {// singular message for one participant

            message += "there's 1 participant";
        } 
        else {// plural if several participants
            
            message += "there are " + data.numUsers + " participants";
        }

        log(message);// send message to chat
    };

    // set username
    const setUsername = () => {

        username = cleanInput($usernameInput.val().trim());// remove whitespaces, markup etc. from input

        if (username === player1 || username === player2) {
            username = randomStr(8, ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]);
        }

        // if username valid
        if (username) {

            // fade out login page
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            // suppressed Warning:
            // noinspection JSDeprecatedSymbols
            $currentInput = $inputMessage.focus();

            // server gets username
            socket.emit('add user', username);

            document.getElementsByClassName("table").item(0).setAttribute("style", "z-index:10");
        }
    };

    // function for sending messages
    const sendMessage = () => {

        // get input
        let message = $inputMessage.val();

        // remove markup from message
        message = cleanInput(message);

        // if message is not empty and server is connected
        if (message && connected) {

            $inputMessage.val('');// input field gets emptied
            addChatMessage({// add message to the chat
                username: username,
                message: message
            });

            // server executes "new message" and passes along the message
            socket.emit('new message', message);
        }
    };

    // log message inside the chat
    const log = (message, options) => {

        const $el = $('<li>').addClass('log').text(message);// message is added as html element
        addMessageElement($el, options);
    };

    // add message to chat as an element
    const addChatMessage = (data, options) => {

        // don't fade the message if someone was typing
        const $typingMessages = getTypingMessages(data);// get current typing messages
        options = options || {};

        // if there is a message
        if ($typingMessages.length !== 0) {

            options.fade = false;// don't fade
            $typingMessages.remove();// remove "typing" element
        }

        // username body
        const $usernameDiv = $('<span class="username"/>')// username with individual colour
            .text(data.username)
            .css('color', getUsernameColor(data.username));

        // div for the message
        const $messageBodyDiv = $('<span class="messageBody">')// message without colour
            .text(data.message);

        // body for "Typing" message
        const typingClass = data.typing ? 'typing' : '';// simple "tyoing" text

        // body for the message
        const $messageDiv = $('<li class="message"/>')
            //contents of message
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);// add final product
    };

    // function for adding the "typing" message visually
    const addChatTyping = (data) => {

        data.typing = true;// user is typing
        // update message accordingly
        data.message = 'is typing';
        addChatMessage(data);
    };

    // function for removing the "typing" message
    const removeChatTyping = (data) => {

        getTypingMessages(data).fadeOut(function () {

            $(this).remove();
        });
    };

    // function for adding whole message
    const addMessageElement = (el, options) => {

        // message is parsed to this function as an element
        const $el = $(el);

        // regulate the options
        // default, nothing happens
        if (!options) {

            options = {};
        }

        // if fade was parsed, set fade to true
        if (typeof options.fade === 'undefined') {

            options.fade = true;
        }

        // if prepend was parsed, set it to true
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // apply options if they are true
        // fade in the message
        if (options.fade) {

            $el.hide().fadeIn(FADE_TIME);
        }

        // prepend the message
        if (options.prepend) {

            $messages.prepend($el);
        }

        // otherwise simply append the message
        else {

            $messages.append($el);
        }

        // update chat size
        $messages[0].scrollTop = $messages[0].scrollHeight;
    };

    // remove markup from input
    const cleanInput = (input) => {

        return $('<div/>').text(input).html();
    };

    // update typing event
    const updateTyping = () => {

        // when server connection
        if (connected) {

            // and not typing
            if (!typing) {

                typing = true;// allow update to true
                socket.emit('typing');// update server event
            }

            // get time of update
            lastTypingTime = (new Date()).getTime();

            // set timeout for the typing message
            setTimeout(() => {

                //get current time
                const typingTimer = (new Date()).getTime();
                const timeDiff = typingTimer - lastTypingTime;// calculate difference in time

                // if the difference is smaller than a certain threshold
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {

                    socket.emit('stop typing');// update server event
                    typing = false;// stop typing message
                }
            }, TYPING_TIMER_LENGTH);
        }
    };

    // function for getting the "typing" message
    const getTypingMessages = (data) => {

        // return message
        return $('.typing.message').filter(function () {
            return $(this).data('username') === data.username;
        });
    };

    // function for getting the colour from a user
    const getUsernameColor = (username) => {
/*
        // colours get computed through a hash code
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // calculate colour
        const index = Math.abs(hash % COLORS.length);
        return COLORS[index];// return colour
        */

        if (username === player1) {
            return "#2d4d67";
        } else if (username === player2) {
            return "#DE5F48";
        } else return "#f7f2d8";
    };

    // suppress warning:
    // noinspection JSDeprecatedSymbols
    $window.keydown(event => {// all Keyboard events

        // focus current input
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {

            // suppress warning:
            // noinspection JSDeprecatedSymbols
            $currentInput.focus();
        }

        // suppress warning:
        // noinspection JSDeprecatedSymbols
        if (event.which === 13) {// if "enter" is pressed

            // if client has username
            if (username) {

                sendMessage();//send message
                // stop "typing" message
                socket.emit('stop typing');
                typing = false;
            } else {
                // if client has no username, set one
                setUsername();
            }
        }
    });

    // if there is an input, update "typing" message
    $inputMessage.on('input', () => {

        updateTyping();
    });

    // focus input when clicking login page
    // suppress warning:
    // noinspection JSDeprecatedSymbols
    $loginPage.click(() => {

        // suppress warning:
        // noinspection JSDeprecatedSymbols
        $currentInput.focus();
    });

    // focus input when clicking message input
    // suppress warning:
    // noinspection JSDeprecatedSymbols
    $inputMessage.click(() => {

        // suppress warning:
        // noinspection JSDeprecatedSymbols
        $inputMessage.focus();
    });

    // server emit functions

    socket.on('connected', function () {
        socket.emit('joined');
    });

    // log a login message
    socket.on('login', (data) => {

        connected = true;
        const message = "Welcome to the Chat :) ";// welcome message
        log(message, {// log message
            prepend: true
        });
        addParticipantsMessage(data);// update participants after login
    });

    // update chat body
    socket.on('new message', (data) => {

        addChatMessage(data);
    });

    // log joined users
    socket.on('user joined', (data) => {

        log(data.username + ' joined');
        $messages[0].scrollTop = $messages[0].scrollHeight;
        addParticipantsMessage(data);// update participants
    });

    // log users that have left
    socket.on('user left', (data) => {

        log(data.username + ' left');
        $messages[0].scrollTop = $messages[0].scrollHeight;
        addParticipantsMessage(data);// update participants
        removeChatTyping(data);
        socket.emit('end game', data.username);
    });

    // show "typing" message
    socket.on('typing', (data) => {

        addChatTyping(data);
    });

    // remove "typing" message
    socket.on('stop typing', (data) => {

        removeChatTyping(data);
    });

    // log own disconnetcion
    socket.on('disconnect', () => {
        log('you have been disconnected');
        $messages[0].scrollTop = $messages[0].scrollHeight;
    });

    // log own reconnection
    socket.on('reconnect', () => {
        log('you have been reconnected');
        $messages[0].scrollTop = $messages[0].scrollHeight;

        // if client had a username, rejoin
        if (username) {
            socket.emit('add user', username);
        }
    });

    // log reconnection error
    socket.on('reconnect_error', () => {

        log('attempt to reconnect has failed');
        $messages[0].scrollTop = $messages[0].scrollHeight;
    });

    socket.on("spectator", () => {
        spectator = true;
    });

    // if div is clicked
    $('div').on('click', function () {
        if ($(this).hasClass('column') && !spectator) {// if div is a column
            socket.emit('gameClick', $(this).attr('id'), username)// click event for the game, sends coloumn, username and colour
        }
    });

    socket.on('update usernames', (name1, name2) => {
        player1 = name1;
        player2 = name2;
    });

    socket.on('role', (role) => {
        if (role === "spectator") {
            log("You are a spectator.");
            $messages[0].scrollTop = $messages[0].scrollHeight;
        } else if (role === "player1") {
            log("You are the first player");
            $messages[0].scrollTop = $messages[0].scrollHeight;
        } else if (role === "player2") {
            log("You are the second player");
            $messages[0].scrollTop = $messages[0].scrollHeight;
        }
    });

    // when someone has played
    socket.on('played', function (coord, color, name) {


        if (name !== undefined) {
            log("It's " + name + "'s turn");
            $messages[0].scrollTop = $messages[0].scrollHeight;
        }

        const cells = document.getElementsByClassName('cell');//get cells
        const length = cells.length;// get number of cells
        for (let i = 0; i < length; i++) { // for every cell

            // if cell is the clicked one
            if (cells.item(i).getAttribute('coords') === coord) {

                cells.item(i).setAttribute("style", "background-color: " + color + ";");// update to the players colour
            }
        }
    });

    // winner page
    socket.on('end', function (winner) {

        document.getElementById("result").innerHTML = "The winner is: " + winner;// show name of winner
        document.getElementsByClassName("result").item(0).setAttribute("style", "display:block");// show winner page
    });
});

function randomStr(len, arr) {
    var ans = '';
    for (var i = len; i > 0; i--) {
        ans +=
            arr[Math.floor(Math.random() * arr.length)];
    }
    return ans;
}
