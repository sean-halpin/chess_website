// ChessGameLogic.test.ts

import { ChessGame } from "../ChessGame";
import { Team } from "../Team";
import { Rank } from "../Rank";
import { Loc } from "../Loc";
import { MoveCommand } from "../MoveCommand";
import { DrawReason, GameStatus } from "../GameState";
import { None, Some } from "../../rust_types/Option";

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
      source: new Loc(4, 7),
      destination: expected_dest,
      promotionRank: None,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p: { rank: Rank; team: Team }) =>
        p.rank === Rank.Queen && p.team === Team.White
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
      source: new Loc(4, 7),
      destination: expected_dest,
      promotionRank: None,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p: { rank: Rank; team: Team }) =>
        p.rank === Rank.Queen && p.team === Team.White
    );
    expect(q?.position).toEqual(expected_dest);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
  });

  it("should promote pawn to Queen", () => {
    const checkMateInOne = "3R4/2P2pkp/6n1/6p1/4p3/6P1/2Q4P/4K2R w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(checkMateInOne);
    const expected_dest = new Loc(7, 2);
    const cmd: MoveCommand = {
      source: new Loc(6, 2),
      destination: expected_dest,
      promotionRank: Some(Rank.Queen),
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const q = updatedState.pieces.find(
      (p: { rank: Rank; id: string | string[]; team: Team }) =>
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
    expect(initialGame.status).toBe(GameStatus.InProgress);
  });

  it("should initialize from a non default FEN string", () => {
    const defaultFEN =
      "rnbqkbnr/2pppppp/pp2P3/7Q/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1";
    const initialGame: ChessGame = new ChessGame(defaultFEN);

    expect(initialGame.currentPlayer).toEqual(Team.White);
    expect(initialGame.status).toBe(GameStatus.InProgress);
  });

  it("should initialize with default values", () => {
    expect(chessGameLogic.currentPlayer).toEqual(Team.White);
    expect(chessGameLogic.status).toBe(GameStatus.InProgress);
  });

  it("should execute a valid move command", () => {
    const moveCommand: MoveCommand = {
      source: new Loc(1, 3),
      destination: new Loc(3, 3),
      promotionRank: None,
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
      source: Loc.fromNotation("e1").unwrap(),
      destination: expected_king_loc,
      promotionRank: None,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const king = updatedState.pieces.find(
      (p: { rank: Rank; team: Team }) =>
        p.rank === Rank.King && p.team === Team.White
    );
    const rook = updatedState.pieces.find(
      (p: {
        rank: Rank;
        team: Team;
        position: { isEqual: (arg0: any) => any };
      }) =>
        p.rank === Rank.Rook &&
        p.team === Team.White &&
        p.position.isEqual(Loc.fromNotation("d1").unwrap())
    );
    expect(king?.position).toEqual(expected_king_loc);
    expect(rook?.position).toEqual(expected_rook_loc);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.status).toBe(GameStatus.InProgress);
  });

  it("should initialize from a FEN string move the king and assert king side rook position", () => {
    const bothSideCastleInOneFen =
      "rn1qkbnr/1b6/pppppppp/8/4PP2/N1PPBN2/PP1QB1PP/R3K2R w KQkq - 2 10";
    const initialGame: ChessGame = new ChessGame(bothSideCastleInOneFen);
    const expected_king_loc = Loc.fromNotation("g1").unwrap();
    const expected_rook_loc = Loc.fromNotation("f1").unwrap();
    const cmd: MoveCommand = {
      source: Loc.fromNotation("e1").unwrap(),
      destination: expected_king_loc,
      promotionRank: None,
    };
    const result = initialGame.executeCommand(cmd);
    const updatedState = result.success ? result.data : initialGame;
    const king = updatedState.pieces.find(
      (p: { rank: Rank; team: Team }) =>
        p.rank === Rank.King && p.team === Team.White
    );
    const rook = updatedState.pieces.find(
      (p: {
        rank: Rank;
        team: Team;
        position: { isEqual: (arg0: any) => any };
      }) =>
        p.rank === Rank.Rook &&
        p.team === Team.White &&
        p.position.isEqual(Loc.fromNotation("f1").unwrap())
    );
    expect(king?.position).toEqual(expected_king_loc);
    expect(rook?.position).toEqual(expected_rook_loc);
    expect(updatedState.currentPlayer).toEqual(Team.Black);
    expect(updatedState.status).toBe(GameStatus.InProgress);
  });

  it("should handle invalid move commands", () => {
    const invalidMoveCommand: MoveCommand = {
      source: new Loc(5, 0),
      destination: new Loc(2, 0),
      promotionRank: None,
    };
    const result = chessGameLogic.executeCommand(invalidMoveCommand);
    expect(result.success).toBeFalsy();
    expect(result.isOk()).toBeFalsy();
    expect(result.isError()).toBeTruthy();
    expect(result.error).toEqual("Invalid move: no piece at source");
  });

  it("should handle only allow current team to move", () => {
    const invalidMoveCommand: MoveCommand = {
      source: Loc.fromNotation("e7").unwrap(),
      destination: Loc.fromNotation("e6").unwrap(),
      promotionRank: None,
    };
    const result = chessGameLogic.executeCommand(invalidMoveCommand);
    expect(result.success).toBeFalsy();
    expect(result.isOk()).toBeFalsy();
    expect(result.isError()).toBeTruthy();
    expect(result.error).toEqual("Invalid move: not current player's piece");
  });

  it("reuses generated move results without changing child states", () => {
    const enPassantState = [
      ["e2", "e4"],
      ["a7", "a6"],
      ["e4", "e5"],
      ["d7", "d5"],
    ].reduce(
      (state, [source, destination]) =>
        ChessGame.applyMoveCommand(
          new MoveCommand(
            Loc.fromNotation(source).unwrap(),
            Loc.fromNotation(destination).unwrap()
          ),
          state
        ),
      new ChessGame().gameState
    );
    const states = [
      new ChessGame().gameState,
      new ChessGame("3qk3/8/8/8/8/8/8/3Q2K1 b - - 0 1").gameState,
      new ChessGame("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1").gameState,
      enPassantState,
      new ChessGame("7k/2P5/8/8/8/8/8/K7 w - - 0 1").gameState,
    ];

    for (const state of states) {
      const legalMoves = ChessGame.findLegalMoves(state, state.currentPlayer);
      const optimizedChildren = state.getChildren();

      expect(optimizedChildren).toHaveLength(legalMoves.length);
      legalMoves.forEach((move, index) => {
        const commandOnlyChild = ChessGame.applyMoveCommand(
          move.command,
          state
        );
        const generatedResultChild = ChessGame.applyMoveCommand(
          move.command,
          state,
          move.result
        );

        expect(generatedResultChild).toEqual(commandOnlyChild);
        expect(optimizedChildren[index]).toEqual(commandOnlyChild);
      });
    }
  });

  it("rejects illegal destinations, king captures, and moves after game end", () => {
    const game = new ChessGame();
    expect(
      game.executeCommand(
        new MoveCommand(
          Loc.fromNotation("e2").unwrap(),
          Loc.fromNotation("e5").unwrap()
        )
      ).isError()
    ).toBe(true);

    const kingCapture = new ChessGame("4k3/8/8/8/8/8/8/4Q1K1 w - - 0 1");
    expect(
      kingCapture.executeCommand(
        new MoveCommand(
          Loc.fromNotation("e1").unwrap(),
          Loc.fromNotation("e8").unwrap()
        )
      ).isError()
    ).toBe(true);

    const checkmate = new ChessGame("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1");
    expect(checkmate.status).toBe(GameStatus.Checkmate);
    expect(
      checkmate.executeCommand(
        new MoveCommand(
          Loc.fromNotation("h8").unwrap(),
          Loc.fromNotation("h7").unwrap()
        )
      ).isError()
    ).toBe(true);
  });

  it("enforces FEN castling rights and castle-square safety", () => {
    const destinationsForKing = (fen: string) =>
      ChessGame.findLegalMoves(new ChessGame(fen).gameState, Team.White)
        .filter((move) => move.command.source.isEqual(Loc.fromNotation("e1").unwrap()))
        .map((move) => move.command.destination.toNotation());

    expect(
      destinationsForKing("r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1")
    ).not.toEqual(expect.arrayContaining(["c1", "g1"]));
    expect(
      destinationsForKing("r3k2r/8/8/8/8/8/4r3/R3K2R w KQkq - 0 1")
    ).not.toEqual(expect.arrayContaining(["c1", "g1"]));
    expect(
      destinationsForKing("r3kr1r/8/8/8/8/8/8/R3K2R w KQkq - 0 1")
    ).not.toContain("g1");
  });

  it("round-trips FEN state and updates rights, en-passant, and counters", () => {
    const fen = "r3k2r/8/8/3pP3/8/8/8/R3K2R w KQkq d6 17 42";
    expect(new ChessGame(fen).getCurrentFen()).toBe(fen);
    expect(() => new ChessGame("invalid")).toThrow("Invalid FEN");
    expect(() => new ChessGame("8/8/8/8/8/8/8/8 w - - 0 1")).toThrow(
      "exactly one king"
    );

    const game = new ChessGame();
    game.executeCommand(
      new MoveCommand(
        Loc.fromNotation("e2").unwrap(),
        Loc.fromNotation("e4").unwrap()
      )
    );
    expect(game.gameState.enPassantTarget.unwrap().toNotation()).toBe("e3");
    expect(game.gameState.halfmoveClock).toBe(0);
    expect(game.gameState.fullmoveNumber).toBe(1);

    game.executeCommand(
      new MoveCommand(
        Loc.fromNotation("a7").unwrap(),
        Loc.fromNotation("a6").unwrap()
      )
    );
    expect(game.gameState.enPassantTarget.isNone()).toBe(true);
    expect(game.gameState.fullmoveNumber).toBe(2);

    const rookCapture = new ChessGame("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    rookCapture.executeCommand(
      new MoveCommand(
        Loc.fromNotation("a1").unwrap(),
        Loc.fromNotation("a8").unwrap()
      )
    );
    expect(rookCapture.gameState.castlingRights.blackQueenSide).toBe(false);
    expect(rookCapture.gameState.castlingRights.whiteQueenSide).toBe(false);

    const castle = new ChessGame("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    castle.executeCommand(
      new MoveCommand(
        Loc.fromNotation("e1").unwrap(),
        Loc.fromNotation("g1").unwrap()
      )
    );
    expect(castle.gameState.castlingRights.whiteKingSide).toBe(false);
    expect(castle.gameState.castlingRights.whiteQueenSide).toBe(false);
  });

  it("requires a promotion choice and generates all four promotion variants", () => {
    const game = new ChessGame("7k/2P5/8/8/8/8/8/K7 w - - 0 1");
    const source = Loc.fromNotation("c7").unwrap();
    const destination = Loc.fromNotation("c8").unwrap();
    const promotions = ChessGame.findLegalMoves(game.gameState, Team.White)
      .filter(({ command }) => command.source.isEqual(source) && command.destination.isEqual(destination))
      .map(({ command }) => command.promotionRank.unwrap());
    expect(promotions).toEqual([Rank.Queen, Rank.Rook, Rank.Bishop, Rank.Knight]);
    expect(game.executeCommand(new MoveCommand(source, destination)).isError()).toBe(true);
    expect(game.executeCommand(new MoveCommand(source, destination, Some(Rank.Knight))).isOk()).toBe(true);
    expect(game.pieces.find((piece) => piece.position.isEqual(destination))?.rank).toBe(Rank.Knight);
  });

  it("uses only legally available en-passant rights in repetition identity", () => {
    const noCapture = new ChessGame("4k3/8/8/8/8/8/8/4K3 w - e6 0 1");
    const noTarget = new ChessGame("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(ChessGame.positionKey(noCapture.gameState)).toBe(ChessGame.positionKey(noTarget.gameState));
    const capture = new ChessGame("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    const withoutCapture = new ChessGame("4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1");
    expect(ChessGame.positionKey(capture.gameState)).not.toBe(ChessGame.positionKey(withoutCapture.gameState));
  });

  it("supports claimable and automatic repetition draws", () => {
    const cycle = [
      ["g1", "f3"], ["g8", "f6"], ["f3", "g1"], ["f6", "g8"],
    ];
    const game = new ChessGame();
    for (let repetition = 0; repetition < 2; repetition++) {
      for (const [source, destination] of cycle) {
        expect(game.executeCommand(new MoveCommand(Loc.fromNotation(source).unwrap(), Loc.fromNotation(destination).unwrap())).isOk()).toBe(true);
      }
    }
    expect(game.canClaimDraw()).toBe(DrawReason.ThreefoldRepetition);
    expect(game.claimDraw().isOk()).toBe(true);
    expect(game.gameState.drawReason).toBe(DrawReason.ThreefoldRepetition);

    const fivefold = new ChessGame();
    for (let repetition = 0; repetition < 4; repetition++) {
      for (const [source, destination] of cycle) {
        fivefold.executeCommand(new MoveCommand(Loc.fromNotation(source).unwrap(), Loc.fromNotation(destination).unwrap()));
      }
    }
    expect(fivefold.gameState.drawReason).toBe(DrawReason.FivefoldRepetition);
  });

  it("handles FIDE fifty and seventy-five move thresholds plus insufficient material", () => {
    const claimable = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 100 1");
    expect(claimable.canClaimDraw()).toBe(DrawReason.FiftyMoveRule);
    const intendedMove = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 99 1");
    const intendedCommand = new MoveCommand(Loc.fromNotation("d1").unwrap(), Loc.fromNotation("d2").unwrap());
    const originalFen = intendedMove.getCurrentFen();
    expect(intendedMove.canClaimDraw(intendedCommand)).toBe(DrawReason.FiftyMoveRule);
    expect(intendedMove.claimDraw(intendedCommand).isOk()).toBe(true);
    expect(intendedMove.getCurrentFen()).toBe(originalFen);
    const automatic = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 149 1");
    expect(automatic.executeCommand(new MoveCommand(Loc.fromNotation("d1").unwrap(), Loc.fromNotation("d2").unwrap())).isOk()).toBe(true);
    expect(automatic.gameState.drawReason).toBe(DrawReason.SeventyFiveMoveRule);
    const bareKings = new ChessGame("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(bareKings.gameState.drawReason).toBe(DrawReason.InsufficientMaterial);
  });
});
