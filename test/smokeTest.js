const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const io = require('socket.io-client');
const server = require('../server/index'); // Update with your server file path

chai.use(chaiHttp);

// Import your app
const app = require('../server/index'); // Update the path to your server file

describe('Tic Tac Toe API', function() {
    // Define your sockets here
    let socket1, socket2;
    let gameId;
    afterEach(done => {
        if (socket1 && socket1.connected) socket1.disconnect();
        if (socket2 && socket2.connected) socket2.disconnect();
        done();
    });

  describe('POST /api/game', function() {
    it('should create a new game and return the gameId', function(done) {
      chai.request(app)
        .post('/api/game')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('gameId');
          done();
        });
    });
  });

  describe('GET /api/game/:gameId', function() {
    it('should return the game state for a valid gameId', function(done) {
      // First, create a game
      chai.request(app)
        .post('/api/game')
        .end((err, res) => {
          expect(res).to.have.status(201);
          
          // Then, fetch the game state for the created gameId
          const gameId = res.body.gameId;
          chai.request(app)
            .get(`/api/game/${gameId}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('players');
              expect(res.body).to.have.property('board');
              expect(res.body).to.have.property('currentPlayer');
              expect(res.body).to.have.property('state');
              expect(res.body).to.have.property('lastActivity');
              done();
            });
        });
    });
    

    it('should return 404 for an invalid gameId', function(done) {
      chai.request(app)
        .get('/api/game/invalid-game-id')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });
//   describe('Game Play', function() {
//     this.timeout(10000); 
//     it('should let two players play a game until one wins', function(done) {
//         // First, create a game
//         const socketURL = 'http://localhost:3001';

//         // Create a game using HTTP endpoint
//         chai.request(server)
//             .post('/api/game')
//             .end((err, res) => {
//                 expect(res).to.have.status(201);
//                 gameId = res.body.gameId;
//                 console.log("created game with gameId ", gameId);
//                 socket1 = io.connect(socketURL);

//                 socket1.on('connect', () => {
//                     // Player 1 joins the game


//                     socket1.on('gameUpdated', game => {
//                         console.log("player 1 gameUpdated");
//                         // Second player joins the game
//                         socket2 = io.connect(socketURL);

//                         socket2.on('connect', () => {
//                             console.log("player 2 connected");
//                             socket2.emit('joinGame', gameId);
//                             console.log("player 2 connected");
//                             socket2.on('gameUpdated', game => {
//                                 // Start playing game here
//                                 expect(game).to.have.property('state', 'ongoing');

//                                 // Player 1 makes a move
//                                 socket1.emit('makeMove', gameId, 0, 0);
//                                 socket1.on('gameUpdated', game => {
//                                     expect(game.board[0][0]).to.equal('X');

//                                     // Player 2 makes a move
//                                     socket2.emit('makeMove', gameId, 1, 0);

//                                     socket2.on('gameUpdated', game => {
//                                         expect(game.board[1][0]).to.equal('O');

//                                         // Continue game here
//                                         // Player 1 makes a move
//                                         socket1.emit('makeMove', gameId, 0, 1);
//                                         socket1.on('gameUpdated', game => {
//                                             expect(game.board[0][1]).to.equal('X');

//                                             // Player 2 makes a move
//                                             socket2.emit('makeMove', gameId, 1, 1);

//                                             socket2.on('gameUpdated', game => {
//                                                 expect(game.board[1][1]).to.equal('O');

//                                                 // Player 1 makes a move and wins the game
//                                                 socket1.emit('makeMove', gameId, 0, 2);

//                                                 socket1.on('gameUpdated', game => {
//                                                     expect(game.board[0][2]).to.equal('X');
//                                                     expect(game.state).to.equal('X-wins');

//                                                     done();
//                                                 });
//                                             });
//                                         });
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                     console.log("player 1 joined");
//                     socket1.emit('joinGame', gameId);
//                 });
//             });
//     });

});
  

