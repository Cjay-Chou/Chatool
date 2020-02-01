// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;



server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom
var numUsers = 0;
var usersList = new Array()
var cards = new Array()
const nums = ['A',2,3,4,5,6,7,8,9,10,'J','Q','K']
const signs = ['♥️', '♦️', '♣️', '♠️']
for (let index = 0; index < nums.length; index++) {
  const num = nums[index];
  for (let index = 0; index < signs.length; index++) {
    const flag = signs[index];
    cards.push(flag+num)
  }
}
cards.push('大王','小王')
function getRandom(min,max){
	return Math.floor(Math.random() * (max - min +1) + min);
}
function shuffle(arr){
	//不修改原数组
	let _arr=arr.slice();
	for(let i=0;i<_arr.length;i++){
		let j=getRandom(0,i);
		let t=_arr[i];
		_arr[i]=_arr[j];
		_arr[j]=t;
	}
	return _arr;
}

console.log(cards)
cards = shuffle(cards)
console.log(cards)

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    console.log(socket.username+': sendmessage :'+data)
    // we tell the client to execute 'new message'
    if (socket.username == 'admin_cwz' ){
      socket.broadcast.emit('start game',{
        numUsers: numUsers,
        usersList:usersList
      });
      console.log('admin: start')
      //发牌
      //洗牌两次
      cards = shuffle(cards)
      cards = shuffle(cards)
      console.log(cards)
      //
      for (let index = 0; index < usersList.length; index++) {
        const user = usersList[index];
        var pick_num = index*5;
        poker_str = ''
        for (let index = 0; index < 5; index++) {
          poker_str += cards[pick_num]+', ';
          pick_num+=1;
        }
        socket.to(user.socketId).emit("new message", {
          username: user.username,
          message:poker_str
        });
        socket.emit("new message", {
          username: user.username,
          message:poker_str
        });
      }

    }else{
      //NOT admin, show_poker to other
      for (let index = 0; index < usersList.length; index++) {
        const user = usersList[index];
        var pick_num = index*5;
        poker_str = ''
        if (user.username==socket.username) {
          for (let index = 0; index < 5; index++) {
            poker_str += cards[pick_num]+', ';
            pick_num+=1;
          }
          socket.broadcast.emit("new message", {
            username: user.username,
            message:poker_str
          });
          socket.emit('show success');
        }
      }
      
    }
    //socket.broadcast.emit('new message', {
      //username: socket.username,
      //message: data
    //});
  });


  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    if (username=='admin_cwz') {
      socket.emit('login', {
        numUsers: numUsers,
        usersList:usersList
      });
    }else{
      ++numUsers;
      addedUser = true;
      usersList.push({username:username,
        socketId:socket.id})
  
      socket.emit('login', {
        numUsers: numUsers,
        usersList:usersList
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers,
        usersList:usersList
      });
      socket.emit('user joined', {
        username: socket.username,
        numUsers: numUsers,
        usersList:usersList
      });
    }

  });

  // when the client emits 'typing', we broadcast it to others
  /*
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  Array.prototype.indexOf = function(val) { 
    for (var i = 0; i < this.length; i++) { 
      if (this[i] === val) return i; 
    } 
    return -1; 
  };
  Array.prototype.remove = function(val) { 
    var index = this.indexOf(val); 
    if (index > -1) { 
      this.splice(index, 1); 
    } 
  };
  */
  function remove_element(){
    var num = -1
    for (var i = 0; i < usersList.length; i++) { 
      if (usersList[i].username == socket.username){
        var num = i
      }
    } 
    if (num > -1) { 
      usersList.splice(num, 1); 
    } 
  }
  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;
      //usersList.remove({username:socket.username,socketId:socket.id})
      remove_element();
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        usersList: usersList
      });
    }
  });



});
