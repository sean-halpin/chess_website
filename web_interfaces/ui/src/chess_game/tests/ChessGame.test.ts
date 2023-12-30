// ChessGameLogic.test.ts

import { ChessGame } from "../ChessGame";
import { Team } from "../Team";
import { Rank } from "../Rank";
import { Loc } from "../Loc";
import { MoveCommand } from "../GameCommands";

describe("ChessGameLogic", () => {
  let chessGameLogic: ChessGame;

  beforeEach(() => {
    chessGameLogic = new ChessGame();
  });

  it("should initialize from a FEN string and winner is white", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(defaultFEN);
    const expected_dest = new Loc(6, 5);
    const cmd: MoveCommand = {
      command: "move",
      source: new Loc(4, 7),
      destination: expected_dest,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p) => p.rank === Rank.Queen && p.team === Team.White
    );
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.status).toEqual("Checkmate");
  });

  it("should initialize from a non default FEN string and update via move command", () => {
    const checkMateInOne =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(checkMateInOne);
    const expected_dest = new Loc(5, 7);
    const cmd: MoveCommand = {
      command: "move",
      source: new Loc(4, 7),
      destination: expected_dest,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p) => p.rank === Rank.Queen && p.team === Team.White
    );
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
  });

  it("should promote pawn to Queen", () => {
    const checkMateInOne = "3R4/2P2pkp/6n1/6p1/4p3/6P1/2Q4P/4K2R w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(checkMateInOne);
    const expected_dest = new Loc(7, 2);
    const cmd: MoveCommand = {
      command: "move",
      source: new Loc(6, 2),
      destination: expected_dest,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p) =>
        p.rank === Rank.Queen && p.id.includes("pawn") && p.team === Team.White
    );
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
  });

  it("should initialize from a default FEN string", () => {
    const defaultFEN =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.status).toBeNull();
  });

  it("should initialize from a non default FEN string", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.status).toBeNull();
  });

  it("should initialize with default values", () => {
    expect(chessGameLogic.currentPlayer).toEqual(Team.White);
    expect(chessGameLogic.status).toBeNull();
  });

  it("should execute a valid move command", () => {
    const moveCommand: MoveCommand = {
      command: "move",
      source: new Loc(1, 3),
      destination: new Loc(3, 3),
    };
    const result = chessGameLogic.executeCommand(moveCommand);
    expect(result.success).toBeTruthy();
  });

  it("should initialize from a FEN string move the king and assert queen side rook position", () => {
    const bothSideCastleInOneFen =
      "rn1qkbnr/1b6/pppppppp/8/4PP2/N1PPBN2/PP1QB1PP/R3K2R w KQkq - 2 10";
    const initialGame: ChessGame = new ChessGame(bothSideCastleInOneFen);
    const expected_king_loc = Loc.fromNotation("c1").unwrap();
    const expected_rook_loc = Loc.fromNotation("d1").unwrap();
    const cmd: MoveCommand = {
      command: "move",
      source: Loc.fromNotation("e1").unwrap(),
      destination: expected_king_loc,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const king = updatedState.pieces.find(
      (p) => p.rank === Rank.King && p.team === Team.White
    );
    const rook = updatedState.pieces.find(
      (p) =>
        p.rank === Rank.Rook &&
        p.team === Team.White &&
        p.position.isEqual(Loc.fromNotation("d1").unwrap())
    );
    expect(king?.position).toEqual(expected_king_loc);
    expect(rook?.position).toEqual(expected_rook_loc);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.status).toEqual(null);
  });


  it("should initialize from a FEN string move the king and assert king side rook position", () => {
    const bothSideCastleInOneFen =
      "rn1qkbnr/1b6/pppppppp/8/4PP2/N1PPBN2/PP1QB1PP/R3K2R w KQkq - 2 10";
    const initialGame: ChessGame = new ChessGame(bothSideCastleInOneFen);
    const expected_king_loc = Loc.fromNotation("g1").unwrap();
    const expected_rook_loc = Loc.fromNotation("f1").unwrap();
    const cmd: MoveCommand = {
      command: "move",
      source: Loc.fromNotation("e1").unwrap(),
      destination: expected_king_loc,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const king = updatedState.pieces.find(
      (p) => p.rank === Rank.King && p.team === Team.White
    );
    const rook = updatedState.pieces.find(
      (p) =>
        p.rank === Rank.Rook &&
        p.team === Team.White &&
        p.position.isEqual(Loc.fromNotation("f1").unwrap())
    );
    expect(king?.position).toEqual(expected_king_loc);
    expect(rook?.position).toEqual(expected_rook_loc);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.status).toEqual(null);
  });

  xit("should handle invalid move commands", () => {
    const invalidMoveCommand: MoveCommand = {
      command: "move",
      source: new Loc(5, 0),
      destination: new Loc(2, 0),
    };
    const result = chessGameLogic.executeCommand(invalidMoveCommand);
    expect(result.success).toBeFalsy();
  });
});
