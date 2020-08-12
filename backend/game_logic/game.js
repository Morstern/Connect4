const {checkHowDeep, rotateBoard} = require('../game_logic/board');

const coinFlip = () => {
  return Math.random(0, 1) > 0.5 ? 0 : 1;
};

const checkIfWinner = (board, playerIndex) => {
  var winner = false;

  if (checkIfStraight(board, playerIndex)) {
    winner = true;
  }
  if (checkIfHorizontal(board, playerIndex)) {
    winner = true;
  }
  // check if diagonal
  // TODO

  return winner;
};

const checkIfStraight = (board, playerIndex) => {
  var depthOfColumns = board.map((column) => checkHowDeep(column));
  var indexesOfEligebleColumns = depthOfColumns
    .map((columnDepth) => checkIfEligeble(columnDepth))
    .reduce((array, isEligeble, index) => {
      if (isEligeble == true) {
        array.push(index);
      }
      return array;
    }, []);

  var eligebleColumns = indexesOfEligebleColumns.map((index) => board[index]);
  if (checkIfWinCondition(eligebleColumns, playerIndex)) {
    return true;
  }
  return false;
};

const checkIfHorizontal = (board, playerIndex) => {
  var rotatedBoard = rotateBoard(board);
  var depthOfRows = rotatedBoard.map((row) => checkHowDeep(row));
  var indexesOfEligebleRows = depthOfRows
    .map((rowDepth) => checkIfEligeble(rowDepth))
    .reduce((array, isEligeble, index) => {
      if (isEligeble == true) {
        array.push(index);
      }
      return array;
    }, []);

  var eligebleRows = indexesOfEligebleRows.map((index) => rotatedBoard[index]);
  if (checkIfWinCondition(eligebleRows, playerIndex)) {
    return true;
  }

  return false;
};

const checkIfEligeble = (depth) => {
  return depth >= 4 ? 1 : 0;
};

const checkIfWinCondition = (columns, playerIndex) => {
  for (var i = 0; i < columns.length; i++) {
    var consecutiveSeries = 0;
    for (var j = columns[i].length - 1; j >= 0; j--) {
      if (columns[i][j] == playerIndex) {
        consecutiveSeries++;
        if (consecutiveSeries == 4) {
          return true;
        }
      } else {
        consecutiveSeries = 0;
      }
    }
  }
  return false;
};

module.exports = {
  coinFlip,
  checkIfWinner,
  checkIfStraight,
  checkIfHorizontal,
  checkIfEligeble,
  checkIfWinCondition,
};
