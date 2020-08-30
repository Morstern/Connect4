# Connect4
University Project: Game written in Javascript, which uses WebSockets to communicate between player and server.



## How to install & launch
npm i && npm run start

## How to play

To play the game, you need either:
  - 2 instances of different web browsers,
  - one web browser (but one instance launched in incognito mode).
  
Requirements above are dictated by the fact, that I used localStorage for preserving player data (when he'd accidentally close/refresh his browser or his internet connection would fail)

The way you play is pretty straightful if you know rules of the game Connect 4. If you don't, then you can learn how to play game from this link: [CHECK HOW TO PLAY](https://www.wikihow.com/Win-at-Connect-4)

## How does it work

Basically it gets the input id from the button you click, and it sends a message thru the websocket (messages are sent in binary format) – 
then server decodes the message and checks if the move is valid – if it is, it sends the message to both players, if it isn't it only sends to the player who made move
(and informs him, that the move is invalid). If someone wins, both players get the message of winning player.

The most interesting thing on the server side was the way I check for horizontal win: I just transpose the matrix (from 7x6 to 6x7) – and then I use the check for vertical win on transposed matrix. This was the smartest thing that I introduced on the server side.

## Synchronization

This part was a little tricky.
First of all, we needed a storage (localStorage) where we could put our data on the client side. (I believe that re-sending whole board after every move was unnecessary)

When player disconnects when it's his turn – it just simply says that it is still his turn.

But when he disconnects while it's opponent's turn – it sends a SYNCHRONIZE message, where it checks if other player made a move.

## Project goals
1. There must be at least 2 clients, and their work has to be synchronized by using the server (server is the middle man),
2. Server should be able to handle several concurrent games,
3. We should look for optimalization (busy waiting) and amount of sending messages (pooling),
4. Implementation should be resistant for refreshing webpage,
5. Data should be sent between client and server with WebSocket (binary communication),
6. For the visualisation we had to use <canvas> element,
7. Implementations should work for web browsers sucha s: Firefox, Chrome, Opera i Internet Explorer __(!)__ .

__(!)__ My implementation does not work with IE, since I earlier had problems with localStorage (before I started to use ES7 – async/await, and other functions which don't work with IE without polyfills).
