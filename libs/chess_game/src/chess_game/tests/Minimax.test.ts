import { findBestMoveMinimax, MATE_SCORE, minimax } from "../Minimax";
import { Loc } from "../Loc";
import { None } from "../../rust_types/Option";
import { ChessGame } from "../ChessGame";
import { Team } from "../Team";
import { GameStatus } from "../GameState";

describe("findBestMoveMinimax", () => {
  it("should return the best move based on the minimax algorithm", async () => {
    // Initialize the game state from a FEN string
    const fen = "3qk3/8/8/8/8/8/8/3QK3 w - - 0 1 w";
    const game = new ChessGame(fen);
    const gameState = game.gameState.clone();

    // Set the depth and time limit
    const depth = 1;
    const timeLimit = 5000;

    // Call the findBestMoveMinimax method
    const move = await findBestMoveMinimax(
      gameState,
      Team.White,
      depth,
      timeLimit
    );

    // Assert the returned move
    expect(move.source).toEqual(Loc.fromNotation("d1").unwrap());
    expect(move.destination).toEqual(Loc.fromNotation("d8").unwrap());
    expect(move.promotionRank).toEqual(None);
  });

  it("minimizes White's evaluation when Black is to move", async () => {
    const game = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 b - - 0 1 b");

    const move = await findBestMoveMinimax(
      game.gameState,
      Team.Black,
      1,
      5000
    );

    expect(move.source).toEqual(Loc.fromNotation("d8").unwrap());
    expect(move.destination).toEqual(Loc.fromNotation("d1").unwrap());
  });

  it("keeps a legal fallback when the time limit expires before depth one", async () => {
    const game = new ChessGame("3qk3/8/8/8/8/8/8/3Q2K1 b - - 0 1 b");
    const firstLegalMove = game.gameState.getChildren()[0].commands[0].command;
    const now = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValue(1);

    try {
      const move = await findBestMoveMinimax(
        game.gameState,
        Team.Black,
        3,
        1
      );

      expect(move).toEqual(firstLegalMove);
    } finally {
      now.mockRestore();
    }
  });

  it("rejects a request for a team that is not to move", async () => {
    const game = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 0 1 w");

    await expect(
      findBestMoveMinimax(game.gameState, Team.Black, 1, 5000)
    ).rejects.toThrow("it is White's turn");
  });

  it("scores a checkmate against Black as a large White advantage", () => {
    const game = new ChessGame("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1 b");

    expect(minimax(game.gameState, 2, -Infinity, Infinity, true)).toBeGreaterThan(
      MATE_SCORE
    );
  });

  it("scores a checkmate against White as a large Black advantage", () => {
    const game = new ChessGame("7K/6q1/6k1/8/8/8/8/8 w - - 0 1 w");

    expect(minimax(game.gameState, 2, -Infinity, Infinity, false)).toBeLessThan(
      -MATE_SCORE
    );
  });

  it("scores stalemate as a draw", () => {
    const game = new ChessGame("7k/5Q2/7K/8/8/8/8/8 b - - 0 1 b");

    expect(minimax(game.gameState, 2, -Infinity, Infinity, false)).toBe(0);
  });

  it("continues searching a state marked as check", () => {
    const game = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 0 1 w");
    const checkedState = game.gameState.updateStatus(GameStatus.Check);

    expect(
      minimax(checkedState, 1, -Infinity, Infinity, true)
    ).toBeGreaterThan(checkedState.evaluate());
  });

  it("rejects a search with no legal moves", async () => {
    const game = new ChessGame("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1 b");

    await expect(
      findBestMoveMinimax(game.gameState, Team.Black, 1, 5000)
    ).rejects.toThrow("no legal moves available");
  });

  it("rejects a non-positive search depth", async () => {
    const game = new ChessGame("3qk3/8/8/8/8/8/8/3QK3 w - - 0 1 w");

    await expect(
      findBestMoveMinimax(game.gameState, Team.White, 0, 5000)
    ).rejects.toThrow("depth must be a positive integer");
  });
});
