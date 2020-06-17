const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const game = require("./routes/game.js");
const WebSocket = require("ws");
const { TextEncoder, TextDecoder } = require("util");

const { encapsulateMessage, decapsulateMessage } = require("./utils/message");
const { ACTIONS } = require("./const/const");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

var ROOMS = {
  101: {
    state: [[], [], [], [], [], [], []],
    turn: 1 / 2,
  },
};

app.use(cors);

app.use("/api/game", game);

const port = process.env.PORT || 5000;

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
    console.log(m);
    var buffer = new Int8Array(m.data);
    var message = textDecoder.decode(buffer);
    var splittedMessage = decapsulateMessage(message);
    processMessage(ws, ROOMS[splittedMessage[1]], splittedMessage);
  };
});

const processMessage = (ws, room, message) => {
  if (room === undefined) {
    const encodedMessage = textEncoder.encode(
      encapsulateMessage(ACTIONS.ERROR, "Game not found")
    );
    ws.send(encodedMessage);
  }
  console.log("room: ", room);
  console.log("message: ", message);
};
