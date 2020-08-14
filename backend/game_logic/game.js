const {
  checkHowDeep,
  displayBoard,
  rotateBoard,
} = require("../game_logic/board");

const coinFlip = () => {
  return Math.random(0, 1) > 0.5 ? 0 : 1;
};

const checkIfWinner = (board, position, playerIndex) => {
  var winner = false;
  if (checkIfStraight(board, position, playerIndex)) {
    winner = true;
  }
  if (checkIfHorizontal(board, position, playerIndex)) {
    winner = true;
  }
  // checkIfDiagonal(board,playerIndex)
  // TODO: CREATE DIAGONAL

  return winner;
};

const checkIfStraight = (board, position, playerIndex) => {
  var depth = checkHowDeep(board[position.column]);
  if (checkIfEligeble(depth)) {
    if (checkIfWinCondition(board[position.column], playerIndex)) {
      return true;
    }
  }
  return false;
};

const checkIfHorizontal = (board, position, playerIndex) => {
  var rotatedBoard = rotateBoard(board);
  var depth = checkHowDeep(rotatedBoard[position.row]);
  if (checkIfEligeble(depth)) {
    if (checkIfWinCondition(rotatedBoard[position.row], playerIndex)) {
      return true;
    }
  }
  return false;
};

const checkIfEligeble = (depth) => {
  return depth >= 4 ? 1 : 0;
};

const checkIfWinCondition = (column, playerIndex) => {
  var consecutiveSeries = 0;
  for (var i = column.length - 1; i >= 0; i--) {
    if (column[i] == playerIndex) {
      consecutiveSeries++;
      if (consecutiveSeries == 4) {
        return true;
      }
    } else {
      consecutiveSeries = 0;
    }
  }
  return false;
};

module.exports = {
  coinFlip,
  checkIfWinner,
};
