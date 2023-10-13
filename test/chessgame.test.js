const {
    createChessGame,
    joinExistingGame,
    processMove,
    FENToBoard,
    boardToFEN,
} = require('../server/chess/chess.functions'); // Adjust the path to your module


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
        const backToFEN = boardToFEN(board, turn === 'white' ? 'w' : 'b', castling, moveNumber);
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

    it("should create, join, and play a 4-move checkmate", () => {

        expect(game.state).toBe("waiting for players");

        // Player 1 joins
        let joinResult = joinExistingGame(game, player1);
        expect(joinResult.success).toBe(true);
        expect(joinResult.playerColor).toBe("white");
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(joinResult.playerColor).toBe("black");
        expect(game.state).toBe("ongoing");

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
        expect(game.state).toBe("white-wins");
        const { board } = FENToBoard("r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4");
        expect(JSON.stringify(game.board)).toBe(JSON.stringify(board));

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
        expect(joinResult.playerColor).toBe("white");
        expect(game.state).toBe("waiting for players");

        // Player 2 joins
        joinResult = joinExistingGame(game, player2);
        expect(joinResult.success).toBe(true);
        expect(joinResult.playerColor).toBe("black");
        expect(game.state).toBe("ongoing");

        // Move sequence to promote the pawn
        const move = { player: player1, move: { from: "a7", to: "a8", promotion: 'q' } }; 
        const moveResult = processMove(game, move.move, move.player);
        expect(moveResult.success).toBe(true);

        // Verify that the pawn has been promoted to a queen
        const { board } = FENToBoard("Q6k/8/8/8/8/8/8/7K b - - 0 2");
        expect(JSON.stringify(game.board)).toBe(JSON.stringify(board));
    });
});
