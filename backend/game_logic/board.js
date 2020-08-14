const createBoard = () => {
  return Array.from(Array(7), () => new Array(6).fill(-1));
};

function* addToBoard(board, column, playerIndex) {
  var row;
  for (var i = board[column].length - 1; i >= 0; i--) {
    if (board[column][i] == -1) {
      board[column][i] = playerIndex;
      row = i;
      break;
    }
  }
  yield board;
  yield { column: column, row: row };
}

const rotateBoard = (board) => {
  var rows = [];
  for (var i = 0; i < board[i].length; i++) {
    var row = [];
    for (var j = 0; j < board.length; j++) {
      if (board[j][i] == undefined) {
        continue;
      } else {
        row.push(board[j][i]);
      }
    }
    rows.push(row);
  }
  return rows;
};

const checkHowDeep = (column) => {
  var deep = 0;
  for (var i = column.length - 1; i >= 0; i--) {
    if (column[i] != -1) {
      deep++;
    }
  }
  return deep;
};

const validMove = (board, column) => {
  if (column < 0 || column > 7) {
    return false;
  }
  return board[column][0] == -1;
};
const displayBoard = (board) => {
  for (var i = 0; i < board.length; i++) {
    console.log(...board[i]);
    console.log("\n");
  }
};

module.exports = {
  createBoard,
  addToBoard,
  rotateBoard,
  checkHowDeep,
  validMove,
  displayBoard,
};
