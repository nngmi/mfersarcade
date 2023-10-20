const {
    createChessGame,
    joinExistingGame,
    processMove,
    FENToBoard,
    boardToFEN,
    playerResign,
    handleDisconnect,
    suggestMove,
} = require('../../server/chess/chess.functions'); // Adjust the path to your module


describe('FEN and Board conversion', () => {
    const testCases = [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1",
        "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "rnbqkbnr/pppp1ppp/8/8/4p3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "7k/P7/8/8/8/8/8/7K w - - 0 1",
        "Q7/8/8/8/8/8/8/7K b - - 0 1",
    ];

    test.each(testCases)("converts FEN to board and back for %s", (fen) => {
        const { board, turn, castling, moveNumber } = FENToBoard(fen);
        const backToFEN = boardToFEN(board, turn === 'plain' ? 'w' : 'b', castling, moveNumber);
        expect(backToFEN).toBe(fen);
    });
});


describe("Chess Game", () => {

    let game, gameId;
    let player1 = "player1Id";
    let player2 = "player2Id";

    beforeEach(() => {
        // Create a new game before each test
        const result = createChessGame("Test Game");
        gameId = result.gameId;
        game = result.game;
    });

    it("should reject moving when not player's turn", () => {
        joinExistingGame(game, player1);
        joinExistingGame(game, player2);

        let moveResult = processMove(game, { from: "e7", to: "e5" }, player1); // It's white's turn but black is trying to move
        expect(moveResult.success).toBe(false);
    });

    it("should reject moving a piece to an invalid position", () => {
        joinExistingGame(game, player1);
        joinExistingGame(game, player2);

        let moveResult = processMove(game, { from: "e2", to: "e5" }, player1); // Pawn jumping 3 squares
        expect(moveResult.success).toBe(false);
    });

    it("should reject move that puts player's king in check", () => {
        joinExistingGame(game, player1);
        joinExistingGame(game, player2);

        processMove(game, { from: "e2", to: "e4" }, player1);
        processMove(game, { from: "e7", to: "e5" }, player2);
        processMove(game, { from: "d1", to: "h5" }, player1);

        let moveResult = processMove(game, { from: "f7", to: "f5" }, player2); // Random move that does not block check
        expect(moveResult.success).toBe(false);
        expect(moveResult.error);
    });

    it("should create, join, play a 4-move checkmate, and validate captured pieces and time updates", () => {

        expect(game.state).toBe("waiting for players");

        // Player 1 joins
        let joinResult = joinExistingGame(game, player1);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("ongoing");

        // Set initial time for players for this test
        game.players[0].timeLeft = 60000; // 1 minute
        game.players[1].timeLeft = 60000; // 1 minute
        game.lastActivity = Date.now();

        // Four-move checkmate sequence: Scholar's Mate
        const moves = [
            { player: player1, move: { from: "e2", to: "e4" } },
            { player: player2, move: { from: "e7", to: "e5" } },
            { player: player1, move: { from: "d1", to: "h5" } },
            { player: player2, move: { from: "b8", to: "c6" } },
            { player: player1, move: { from: "f1", to: "c4" } },
            { player: player2, move: { from: "g8", to: "f6" } },
            { player: player1, move: { from: "h5", to: "f7" } }
        ];

        for (let moveDetails of moves) {
            const moveResult = processMove(game, moveDetails.move, moveDetails.player);
            expect(moveResult.success).toBe(true);
        }

        // Checkmate validation
        expect(game.state).toBe("player0-wins");
        const { board } = FENToBoard("r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4");
        expect(JSON.stringify(game.board)).toBe(JSON.stringify(board));

        // Validate captured pieces
        expect(game.players[0].capturedPieces).toContain('p'); // Black captured a white pawn.

        // Validate the time updates
        // Assuming it took less than a minute for the entire match in this test.
        expect(game.players[0].timeLeft).toBeGreaterThan(0);
        expect(game.players[1].timeLeft).toBeGreaterThan(0);

    });

    it("should simulate the full Italian Game sequence", () => {

        expect(game.state).toBe("waiting for players");

        // Player 1 joins
        let joinResult = joinExistingGame(game, player1);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("ongoing");

        // Set initial time for players for this test
        game.players[0].timeLeft = 180000; // 3 minutes
        game.players[1].timeLeft = 180000; // 3 minutes
        game.lastActivity = Date.now();

        // Italian Game sequence (Italian Gambit Line)
        const moves = [
            { player: player1, move: { from: "e2", to: "e4" } },
            { player: player2, move: { from: "e7", to: "e5" } },
            { player: player1, move: { from: "g1", to: "f3" } },
            { player: player2, move: { from: "b8", to: "c6" } },
            { player: player1, move: { from: "f1", to: "c4" } },
            { player: player2, move: { from: "g8", to: "f6" } },
            { player: player1, move: { from: "d2", to: "d4" } }, // Italian Gambit starts here, 
            { player: player2, move: { from: "e5", to: "d4" } }, // black captures white pawn
            { player: player1, move: { from: "e4", to: "e5" } },
            { player: player2, move: { from: "f6", to: "g4" } },
            { player: player1, move: { from: "c4", to: "f7" } }, // white capture pawn
            { player: player2, move: { from: "e8", to: "f7" } }  // black captures white bishop
            // ... You can continue this further if you wish.
        ];

        for (let moveDetails of moves) {
            const moveResult = processMove(game, moveDetails.move, moveDetails.player);
            expect(moveResult.success).toBe(true);
        }

        // Game state validation (Assuming the game is still ongoing)
        expect(game.state).toBe("ongoing");

        // Validate captured pieces
        expect(game.players[0].capturedPieces).toContain('p'); // White captured a black pawn.
        expect(game.players[1].capturedPieces).toContain('p'); // Black captured a white pawn.
        expect(game.players[1].capturedPieces).toContain('b'); // Black captured a white bishop.

        // Validate the time updates
        // Assuming it took less than 3 minutes for the played moves in this test.
        expect(game.players[0].timeLeft).toBeGreaterThan(0);
        expect(game.players[1].timeLeft).toBeGreaterThan(0);

    });

    it("should suggest a valid move for a given game state", () => {
        // Setup initial game state
        const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Starting position
        const { board, turn, castling, moveNumber } = FENToBoard(initialFEN);

        const game = {
            board: board,
            turn: turn === 'w' ? 'plain' : 'charcoal',
            castling: castling,
            moveNumber: moveNumber,
            state: "ongoing",
            moves: [],
            currentPlayer: player1, // Assuming player1 is the white player
            players: [{ id: player1, color: "plain" }, { id: player2, color: "charcoal" }]
        };

        // Call suggestMove to get a move suggestion
        const suggestedMove = suggestMove(game, 'plain');

        // Validate the move
        expect(suggestedMove).not.toBeNull();
        const moveResult = processMove(game, suggestedMove, player1); // Assuming player1 is the current player
        expect(moveResult.success).toBe(true);
    });

});


describe("Pawn Promotion", () => {

    let game, gameId;
    let player1 = "player1Id";
    let player2 = "player2Id";

    beforeEach(() => {
        // Create a new game before each test with a custom FEN for pawn promotion
        const fenForPawnPromotion = "7k/P7/8/8/8/8/8/7K w - - 0 1";
        const result = createChessGame("Test Pawn Promotion", fenForPawnPromotion);
        gameId = result.gameId;
        game = result.game;
    });

    it("should create, join, and promote a pawn to queen", () => {

        expect(game.state).toBe("waiting for players");

        // Player 1 joins
        let joinResult = joinExistingGame(game, player1);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("ongoing");

        // Move sequence to promote the pawn
        const move = { player: player1, move: { from: "a7", to: "a8" } };
        const moveResult = processMove(game, move.move, move.player);
        expect(moveResult.success).toBe(true);

        // Verify that the pawn has been promoted to a queen
        const { board } = FENToBoard("Q6k/8/8/8/8/8/8/7K b - - 0 2");
        expect(JSON.stringify(game.board)).toBe(JSON.stringify(board));

    });
});

describe("Black Pawn Promotion", () => {

    let game, gameId;
    let player1 = "player1Id";  // Assuming player 1 is white
    let player2 = "player2Id";  // Assuming player 2 is black

    beforeEach(() => {
        // Create a new game before each test with a custom FEN for black pawn promotion
        const fenForPawnPromotion = "7k/8/8/8/8/8/p7/7K w - - 0 1";
        const result = createChessGame("Test Black Pawn Promotion", fenForPawnPromotion);
        gameId = result.gameId;
        game = result.game;
    });

    it("should create, join, and promote a black pawn to queen", () => {

        expect(game.state).toBe("waiting for players");

        // Player 1 joins
        let joinResult = joinExistingGame(game, player1);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(game.state).toBe("ongoing");

        // First move by the white King
        const kingMove = { player: player1, move: { from: "h1", to: "h2" } };
        const kingMoveResult = processMove(game, kingMove.move, kingMove.player);
        expect(kingMoveResult.success).toBe(true);

        // Move sequence to promote the black pawn
        const move = { player: player2, move: { from: "a2", to: "a1" } };
        const moveResult = processMove(game, move.move, move.player);
        expect(moveResult.success).toBe(true);

        // Verify that the black pawn has been promoted to a black queen
        const { board } = FENToBoard("7k/8/8/8/8/8/7K/q7 w - - 0 2");
        expect(JSON.stringify(game.board)).toBe(JSON.stringify(board));
    });
});

describe('Chess game flow 1', () => {

    let chessGames = {};
    let gameId;
    let player1Id = "player1SocketId";
    let player2Id = "player2SocketId";
    let player1JoinKey;
    let player2JoinKey;

    beforeEach(() => {
        const gameCreation = createChessGame("Test Game");
        gameId = gameCreation.gameId;
        chessGames[gameId] = gameCreation.game;
    });

    afterEach(() => {
        gameId = null;
        player1JoinKey = null;
        player2JoinKey = null;
        chessGames = {};
    });

    test('join, disconnect and rejoin game', () => {
        // Player 1 joins
        const join1 = joinExistingGame(chessGames[gameId], player1Id);
        expect(join1.success).toBe(true);
        expect(join1.joinedPlayer).toBe(player1Id);
        player1JoinKey = chessGames[gameId].players.find(p => p.id === player1Id).joinKey;

        // Player 2 joins
        const join2 = joinExistingGame(chessGames[gameId], player2Id);
        expect(join2.success).toBe(true);
        expect(join2.joinedPlayer).toBe(player2Id);
        player2JoinKey = chessGames[gameId].players.find(p => p.id === player2Id).joinKey;

        // Player 1 makes a move
        let moveResult = processMove(chessGames[gameId], { from: "e2", to: "e4" }, player1Id);
        expect(moveResult.success).toBe(true);

        // Player 1 disconnects
        const disconnectResult1 = handleDisconnect(chessGames, player1Id);
        expect(disconnectResult1.gameUpdated).toBe(true);
        expect(disconnectResult1.gameId).toBe(gameId);
        expect(disconnectResult1.disconnectingPlayer).toBe(player1Id);

        // Player 1 tries to rejoin with incorrect joinKey
        const failedRejoin = joinExistingGame(chessGames[gameId], player1Id, "incorrectKey");
        expect(failedRejoin.error).toBeDefined();

        // Player 1 rejoins with correct joinKey
        const rejoin = joinExistingGame(chessGames[gameId], player1Id, player1JoinKey);
        expect(rejoin.success).toBe(true);
        expect(rejoin.joinedPlayer).toBe(player1Id);

        // Player 2 resigns
        const resign = playerResign(chessGames[gameId], player2Id);
        expect(resign.success).toBe(true);
    });

});

describe('Chess game flow', () => {

    let chessGames = {};
    let gameId;
    let player1Id = "player1SocketId";
    let player2Id = "player2SocketId";
    let player3Id = "player3SocketId"; // Introducing a third player
    let player1JoinKey;
    let player2JoinKey;

    beforeEach(() => {
        const gameCreation = createChessGame("Test Game");
        gameId = gameCreation.gameId;
        chessGames[gameId] = gameCreation.game;
    });

    afterEach(() => {
        gameId = null;
        player1JoinKey = null;
        player2JoinKey = null;
        chessGames = {};
    });

    test('join, disconnect, rejoin game and third player scenarios', () => {
        // Player 1 joins
        const join1 = joinExistingGame(chessGames[gameId], player1Id);
        expect(join1.success).toBe(true);
        expect(join1.joinedPlayer).toBe(player1Id);
        player1JoinKey = chessGames[gameId].players.find(p => p.id === player1Id).joinKey;

        // Player 2 joins
        const join2 = joinExistingGame(chessGames[gameId], player2Id);
        expect(join2.success).toBe(true);
        expect(join2.joinedPlayer).toBe(player2Id);
        player2JoinKey = chessGames[gameId].players.find(p => p.id === player2Id).joinKey;

        // Player 1 makes a move
        let moveResult = processMove(chessGames[gameId], { from: "e2", to: "e4" }, player1Id);
        expect(moveResult.success).toBe(true);

        // Player 3 tries to join (game is full)
        const join3 = joinExistingGame(chessGames[gameId], player3Id);
        expect(join3.error).toBe("Game is full");

        // Player 3 tries to make a move without joining
        let moveResult3 = processMove(chessGames[gameId], { from: "e7", to: "e5" }, player3Id);
        expect(moveResult3.error).toBe("Not a valid player");

        // Player 1 disconnects
        const disconnectResult1 = handleDisconnect(chessGames, player1Id);
        expect(disconnectResult1.gameUpdated).toBe(true);
        expect(disconnectResult1.gameId).toBe(gameId);

        // Player 1 tries to rejoin with incorrect joinKey
        const failedRejoin = joinExistingGame(chessGames[gameId], player1Id, "incorrectKey");
        expect(failedRejoin.error).toBeDefined();

        // Player 3 tries to join with an incorrect key
        const failedJoin3 = joinExistingGame(chessGames[gameId], player3Id, "someWrongKey");
        expect(failedJoin3.error).toBe("Game is full");


        // Player 3 hacks player 1 id and tries to join
        const failedJoin3Again = joinExistingGame(chessGames[gameId], player1Id, "someWrongKey");
        expect(failedJoin3Again.error).toBe("Game is full");

        // Player 1 rejoins with correct joinKey
        const rejoin = joinExistingGame(chessGames[gameId], player1Id, player1JoinKey);
        expect(rejoin.success).toBe(true);
        expect(rejoin.joinedPlayer).toBe(player1Id);

        // Player 2 resigns
        const resign = playerResign(chessGames[gameId], player2Id);
        expect(resign.success).toBe(true);
    });

});
