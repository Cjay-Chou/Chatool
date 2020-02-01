$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  //var $plus10Button = $('.plus10Button');

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  const addParticipantsMessage = (data) => {
    var message = '';
    
    for (let index = 0; index < data.usersList.length; index++) {
      message += data.usersList[index].username+', ';
    }
    message += data.numUsers + " 人在线";
    log(message);
  }

  // Sets the client's username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Sends a scor message
  const sendMessage = () => {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      /*
      addChatMessage({
        username: username,
        message: message
      });
      */
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    /*
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }
    */
    

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $scoreBodyDiv = $('<span class="scoreBody">')
      .text(data.score);
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    //var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      //.addClass(typingClass)
      //.append($usernameDiv, $scoreBodyDiv, $messageBodyDiv);
      .append($usernameDiv, $messageBodyDiv);
    removeMytext(data)
    addMessageElement($messageDiv, options);
  }

  /*
  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }
  */

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
      console.log('append');
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  /*
  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
        console.log('emit typing')
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }
  */

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $('.log')
    return $('.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }
  const removeMytext = (data)=>{
    getMytext(data).fadeOut(function () {
      $(this).remove();
    });
  }

  const getMytext = (data) => {
    return $('.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  const cleanScreen = () =>{
    $('.log').fadeOut(function () {
      $(this).remove();
    });
    $('.message').fadeOut(function () {
      $(this).remove();
    });
  }

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        //socket.emit('stop typing');
        //typing = false;
      } else {
        setUsername();
      }
    }
  });

  /*
  $inputMessage.on('input', () => {
    updateTyping();
    console.log('typing!!!')
  });
  */
  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(() => {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });
/*
  $plus10Button.click(()=>{
    console.log("plus10Button clicked")
  })
  */

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    var message = "欢迎来到丑丑黄金屋 – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('start game', (data) => {
    cleanScreen();
    addParticipantsMessage(data);
    items = ['尊贵的荷官','傻逼的荷官','性感的荷官','可爱的荷官','无法描述的荷官','你爸爸','赛亚人']
    var randomItem = items[Math.floor(Math.random() * items.length)];
    addChatMessage({
      username: randomItem,
      message: '新的一局开始了，祝你好运！'
    });
    
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    addChatMessage(data);
  });

  socket.on("show success", () => {
    log('你已经成功展示了你的牌');
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    log(data.username + ' 加入了游戏');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' 离开了我们');
    addParticipantsMessage(data);
  });

  /*
  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });
 */
  socket.on('disconnect', () => {
    log('你已经断开连接');
  });

  socket.on('reconnect', () => {
    log('你已经重新连接');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    log('与丑哥之家连接失败');
  });

});
