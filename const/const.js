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

const RESPONSE_CODES = {};

module.exports = {
  ACTIONS,
  ERROR_CODES,
};