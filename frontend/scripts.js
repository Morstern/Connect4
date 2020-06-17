// import "../common/const";

const ACTIONS = {
  ERROR: 10,
  JOINING_ROOM: 0,
  START_GAME: 1,
  MAKING_MOVE: 2,
  ANNOUNCING_WINNER: 3,
  REMOVE_ROOM: 4,
  RESTART_GAME: 5,
};

window.onload = () => {
  const ws = new WebSocket("ws://localhost:5000/");
  ws.binaryType = "arraybuffer";

  ws.onmessage = (m) => {
    var processedMessage = processMessage(m);
    console.log(processedMessage);
  };

  ws.onopen = () => {
    sendJoiningMessage(ws);
  };
};
function sendJoiningMessage(ws) {
  var url = new URL(window.location.href);
  var id = url.searchParams.get("id");
  var message = encapsulateMessage(ACTIONS.JOINING_ROOM, id);
  sendMessage(ws, message);
}

function sendMessage(ws, text) {
  var msg = stringToBuffer(text);
  ws.send(msg);
}

function encapsulateMessage(...args) {
  return args.reduce((total, arg) => {
    return total + ":" + arg;
  });
}

function decapsulateMessage(string) {
  return string.split(":");
}

function processMessage(message) {
  var data = bufferToString(message.data);
  var decapsulatedMessage = decapsulateMessage(data);
  switch (parseInt(decapsulatedMessage[0])) {
    case ACTIONS.ERROR:
      return {
        type: ACTIONS.ERROR,
      };
    case ACTIONS.START_GAME:
      return {
        type: ACTIONS.START_GAME,
        first_move: decapsulatedMessage[1],
      };
    case ACTIONS.MAKING_MOVE:
      return {
        type: ACTIONS.MAKING_MOVE,
        player: decapsulatedMessage[1],
        column: decapsulatedMessage[2],
      };
    case ACTIONS.ANNOUNCING_WINNER:
      return {
        type: ACTIONS.ANNOUNCING_WINNER,
        winner: decapsulatedMessage[1],
      };
    case ACTIONS.REMOVE_ROOM:
      return {
        type: ACTIONS.REMOVE_ROOM,
      };
  }
}

function stringToBuffer(text) {
  var buffer = new Int8Array(text.length);
  for (var i = 0; i < buffer.length; i++) {
    buffer[i] = text.charCodeAt(i);
  }
  return buffer;
}

function bufferToString(data) {
  var buffer = new Int8Array(data);
  var text = "";
  for (var i = 0; i < buffer.length; i++) {
    text += String.fromCharCode(buffer[i]);
  }
  console.log(text);
  return text;
}
