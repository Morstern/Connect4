class Game {
  constructor() {
    this.turn = null;
    this.board = makeClearBoard();
    this.opponentName = null;
    this.yourName = Math.random().toString(36).substring(7);
    this.whoStarted = null;
    this.lastMove = null;
  }
}

function makeClearBoard() {
  return [
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
  ];
}

const positions = [];
var state = initializeState();

function initializeState() {
  return {
    ws: null,
    roomId: null,
    inGame: false,
    game: new Game(),
  };
}

window.onload = function () {
  var ws = createWebSocket();
  if (window.localStorage.getItem("state")) {
    state = JSON.parse(window.localStorage.getItem("state"));
    state.ws = ws;
    if (state.inGame === true) {
      sendSynchronizeMessage();
      initializeGame();
      updatePlayers();
      updateHeaderMessage();
    } else if (state.roomId !== null) {
      initializeGame();
      document.getElementById("message").textContent =
        "Waiting for other player...";
    }
  } else {
    state.ws = ws;
    var options = document.getElementById("options");
    options.style.display = "flex";
  }
};

////
// HERE GRAPHIC FUNCTIONS STARTS
////

function initializeGame() {
  var gameDiv = document.getElementById("game");
  gameDiv.style.display = "block";
  var canvas = document.getElementById("canvas");
  if (canvas.getContext("2d")) {
    var ctx = canvas.getContext("2d");
    createGraphicBoard(ctx);
    createHoles(ctx);
    updateGraphicBoard(ctx);
    createButtons();
  }
}

function createGraphicBoard(ctx) {
  ctx.fillStyle = "#00ffff";
  ctx.beginPath();
  ctx.fillRect(0, 0, 800, 600);
  ctx.closePath();

  ctx.fillStyle = "#aafafa";
  ctx.beginPath();
  ctx.fillRect(30, 30, 740, 540);
  ctx.closePath();
}

function createHoles(ctx) {
  for (var y = 85; y <= 600 - 85; y += 85) {
    var row = [];
    for (var x = 95; x <= 740; x += 100) {
      row.push({ positionX: x, positionY: y });
      createCircle(ctx, x, y, "#808080");
    }
    positions.push(row);
  }
}

function createButtons() {
  var buttons = document.getElementById("buttons");
  buttons.innerHTML = "";
  for (var i = 0; i < 7; i++) {
    var button = document.createElement("div");
    button.textContent = i;
    button.id = i;
    button.className = "button";
    button.onclick = function (event) {
      handleClick(event.target.id);
    };
    buttons.appendChild(button);
  }
}

function handleClick(column) {
  sendMakingMoveMessage(column);
}

function createCircle(ctx, positionX, positionY, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(positionX, positionY, 35, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

function updateMakingMove(playerName, column, row) {
  state.game.board[column][row] = playerName;
  saveToLocalStorage();
  const { positionX, positionY } = positions[row][column];
  var canvas = document.getElementById("canvas");
  if (canvas.getContext("2d")) {
    var ctx = canvas.getContext("2d");
    if (playerName == state.game.whoStarted) {
      createCircle(ctx, positionX, positionY, "#ff0000");
    } else {
      createCircle(ctx, positionX, positionY, "#0000ff");
    }
  }
}

function updateGraphicBoard(ctx) {
  for (var column = 0; column < state.game.board.length; column++) {
    for (var row = state.game.board[column].length - 1; row >= 0; row--) {
      if (state.game.board[column][row] == -1) {
        break;
      } else {
        const { positionX, positionY } = positions[row][column];
        if (state.game.board[column][row] == state.game.whoStarted) {
          createCircle(ctx, positionX, positionY, "#ff0000");
        } else {
          createCircle(ctx, positionX, positionY, "#0000ff");
        }
      }
    }
  }
}

function updateHeaderMessage() {
  updateHeaderColor(state.game.turn);

  state.game.turn == state.game.yourName
    ? (document.getElementById("message").textContent = "Your turn")
    : (document.getElementById("message").textContent = "Your opponent turn");
}

function updateHeaderColor(playerName) {
  document.getElementById("message").className =
    playerName == state.game.whoStarted
      ? "message--player_1"
      : "message--player_2";
}

function updatePlayers() {
  const { whoStarted, yourName, opponentName } = state.game;
  document.getElementById("player_1").textContent =
    whoStarted + (whoStarted == yourName ? " (you)" : "");
  document.getElementById("player_2").textContent =
    whoStarted == yourName ? opponentName : yourName + " (you)";
}

function sendBackToMenu() {
  document.getElementById("player_1").textContent = "...";
  document.getElementById("player_2").textContent = "...";

  document.getElementById("message").className = "";
  document.getElementById("message").textContent = "Connect 4";
  document.getElementById("game").style.display = "none";
  document.getElementById("options").style.display = "flex";
}

/// ***
// HERE GRAPHIC FUNCTIONS ENDS
/// ***

///
// HERE WEB-SOCKET COMMUNICATION FUNCTIONS STARTS
///

function sendCreatingMessage() {
  if (state.ws == null) {
    createWebSocket();
  }

  state.roomId = document.getElementById("roomInput").value;

  var message = encapsulateMessage(
    ACTIONS.CREATING_ROOM,
    state.roomId,
    state.game.yourName
  );
  sendMessage(message);
}

function sendJoiningMessage() {
  state.roomId = document.getElementById("roomInput").value;

  var message = encapsulateMessage(
    ACTIONS.JOINING_ROOM,
    state.roomId,
    state.game.yourName
  );
  sendMessage(message);
}

function sendMakingMoveMessage(column) {
  var message = encapsulateMessage(
    ACTIONS.MAKING_MOVE,
    state.roomId,
    state.game.yourName,
    column
  );
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

function sendRequestRematchMessage() {
  var message = encapsulateMessage(
    ACTIONS.REQUEST_REMATCH,
    state.roomId,
    state.game.yourName
  );
  sendMessage(message);
}

function sendAcceptRematchMessage() {
  var message = encapsulateMessage(ACTIONS.ACCEPT_REMATCH, state.roomId);
  sendMessage(message);
}

function sendDeclineRematchMessage() {
  var message = encapsulateMessage(ACTIONS.DECLINE_REMATCH, state.roomId);
  sendMessage(message);
  state.game = new Game();
  state.roomId = null;
}

function sendRemoveRoomMessage() {
  var message = encapsulateMessage(ACTIONS.REMOVE_ROOM, state.roomId);
  sendMessage(message);

  clearStateAfterGame();
  sendBackToMenu();
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
  return args.reduce(function (total, arg) {
    return total + ":" + arg;
  });
}

function decapsulateMessage(string) {
  return string.split(":");
}

function processMessage(messageObject) {
  switch (messageObject.type) {
    case ACTIONS.ERROR:
      {
        const { type, error_code } = messageObject;
        if (error_code == ERROR_CODES.GAME_NOT_FOUND) {
          clearStateAfterGame();
          sendBackToMenu();
        }
        console.log("----");
        console.log("Type: ", getKeyFromValue(type));
        console.log("ErrorCode: ", error_code);
        console.log("----");
      }
      break;
    case ACTIONS.CREATING_ROOM:
      {
        saveToLocalStorage();
        document.getElementById("options").style.display = "none";
        initializeGame();
        document.getElementById("message").textContent =
          "Waiting for other player...";
      }
      break;
    case ACTIONS.START_GAME:
      {
        const { first_move } = messageObject;
        document.getElementById("options").style.display = "none";
        initializeGame();
        state.inGame = true;
        state.game.whoStarted = first_move;
        state.game.turn = first_move;
        updatePlayers();
        updateHeaderMessage();
        saveToLocalStorage();
      }
      break;
    case ACTIONS.PLAYER_INFO:
      {
        const { opponentName } = messageObject;
        state.game.opponentName = opponentName;
        saveToLocalStorage();
      }
      break;
    case ACTIONS.MAKING_MOVE:
      {
        const { player, column, row, nextMove } = messageObject;
        updateMakingMove(player, column, row);
        state.game.lastMove = column;
        state.game.turn = nextMove;
        updateHeaderMessage();
        saveToLocalStorage();
      }
      break;
    case ACTIONS.SYNCHRONIZE:
      {
        const { playerId, column, row } = messageObject;
        updateMakingMove(playerId, column, row);
        state.game.lastMove = column;
        state.game.turn = state.game.yourName;
        updateHeaderMessage();
        saveToLocalStorage();
      }
      break;
    case ACTIONS.ANNOUNCING_WINNER:
      {
        const { winner } = messageObject;
        updateHeaderColor(winner);
        document.getElementById("message").textContent = "WINNER: " + winner;
      }
      break;

    // -> all of those cases below can be implemented on the client side
    // -> server has already implemented those actions
    case ACTIONS.REQUEST_REMATCH:
      {
        const { type } = messageObject;
        console.log("----");
        console.log("Type: ", getKeyFromValue(type));
        console.log("----");
      }
      break;
    case ACTIONS.ACCEPT_REMATCH:
      {
        const { type } = messageObject;
        console.log("----");
        console.log("Type: ", getKeyFromValue(type));
        console.log("----");
      }
      break;
    case ACTIONS.DECLINE_REMATCH:
      {
        const { type } = messageObject;
        console.log("----");
        console.log("Type: ", getKeyFromValue(type));
        console.log("----");
        state = null;
        state.game.board = makeClearBoard();
        initializeGame();
      }
      break;
    default:
      console.log("----");
      console.log("UNKNOWN Message: ", messageObject);
      console.log("----");
      break;
  }
}

function getMessageObject(message) {
  var data = bufferToString(message.data);
  var decapsulatedMessage = decapsulateMessage(data);
  switch (parseInt(decapsulatedMessage[0])) {
    case ACTIONS.ERROR:
      return { type: ACTIONS.ERROR, error_code: decapsulatedMessage[1] };
    case ACTIONS.CREATING_ROOM:
      return { type: ACTIONS.CREATING_ROOM };
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
        column: parseInt(decapsulatedMessage[2]),
        row: parseInt(decapsulatedMessage[3]),
        nextMove: decapsulatedMessage[4],
      };
    case ACTIONS.ANNOUNCING_WINNER:
      return {
        type: ACTIONS.ANNOUNCING_WINNER,
        winner: decapsulatedMessage[1],
      };
    case ACTIONS.REQUEST_REMATCH:
      return { type: ACTIONS.REQUEST_REMATCH };
    case ACTIONS.ACCEPT_REMATCH:
      return { type: ACTIONS.ACCEPT_REMATCH };
    case ACTIONS.DECLINE_REMATCH:
      return { type: ACTIONS.DECLINE_REMATCH };
    case ACTIONS.SYNCHRONIZE:
      return {
        type: ACTIONS.SYNCHRONIZE,
        playerId: decapsulatedMessage[1],
        column: decapsulatedMessage[2],
        row: decapsulatedMessage[3],
      };
  }
}

/// ***
// HERE WEB-SOCKET COMMUNICATION FUNCTIONS ENDS
/// ***

///
// HERE UTILITY_FUNCTIONS STARTS
///

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
  return text;
}

function getKeyFromValue(value) {
  return Object.keys(ACTIONS).find(function (key) {
    return ACTIONS[key] === value;
  });
}

function saveNickname() {
  var nick = document.getElementById("nickInput").value;
  state.game.yourName = nick;
  saveToLocalStorage();
}

function saveToLocalStorage() {
  window.localStorage.setItem("state", JSON.stringify(state));
}

function removeLocalStorage() {
  window.localStorage.removeItem("state");
}

function createWebSocket() {
  var ws = new WebSocket("ws://" + window.location.host);
  ws.binaryType = "arraybuffer";
  ws.onmessage = function (m) {
    var messageObject = getMessageObject(m);
    processMessage(messageObject);
  };
  ws.onclose = function () {
    window.localStorage.removeItem("state");
  };

  return ws;
}

function clearStateAfterGame() {
  state.game.opponentName = null;
  state.game.turn = null;
  state.game.whoStarted = null;
  state.roomId = null;
  state.inGame = false;
  state.game.board = makeClearBoard();
  removeLocalStorage();
}

///
// HERE UTILITY_FUNCTIONS ENDS
///

const ACTIONS = {
  ERROR: 69,
  CREATING_ROOM: 0,
  JOINING_ROOM: 1,
  START_GAME: 2,
  MAKING_MOVE: 3,
  ANNOUNCING_WINNER: 4,
  REMOVE_ROOM: 5,
  REQUEST_REMATCH: 6,
  ACCEPT_REMATCH: 7,
  DECLINE_REMATCH: 8,
  SYNCHRONIZE: 9,
  PLAYER_INFO: 10,
};

const ERROR_CODES = {
  GAME_NOT_FOUND: 6901,
  ROOM_ALREADY_CREATED: 6902,
  FULL_ROOM: 6903,
  NOT_A_PARTICIPANT: 6904,
  NOT_YOUR_TURN: 6905,
  INCORRECT_MOVE: 6906,
  GAME_HASNT_STARTED: 6907,
  GAME_HASNT_FINISHED: 6908,
  PLAYER_HAS_LEFT: 6910,
  GAME_IS_FINISHED: 6911,
};
