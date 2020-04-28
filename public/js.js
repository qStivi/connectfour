$(function () {

    const FADE_TIME = 150; // 150 ms to fade the massage
    const TYPING_TIMER_LENGTH = 400; // "typing" message only gets shown for 400 ms after users stops typing
    const COLORS = [// each user gets a different colour
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // variables
    const $window = $(window);// window
    const $usernameInput = $('.usernameInput'); // username
    const $messages = $('.messages'); // message area
    const $inputMessage = $('.inputMessage'); // input for messages

    const $loginPage = $('.login.page'); // login page
    const $chatPage = $('.chat.page'); // ConnectFour page with chat box

    const $color = getRandomColor();// sets a random colour

    // login prompt
    let username;
    let connected = false;
    let typing = false;
    let lastTypingTime;
    // suppressed Warning:
    // noinspection JSDeprecatedSymbols
    let $currentInput;/* = $usernameInput.focus();*/

    // initialize socket
    const socket = io();

    let spectator = false;


    // message for the number of current participants
    const addParticipantsMessage = (data) => {

        let message = '';// variable for the message

        if (data.numUsers === 1) {// singular message for one participant
            message += "there's 1 participant";
        } else {// plural if several participants
            message += "there are " + data.numUsers + " participants";
        }

        log(message);// send message to chat
    };

    // set username
    const setUsername = () => {

        username = cleanInput($usernameInput.val().trim());// remove whitespaces, markup etc. from input

        // if username valid
        if (username) {

            // fade out login page
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            //Suppressed Warning:
            // noinspection JSDeprecatedSymbols
            $currentInput = $inputMessage.focus();

            // Server gets username
            socket.emit('add user', username);
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

        // scroll to the bottom of the chat
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

        // colours get computed through a hash code
        let hash = 7;

        for (let i = 0; i < username.length; i++) {

            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }

        // calculate colour
        const index = Math.abs(hash % COLORS.length);
        return COLORS[index];// return colour
    };

    // suppress Warning:
    // noinspection JSDeprecatedSymbols
    $window.keydown(event => {// all Keyboard events

        // focus current input
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {

            // suppress Warning:
            // noinspection JSDeprecatedSymbols
            if ($currentInput != null)
                $currentInput.focus();
        }

        // suppress Warning:
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
        if ($currentInput != null)
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
        log("yay")
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
        addParticipantsMessage(data);// update participants
    });

    // log users that have left
    socket.on('user left', (data) => {

        log(data.username + ' left');
        addParticipantsMessage(data);// update participants
        removeChatTyping(data);
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
    });

    // log own reconnection
    socket.on('reconnect', () => {
        log('you have been reconnected');

        // if client had a username, rejoin
        if (username) {
            socket.emit('add user', username);
        }
    });

    // log reconnection error
    socket.on('reconnect_error', () => {

        log('attempt to reconnect has failed');
    });

    socket.on("spectator", () => {
        spectator = true;
        log("yay")
    });

    // if div is clicked
    $('div').on('click', function () {
        if ($(this).hasClass('column') && !spectator) {// if div is a column
            socket.emit('gameClick', $(this).attr('id'), username, $color)// click event for the game, sends coloumn, username and colour
        }
    });

    // when someone has played
    socket.on('played', function (coord, color) {

        var cells = document.getElementsByClassName('cell');//get cells
        var length = cells.length;// get number of cells
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

// function for creating a random number
function getRandomColor() {

    var letters = '0123456789ABCDEF';// hexadecimals
    var color = '#';// colours start with "#"

    for (var i = 0; i < 6; i++) {// add random letter six times

        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;//return finished string
}
