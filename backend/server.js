const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const WebSocket = require("ws");
const { TextEncoder, TextDecoder } = require("util");

const { encapsulateMessage, decapsulateMessage } = require("./utils/message");
const { ACTIONS, ERROR_CODES } = require("./const/const");
const textEncoder = new TextEncoder();
const Player = require("./game_logic/player");
const Room = require("./game_logic/room");
const { addToBoard, validMove, createBoard } = require("./game_logic/board");
const { coinFlip, checkIfWinner } = require("./game_logic/game");

const port = process.env.PORT || 5000;
var ROOMS = {};
const textDecoder = new TextDecoder();

app.use(cors());

app.use(express.static("../frontend/"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
});

const server = app.listen(port, () => {
  console.log("Nasłuchiwanie na porcie: ", port);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.binaryType = "arraybuffer";
  ws.onmessage = (m) => {
    var buffer = new Int8Array(m.data);
    var message = textDecoder.decode(buffer);
    var splittedMessage = decapsulateMessage(message);
    processMessage(ws, ROOMS[splittedMessage[1]], splittedMessage);
  };
});

const processMessage = (ws, room, message) => {
  var roomId = message[1];
  console.log("processMessage->message: ", message);
  switch (parseInt(message[0])) {
    case ACTIONS.CREATING_ROOM:
      handleCreatingRoomMessage(ws, room, roomId, message);
      break;
    case ACTIONS.JOINING_ROOM:
      handleJoiningRoomMessage(ws, room, roomId, message);
      break;
    case ACTIONS.MAKING_MOVE:
      handleMakingMoveMessage(ws, room, roomId, message);
      break;
    case ACTIONS.SYNCHRONIZE:
      handleSynchronizeMessage(ws, room, roomId, message);
      break;
    case ACTIONS.REQUEST_REMATCH:
    case ACTIONS.ACCEPT_REMATCH:
    case ACTIONS.DECLINE_REMATCH:
      handleRematchMessage(ws, room, roomId, message);
      break;
    case ACTIONS.REMOVE_ROOM:
      handleRemoveRoomMessage(ws, room, roomId, message);
      break;
  }
};

const handleCreatingRoomMessage = (ws, room, roomId, message) => {
  if ((room === undefined) & (message[0] != ACTIONS.CREATING_ROOM)) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_NOT_FOUND)
    );
    ws.send(encodedMessage);
  } else if (room != undefined) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.ROOM_ALREADY_CREATED)
    );
    ws.send(encodedMessage);
  } else if ((room === undefined) & (message[0] == ACTIONS.CREATING_ROOM)) {
    ROOMS[roomId] = new Room(roomId, new Player(ws, message[2]));
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.CREATING_ROOM, 0)
    );
    ws.send(encodedMessage);
  }
};

const handleJoiningRoomMessage = (ws, room, roomId, message) => {
  if (room === undefined) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_NOT_FOUND)
    );
    ws.send(encodedMessage);
  } else if (room.players.length == 2) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.FULL_ROOM)
    );
    ws.send(encodedMessage);
  } else {
    room.players.push(new Player(ws, message[2]));

    // player[1].name -> player[0]
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.PLAYER_INFO, room.players[1].id)
    );
    room.players[0].ws.send(encodedMessage);

    // player[0].name -> player[1]
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.PLAYER_INFO, room.players[0].id)
    );
    room.players[1].ws.send(encodedMessage);

    room.playersTurn = coinFlip();
    room.hasStarted = true;
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.START_GAME, room.players[room.playersTurn].id)
    );
    room.players.map((player) => {
      player.ws.send(encodedMessage);
    });
  }
};

const handleMakingMoveMessage = (ws, room, roomId, message) => {
  if (room === undefined) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_NOT_FOUND)
    );
    ws.send(encodedMessage);
  } else if (room.hasStarted === false) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_HASNT_STARTED)
    );
    ws.send(encodedMessage);
  } else if (room.hasFinished === true) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_IS_FINISHED)
    );
    ws.send(encodedMessage);
  } else {
    if (room.players.some((player) => player.id == message[2]) == false) {
      encodedMessage = textEncoder.encode(
        encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.NOT_A_PARTICIPANT)
      );
      ws.send(encodedMessage);
    } else if (room.players[room.playersTurn].id != message[2]) {
      encodedMessage = textEncoder.encode(
        encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.NOT_YOUR_TURN)
      );
      ws.send(encodedMessage);
    } else {
      if (validMove(room.board, message[3])) {
        const playerIndex = room.players
          .map((player) => player.id)
          .indexOf(message[2]);

        const iterator = addToBoard(room.board, message[3], playerIndex);
        room.board = iterator.next().value;
        room.lastMove = message[3];
        const position = iterator.next().value;
        room.lastMovePosition = position;

        var nextToMove = room.players.filter(
          (player) => player.id != message[2]
        )[0].id;

        room.playersTurn = room.playersTurn == 0 ? 1 : 0;

        encodedMessage = textEncoder.encode(
          encapsulateMessage(
            ACTIONS.MAKING_MOVE,
            message[2],
            position.column,
            position.row,
            nextToMove
          )
        );

        room.players.map((player) => {
          player.ws.send(encodedMessage);
        });

        if (checkIfWinner(room.board, position, playerIndex)) {
          room.hasFinished = true;
          encodedMessage = textEncoder.encode(
            encapsulateMessage(ACTIONS.ANNOUNCING_WINNER, message[2])
          );
          room.players.map((player) => {
            player.ws.send(encodedMessage);
          });
        }
      } else {
        encodedMessage = textEncoder.encode(
          encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.INCORRECT_MOVE)
        );
        ws.send(encodedMessage);
      }
    }
  }
};

const handleSynchronizeMessage = (ws, room, roomId, message) => {
  if (room === undefined) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_NOT_FOUND)
    );
    ws.send(encodedMessage);
  } else if (room.hasStarted === false) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_HASNT_STARTED)
    );
    ws.send(encodedMessage);
  } else if (room.hasFinished) {
    var winner = room.players.filter(
      (player) => player.id != room.players[room.playersTurn].id
    )[0].id;

    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ANNOUNCING_WINNER, winner)
    );
    ws.send(encodedMessage);
  } else {
    var indexOfDisconnectedPlayer = room.players
      .map((player) => player.id)
      .indexOf(message[2]);

    if (indexOfDisconnectedPlayer < 0) {
      encodedMessage = textEncoder.encode(
        encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.NOT_A_PARTICIPANT)
      );
      ws.send(encodedMessage);
    }

    room.players[indexOfDisconnectedPlayer].ws = ws;

    if (room.lastMovePosition == null) {
      return;
    }

    var hasOtherPlayerMoved =
      room.playersTurn == indexOfDisconnectedPlayer ? true : false;

    if (hasOtherPlayerMoved) {
      encodedMessage = textEncoder.encode(
        encapsulateMessage(
          ACTIONS.SYNCHRONIZE,
          message[3],
          room.lastMovePosition.column,
          room.lastMovePosition.row
        )
      );
      ws.send(encodedMessage);
    }
  }
};

const handleRematchMessage = (ws, room, roomid, message) => {
  if (room === undefined) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_NOT_FOUND)
    );
    ws.send(encodedMessage);
  } else if (room.hasFinished != false) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_HASNT_FINSHED)
    );
    ws.send(encodedMessage);
  } else if (room.players.length == 1) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.PLAYER_HAS_LEFT)
    );
    ws.send(encodedMessage);
  } else {
    var otherPlayer = room.players.filter(
      (player) => player.id != message[2]
    )[0];

    switch (parseInt(message[0])) {
      case ACTIONS.REQUEST_REMATCH:
        encodedMessage = textEncoder.encode(
          encapsulateMessage(ACTIONS.REQUEST_REMATCH)
        );
        otherPlayer.ws.send(encodedMessage);
        break;
      case ACTIONS.ACCEPT_REMATCH:
        encodedMessage = textEncoder.encode(
          encapsulateMessage(ACTIONS.ACCEPT_REMATCH)
        );
        otherPlayer.ws.send(encodedMessage);

        room.board = createBoard();
        room.lastMove = null;
        room.hasFinished = false;
        room.playersTurn = coinFlip();

        encodedMessage = textEncoder.encode(
          encapsulateMessage(
            ACTIONS.START_GAME,
            room.players[room.playersTurn].id
          )
        );
        room.players.map((player) => {
          player.ws.send(encodedMessage);
        });
        break;
      case ACTIONS.DECLINE_REMATCH:
        encodedMessage = textEncoder.encode(
          encapsulateMessage(ACTIONS.DECLINE_REMATCH)
        );
        otherPlayer.ws.send(encodedMessage);
        delete ROOMS[roomid];
        break;
    }
  }
};

const handleRemoveRoomMessage = (ws, room, roomid, message) => {
  delete ROOMS[roomid];
};
