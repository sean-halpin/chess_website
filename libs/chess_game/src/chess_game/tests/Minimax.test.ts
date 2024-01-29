import { findBestMoveMinimax } from "../Minimax";
import { Loc } from "../Loc";
import { None } from "../../rust_types/Option";
import { ChessGame } from "../ChessGame";

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
    const move = await findBestMoveMinimax(gameState, depth, timeLimit);

    // Assert the returned move
    expect(move.source).toEqual(Loc.fromNotation("d1").unwrap());
    expect(move.destination).toEqual(Loc.fromNotation("d8").unwrap());
    expect(move.promotionRank).toEqual(None);
  });
});
