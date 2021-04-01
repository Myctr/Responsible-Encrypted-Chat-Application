(function () {
  var lastPeerId = null;
  var peer = null; // Own peer object
  var peerId = null;
  var conn = null;
  var recvId = document.getElementById("receiver-id");
  var status = document.getElementById("status");
  var message = document.getElementById("message");
  var sendMessageBox = document.getElementById("sendMessageBox");
  var sendButton = document.getElementById("sendButton");
  document.getElementById("message").style.height =
    window.innerHeight - 270 + "px";
  document.getElementById("sendMessageBox").style.width =
    window.innerWidth - 70 + "px";
  /**
   * Create the Peer object for our end of the connection.
   *
   * Sets up callbacks that handle any events related to our
   * peer object.
   */
  function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(null, {
      debug: 2,
    });

    peer.on("open", function (id) {
      // Workaround for peer.reconnect deleting previous id
      if (peer.id === null) {
        console.log("Received null id from peer open");
        peer.id = lastPeerId;
      } else {
        lastPeerId = peer.id;
      }

      console.log("ID: " + peer.id);
      recvId.innerHTML = "ID: " + peer.id;
      status.innerHTML = "Awaiting connection...";
    });
    peer.on("connection", function (c) {
      // Allow only a single connection
      if (conn && conn.open) {
        c.on("open", function () {
          c.send("Already connected to another client");
          setTimeout(function () {
            c.close();
          }, 500);
        });
        return;
      }

      conn = c;
      console.log("Connected to: " + conn.peer);
      status.innerHTML = "Connected";
      state.style.backgroundColor = "green";
      ready();
    });
    peer.on("disconnected", function () {
      status.innerHTML = "Connection lost. Please reconnect";
      console.log("Connection lost. Please reconnect");
      state.style.backgroundColor = "crimson";
      // Workaround for peer.reconnect deleting previous id
      peer.id = lastPeerId;
      peer._lastServerId = lastPeerId;
      peer.reconnect();
    });
    peer.on("close", function () {
      conn = null;
      status.innerHTML = "Connection destroyed. Please refresh";
      console.log("Connection destroyed");
      state.style.backgroundColor = "crimson";
    });
    peer.on("error", function (err) {
      console.log(err);
      alert("" + err);
      state.style.backgroundColor = "crimson";
    });
  }

  /**
   * Triggered once a connection has been achieved.
   * Defines callbacks to handle incoming data and connection events.
   */
  function ready() {
    conn.on("data", function (data) {
      console.log("Data recieved");
      var cueString = '<span class="cueMsg">Cue: </span>';
      switch (data) {
        default:
          addMessage(
            '<span class="peerMsg">Peer: </span>' +
              "<span class='msgs' onclick='solve(this)' style='border:1px solid red'>" +
              data +
              "</span>"+"<br/>"
          );
          break;
      }
    });
    conn.on("close", function () {
      status.innerHTML = "Connection reset<br>Awaiting connection...";
      state.style.backgroundColor = "crimson";
      conn = null;
    });
  }

  function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());

    if (h > 12) h -= 12;
    else if (h === 0) h = 12;

    function addZero(t) {
      if (t < 10) t = "0" + t;
      return t;
    }

    message.innerHTML =
      "<span>" +
      message.innerHTML +
      "<br/>" +
      h +
      ":" +
      m +
      ":" +
      s +
      "</span>-" +
      msg +
      "<br/>";
  }

  // Listen for enter in message box
  sendMessageBox.addEventListener("keypress", function (e) {
    var event = e || window.event;
    var char = event.which || event.keyCode;
    if (char == "13") sendButton.click();
  });
  // Send message
  sendButton.addEventListener("click", function () {
    var alphabet =
      " AaBbCcÇçDdEeFfGgĞğHhIıİiJjKkLlMmNnOoÖöPpQqRrSsŞşTtUuUüVvWwXxYyZz0123456789.";
    function charToNumber(msg) {
      for (var i = 0; i < alphabet.length; i++) {
        if (msg == alphabet[i]) {
          return i;
        }
      }
    }
    function numberToChar(number) {
      for (var i = 0; i < alphabet.length; i++) {
        if (i == number) {
          return alphabet[i];
        }
      }
    }
    if (conn && conn.open) {
      var msg = sendMessageBox.value;
      //Affine algorith  y = ax+b
      var a = 9;
      var b = 1;
      var newMsg = "";
      for (var i = 0; i < msg.length; i++) {
        var char = charToNumber(msg[i]);
        var password = (Number(char)*Number(a)+Number(b))%76;
        newMsg += numberToChar(password);
      }
      sendMessageBox.value = "";
      conn.send(newMsg);
      console.log("Sent: " + newMsg);
      addMessage(
        "<span>You: </span> " +
          "<span class='msgs' onclick='solve(this)' style='border:1px solid red'>" +
          newMsg +
          "</span> " +
          "<br/>"
      );
    } else {
      console.log("Connection is closed");
    }
  });
  // Start peer connection on click

  // Since all our callbacks are setup, start the process of obtaining an ID
  initialize();
})();
function solve(msg) {
  msg.removeAttribute("onclick");
  var a = 9;
  var b = 1;
  var key = 0;
  for(var i=0;i<76;i++){
    key = (a*i)%76
    if(key==1){
      key = i;
      break;
    }
  }
  var alphabet =
    " AaBbCcÇçDdEeFfGgĞğHhIıİiJjKkLlMmNnOoÖöPpQqRrSsŞşTtUuUüVvWwXxYyZz0123456789.";
  function charToNumber(msg) {
    for (var i = 0; i < alphabet.length; i++) {
      if (msg == alphabet[i]) {
        return i;
      }
    }
  }
  function numberToChar(number) {
    for (var i = 0; i < alphabet.length; i++) {
      if (i == number) {
        return alphabet[i];
      }
    }
  }
  var password = msg.innerHTML;
  var newMsg = "";
  for (var i = 0; i < password.length; i++) {
    var char = charToNumber(password[i]);
    var unpass = ((char-b)*key)%76;
    if(unpass==-17){
      newMsg += 'X'
    }else{
      newMsg += numberToChar(unpass);
    }
    
  }
  msg.innerHTML = newMsg;
  msg.style.border="1px solid green";
}
