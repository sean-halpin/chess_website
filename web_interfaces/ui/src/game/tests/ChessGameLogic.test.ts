// ChessGameLogic.test.ts

import { ChessGameLogic } from "../ChessGameLogic";
import { BoardLocation, Team } from "../ChessGameTypes";
import { MoveCommand } from "../GameCommands";

describe("ChessGameLogic", () => {
  let chessGameLogic: ChessGameLogic;

  beforeEach(() => {
    chessGameLogic = new ChessGameLogic();
  });

  it("should initialize from a FEN string and winner is white", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGameLogic = new ChessGameLogic(defaultFEN);
    const expected_dest = new BoardLocation(6, 5);
    const cmd: MoveCommand = {
      command: "move",
      pieceId: "white-queen",
      source: new BoardLocation(4, 7),
      destination: expected_dest,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find((p) => p.id === "white-queen");
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.winner).toEqual("Checkmate, white wins");
  });

  it("should initialize from a non default FEN string and update via move command", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGameLogic = new ChessGameLogic(defaultFEN);
    const expected_dest = new BoardLocation(5, 7);
    const cmd: MoveCommand = {
      command: "move",
      pieceId: "white-queen",
      source: new BoardLocation(4, 7),
      destination: expected_dest,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find((p) => p.id === "white-queen");
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
  });

  it("should initialize from a default FEN string", () => {
    const defaultFEN =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const initialGame: ChessGameLogic = new ChessGameLogic(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.winner).toBeNull();
  });

  it("should initialize from a non default FEN string", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGameLogic = new ChessGameLogic(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.winner).toBeNull();
  });

  it("should initialize with default values", () => {
    expect(chessGameLogic.currentPlayer).toEqual(Team.White);
    expect(chessGameLogic.winner).toBeNull();
  });

  it("should execute a valid move command", () => {
    const moveCommand: MoveCommand = {
      command: "move",
      pieceId: "white-pawn-51",
      source: new BoardLocation(1, 3),
      destination: new BoardLocation(3, 3),
    };
    const result = chessGameLogic.executeCommand(moveCommand);
    expect(result.success).toBeTruthy();
  });
  xit("should handle invalid move commands", () => {
    const invalidMoveCommand: MoveCommand = {
      command: "move",
      pieceId: "white-pawn-51",
      source: new BoardLocation(5, 0),
      destination: new BoardLocation(2, 0),
    };
    const result = chessGameLogic.executeCommand(invalidMoveCommand);
    expect(result.success).toBeFalsy();
  });
});
