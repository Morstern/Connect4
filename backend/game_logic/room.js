const {createBoard} = require('../game_logic/board');

module.exports = class Room {
  constructor(roomId, playerObject) {
    this.roomId = roomId;
    this.players = [playerObject];
    this.board = createBoard();
    this.lastMove = null;
    this.playersTurn = -1;
  }
};
