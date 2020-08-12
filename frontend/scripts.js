// import "../common/const";

const ACTIONS = {
  ERROR: 10,
  CREATING_ROOM: 0,
  JOINING_ROOM: 1,
  START_GAME: 2,
  MAKING_MOVE: 3,
  ANNOUNCING_WINNER: 4,
  REMOVE_ROOM: 5,
  RESTART_GAME: 6,
  SYNCHRONIZE: 7,
  PLAYER_INFO: 8,
};

const ERROR_CODES = {
  GAME_NOT_FOUND: 6901,
  ROOM_ALREADY_CREATED: 6902,
  FULL_ROOM: 6903,
  NOT_A_PARTICIPANT: 6904,
  NOT_YOUR_TURN: 6905,
  INCORRECT_MOVE: 6906,
  GAME_HASNT_STARTED: 6907,
};

class Game {
  constructor() {
    this.turn = null;
    this.board = null;
    this.oponnentName = null;
    this.yourName = Math.random().toString(36).substring(7);
  }
}

var state = initializeState();

window.onload = function () {
  if (window.localStorage.getItem('state')) {
    state = JSON.parse(window.localStorage.getItem('state'));
    createWebSocket();
    if (playerHasToMove() == true) {
      console.log('YOUR TURN');
    } else {
      sendSynchronizeMessage();
    }
  } else {
    var url = new URL(window.location.href);
    state.roomId = url.searchParams.get('id');
    createWebSocket();
    state.game.yourName = Math.random().toString(36).substr(2);
    saveToLocalStorage();
  }
  state.ws.onmessage = (m) => {
    console.log(m);
    var messageObject = getMessageObject(m);
    processMessage(messageObject);
  };

  state.ws.onopen = function () {};
  state.ws.onclose = function () {
    window.localStorage.removeItem('state');
  };
};

function playerHasToMove() {
  if (state.game.turn == state.game.yourName) {
    return true;
  } else {
    return false;
  }
}

function sendCreatingMessage() {
  var message = encapsulateMessage(
    ACTIONS.CREATING_ROOM,
    state.roomId,
    state.game.yourName
  );
  sendMessage(message);
}

function sendJoiningMessage() {
  var message = encapsulateMessage(
    ACTIONS.JOINING_ROOM,
    state.roomId,
    state.game.yourName
  );
  sendMessage(message);
}

// ??
function sendStartingMessage() {
  var message = encapsulateMessage(ACTIONS.START_GAME, state.roomId);
  sendMessage(message);
}

function sendMakingMoveMessage() {
  var column = document.getElementById('textField').value;
  var message = encapsulateMessage(
    ACTIONS.MAKING_MOVE,
    state.roomId,
    state.game.yourName,
    column
  );
  console.log('column: ', column);
  sendMessage(message);
}

function sendExitingMessage() {
  var message = encapsulateMessage(ACTIONS.REMOVE_ROOM, state.roomId);
  sendMessage(message);
}

function sendSynchronizeMessage() {
  var message = encapsulateMessage(
    ACTIONS.SYNCHRONIZE,
    state.roomId,
    state.game.yourName,
    state.game.turn
  );
  sendMessage(message);
}

async function sendMessage(text) {
  var msg = stringToBuffer(text);
  for (var i = 0; i < 5; i++) {
    if (state.ws.readyState == 1) {
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  state.ws.send(msg);
}

function encapsulateMessage(...args) {
  return args.reduce((total, arg) => {
    return total + ':' + arg;
  });
}

function decapsulateMessage(string) {
  return string.split(':');
}

function processMessage(messageObject) {
  switch (messageObject.type) {
    case ACTIONS.ERROR:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('ErrorCode: ', messageObject.error_code);
        console.log('----');
      }
      break;
    case ACTIONS.CREATING_ROOM:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('----');
      }
      break;
    case ACTIONS.START_GAME:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('First_Move: ', messageObject.first_move);
        console.log('----');
        state.inGame = true;
        state.game.turn = messageObject.first_move;
        saveToLocalStorage();
      }
      break;
    case ACTIONS.PLAYER_INFO:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('Player_Info: ', messageObject.opponentName);
        console.log('----');
        state.game.oponnentName = messageObject.opponentName;
        saveToLocalStorage();
      }
      break;
    case ACTIONS.MAKING_MOVE:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('Player: ', messageObject.player);
        console.log('Column: ', messageObject.column);
        console.log('NextMove: ', messageObject.nextMove);
        console.log('----');
        //TODO
        state.game.turn = messageObject.nextMove;
      }
      break;
    case ACTIONS.SYNCHRONIZE:
      {
        console.log('ACTIONS.SYNCHRONIZE: ', messageObject);
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('lastMove: ', messageObject.lastMove);
        console.log('----');
      }
      break;
    case ACTIONS.ANNOUNCING_WINNER:
      {
        console.log('----');
        console.log('Type: ', getKeyFromValue(messageObject.type));
        console.log('winner: ', messageObject.winner);
        console.log('----');
      }
      break;
    default:
      console.log('----');
      console.log('UNKNOWN Message: ', messageObject);
      console.log('----');
      break;
  }
}

function getMessageObject(message) {
  var data = bufferToString(message.data);
  var decapsulatedMessage = decapsulateMessage(data);
  switch (parseInt(decapsulatedMessage[0])) {
    case ACTIONS.ERROR:
      return {type: ACTIONS.ERROR, error_code: decapsulatedMessage[1]};
    case ACTIONS.CREATING_ROOM:
      return {type: ACTIONS.CREATING_ROOM};
    case ACTIONS.START_GAME:
      return {
        type: ACTIONS.START_GAME,
        first_move: decapsulatedMessage[1],
      };
    case ACTIONS.PLAYER_INFO:
      return {
        type: ACTIONS.PLAYER_INFO,
        opponentName: decapsulatedMessage[1],
      };
    case ACTIONS.MAKING_MOVE:
      return {
        type: ACTIONS.MAKING_MOVE,
        player: decapsulatedMessage[1],
        column: decapsulatedMessage[2],
        nextMove: decapsulatedMessage[3],
      };
    case ACTIONS.ANNOUNCING_WINNER:
      return {
        type: ACTIONS.ANNOUNCING_WINNER,
        winner: decapsulatedMessage[1],
      };
    case ACTIONS.REMOVE_ROOM:
      return {type: ACTIONS.REMOVE_ROOM};
    case ACTIONS.SYNCHRONIZE:
      return {
        type: ACTIONS.SYNCHRONIZE,
        lastMove: decapsulatedMessage[1],
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
  var text = '';
  for (var i = 0; i < buffer.length; i++) {
    text += String.fromCharCode(buffer[i]);
  }
  return text;
}

function closeSocketTest() {
  state.ws.close();
}

function getKeyFromValue(value) {
  return Object.keys(ACTIONS).find((key) => ACTIONS[key] === value);
}

function saveToLocalStorage() {
  window.localStorage.setItem('state', JSON.stringify(state));
}

function createWebSocket() {
  state.ws = new WebSocket('ws://localhost:5000/' + state.roomId);
  state.ws.binaryType = 'arraybuffer';
}

function initializeState() {
  return {
    ws: null,
    roomId: null,
    inGame: false,
    game: new Game(),
  };
}
