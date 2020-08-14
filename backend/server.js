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
const { addToBoard, validMove } = require("./game_logic/board");
const { coinFlip, checkIfWinner } = require("./game_logic/game");

const port = process.env.PORT || 5000;
var ROOMS = {};
const textDecoder = new TextDecoder();

app.use(cors);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./frontend/index.html"));
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
    case ACTIONS.RESTART_GAME:
      handleRestartMessage(ws, room, roomid, message);
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

    // wyślij do gracza 0 dane gracza 1
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.PLAYER_INFO, room.players[1].id)
    );
    room.players[0].ws.send(encodedMessage);

    // wyślij do gracza 1 dane gracza 0
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.PLAYER_INFO, room.players[0].id)
    );
    room.players[1].ws.send(encodedMessage);

    room.playersTurn = coinFlip();
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
        const position = iterator.next().value;

        if (checkIfWinner(room.board, position, playerIndex)) {
          encodedMessage = textEncoder.encode(
            encapsulateMessage(ACTIONS.ANNOUNCING_WINNER, message[2])
          );
        } else {
          var nextToMove = room.players.filter(
            (player) => player.id != message[2]
          )[0].id;

          room.playersTurn = room.playersTurn == 0 ? 1 : 0;

          encodedMessage = textEncoder.encode(
            encapsulateMessage(
              ACTIONS.MAKING_MOVE,
              message[2],
              message[3],
              nextToMove
            )
          );
        }

        room.players.map((player) => {
          player.ws.send(encodedMessage);
        });
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
  } else if (room.players.length < 2) {
    encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, ERROR_CODES.GAME_HASNT_STARTED)
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

    //TODO -> poprawne synchronizowanie, bo playersTurn to chyba ID, a message[3] -> to nazwa playera
    if (room.playersTurn != message[3]) {
      encodedMessage = textEncoder.encode(
        encapsulateMessage(ACTIONS.SYNCHRONIZE, room.lastMove)
      );
      ws.send(encodedMessage);
    }
  }
};

const handleRestartMessage = (ws, room, roomid, message) => {};
