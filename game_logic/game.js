const {
  checkHowDeep,
  displayBoard,
  rotateBoard,
} = require("../game_logic/board");

const MIN_COLUMN = 0;
const MAX_COLUMN = 6;

const MIN_ROW = 0;
const MAX_ROW = 5;

const coinFlip = () => {
  return Math.random(0, 1) > 0.5 ? 0 : 1;
};

const checkIfWinner = (board, position, playerIndex) => {
  var winner = false;

  if (checkIfStraight(board, position, playerIndex)) {
    winner = true;
  } else if (checkIfHorizontal(board, position, playerIndex)) {
    winner = true;
  } else if (checkIfDiagonal(board, position, playerIndex)) {
    winner = true;
  }

  return winner;
};

const checkIfStraight = (board, position, playerIndex) => {
  const { column } = position;
  var depth = checkHowDeep(board[column]);
  if (checkIfEligeble(depth)) {
    if (checkIfWinCondition(board[column], playerIndex)) {
      return true;
    }
  }
  return false;
};

const checkIfHorizontal = (board, position, playerIndex) => {
  var rotatedBoard = rotateBoard(board);
  const { row } = position;
  var depth = checkHowDeep(rotatedBoard[row]);
  if (checkIfEligeble(depth)) {
    if (checkIfWinCondition(rotatedBoard[row], playerIndex)) {
      return true;
    }
  }
  return false;
};

const checkIfEligeble = (depth) => {
  return depth >= 4 ? 1 : 0;
};

const checkIfDiagonal = (board, position, playerIndex) => {
  var consecutiveSeries;
  const { column, row } = position;

  consecutiveSeries = 1;
  //↖
  for (var i = 1; i <= 3; i++) {
    if (column - i >= MIN_COLUMN && row - i >= MIN_ROW) {
      if (board[column - i][row - i] == playerIndex) {
        consecutiveSeries++;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  // ↘
  for (var i = 1; i <= 3; i++) {
    if (column + i <= MAX_COLUMN && row + i <= MAX_ROW) {
      if (board[column + i][row + i] == playerIndex) {
        consecutiveSeries++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  if (consecutiveSeries >= 4) {
    return true;
  }

  consecutiveSeries = 1;
  // ↗
  for (var i = 1; i <= 3; i++) {
    if (column - i >= MIN_COLUMN && row + i <= MAX_ROW) {
      if (board[column - i][row + i] == playerIndex) {
        consecutiveSeries++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // ↙
  for (var i = 1; i <= 3; i++) {
    if (column + i <= MAX_COLUMN && row - i >= MIN_ROW) {
      if (board[column + i][row - i] == playerIndex) {
        consecutiveSeries++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  if (consecutiveSeries >= 4) {
    return true;
  }

  return false;
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
