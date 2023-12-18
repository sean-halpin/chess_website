// ChessGameLogic.test.ts

import { ChessGameLogic } from "../ChessGameLogic";
import { BoardLocation, Team } from "../ChessGameTypes";
import { MoveCommand } from "../GameCommands";

describe("ChessGameLogic", () => {
  let chessGameLogic: ChessGameLogic;

  beforeEach(() => {
    chessGameLogic = new ChessGameLogic();
  });
  
it("should initialize from a default FEN string", () => {
    const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const initialGame: ChessGameLogic = new ChessGameLogic(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.winner).toBeNull();

    // const whitePawns = initialGame.pieces.filter(piece => piece.team === Team.White && piece.type === "pawn");
    // const blackPawns = initialGame.pieces.filter(piece => piece.team === Team.Black && piece.type === "pawn");

    // expect(whitePawns.length).toEqual(8);
    // expect(blackPawns.length).toEqual(8);
});

  it("should initialize with default values", () => {
    expect(chessGameLogic.currentPlayer).toEqual(Team.White);
    expect(chessGameLogic.winner).toBeNull();
  });

  it("should execute a valid move command", () => {
    const moveCommand: MoveCommand = {
      command: "move",
      pieceId: "white-pawn-1",
      source: new BoardLocation(1, 0),
      destination: new BoardLocation(3, 0),
    };
    const result = chessGameLogic.executeCommand(moveCommand);
    expect(result.success).toBeTruthy();
  });
  it("should handle invalid move commands", () => {
    const invalidMoveCommand: MoveCommand = {
      command: "move",
      pieceId: "invalid-piece-id",
      source: new BoardLocation(0, 0),
      destination: new BoardLocation(2, 0),
    };
    const result = chessGameLogic.executeCommand(invalidMoveCommand);
    expect(result.success).toBeFalsy();
  });
});
