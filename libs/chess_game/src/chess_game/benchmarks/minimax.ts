import { ChessGame } from "../ChessGame";
import { GameState } from "../GameState";
import { MoveCommand } from "../MoveCommand";
import { findBestMoveMinimax } from "../Minimax";
import { Team } from "../Team";

const TIME_LIMIT_MS = 5_000;
const MAX_DEPTH = 10;

const moveToNotation = (move: MoveCommand): string =>
  `${move.source.toNotation()}-${move.destination.toNotation()}`;

const benchmarkPosition = new ChessGame(
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
).gameState;

const originalGetChildren = GameState.prototype.getChildren;
let positionsExpanded = 0;
let legalMovesGenerated = 0;

GameState.prototype.getChildren = function (this: GameState): GameState[] {
  positionsExpanded += 1;
  const children = originalGetChildren.call(this);
  legalMovesGenerated += children.length;
  return children;
};

const run = async () => {
  const start = Date.now();

  try {
    const move = await findBestMoveMinimax(
      benchmarkPosition,
      Team.Black,
      MAX_DEPTH,
      TIME_LIMIT_MS
    );
    const elapsedMs = Date.now() - start;

    console.log("Minimax benchmark: Black after 1. e4");
    console.log(`Time limit: ${TIME_LIMIT_MS} ms`);
    console.log(`Elapsed: ${elapsedMs} ms`);
    console.log(`Selected move: ${moveToNotation(move)}`);
    console.log(`Positions expanded: ${positionsExpanded}`);
    console.log(`Legal moves generated: ${legalMovesGenerated}`);
  } finally {
    GameState.prototype.getChildren = originalGetChildren;
  }
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
