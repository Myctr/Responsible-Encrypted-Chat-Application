(function () {
  var lastPeerId = null;
  var peer = null; // own peer object
  var conn = null;
  var recvIdInput = document.getElementById("receiver-id");
  var status = document.getElementById("status");
  var state = document.getElementById("state");
  var message = document.getElementById("message");
  var sendMessageBox = document.getElementById("sendMessageBox");
  var sendButton = document.getElementById("sendButton");
  var connectButton = document.getElementById("connect-button");
  var cueString = '<span class="cueMsg">Cue: </span>';

  document.getElementById("message").style.height =
    window.innerHeight - 270 + "px";
  document.getElementById("sendMessageBox").style.width =
    window.innerWidth - 70 + "px";
  document.getElementById("receiver-id").style.width =
    window.innerWidth - 135 + "px";
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
    });
    peer.on("connection", function (c) {
      // Disallow incoming connections
      c.on("open", function () {
        c.send("Sender does not accept incoming connections");
        setTimeout(function () {
          c.close();
        }, 500);
      });
    });
    peer.on("disconnected", function () {
      status.innerHTML = "Connection lost. Please reconnect";
      console.log("Connection lost. Please reconnect");
      state.style.backgroundColor = "crimson";
      connectButton.innerHTML = "Connect";
      // Workaround for peer.reconnect deleting previous id
      peer.id = lastPeerId;
      peer._lastServerId = lastPeerId;
      peer.reconnect();
    });
    peer.on("close", function () {
      conn = null;
      status.innerHTML = "Connection destroyed. Please refresh";
      state.style.backgroundColor = "crimson";
      connectButton.innerHTML = "Connect";
      console.log("Connection destroyed");
    });
    peer.on("error", function (err) {
      console.log(err);
      state.style.backgroundColor = "crimson";
      connectButton.innerHTML = "Connect";
      alert("" + err);
    });
  }

  /**
   * Create the connection between the two Peers.
   *
   * Sets up callbacks that handle any events related to the
   * connection and data received on it.
   */
  function join() {
    // Close old connection
    if (conn) {
      conn.close();
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(recvIdInput.value, {
      reliable: true,
    });

    conn.on("open", function () {
      status.innerHTML = "Connected to: " + conn.peer;
      console.log("Connected to: " + conn.peer);
      state.style.backgroundColor = "green";
      connectButton.innerHTML = "Disconnect";

      // Check URL params for comamnds that should be sent immediately
      var command = getUrlParam("command");
      if (command) conn.send(command);
    });
    // Handle incoming data (messages only since this is the signal sender)
    conn.on("data", function (data) {
      addMessage(
        '<span class="peerMsg">Peer:</span> ' +
          "<span class='msgs' onclick='solve(this)' style='border:1px solid red'>" +
          data +
          "</span>"+"<br/>"
      );
    });
    conn.on("close", function () {
      status.innerHTML = "Connection closed";
    });
  }

  /**
   * Get first "GET style" parameter from href.
   * This enables delivering an initial command upon page load.
   *
   * Would have been easier to use location.hash.
   */
  function getUrlParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) return null;
    else return results[1];
  }

  /**
   * Send a signal via the peer connection and add it to the log.
   * This will only occur if the connection is still alive.
   */
  function signal(sigName) {
    if (conn && conn.open) {
      conn.send(sigName);
      console.log(sigName + " signal sent");
      addMessage(cueString + sigName);
    } else {
      console.log("Connection is closed");
    }
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
      var degree = 8;
      var newMsg = "";
      for (var i = 0; i < msg.length; i++) {
        var char = charToNumber(msg[i]);
        var password = (Number(char) + Number(degree)) % 76;
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
  connectButton.addEventListener("click", join);

  // Since all our callbacks are setup, start the process of obtaining an ID
  initialize();
})();
function solve(msg) {
  msg.removeAttribute("onclick");
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
  var degree = 8;
  var newMsg = "";
  for (var i = 0; i < password.length; i++) {
    var char = charToNumber(password[i]);
    var unpass = (Number(char + 76) - Number(degree)) % 76;
    newMsg += numberToChar(unpass);
  }
  msg.innerHTML = newMsg;
  msg.style = "border:1px solid green";
}
