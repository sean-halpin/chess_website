import { MoveCommand } from "./MoveCommand";
import { GameState, GameStatus } from "./GameState";
import { Loc } from "./Loc";
import { None } from "../rust_types/Option";

export const minimax = (
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
) => {
  if (depth === 0 || state.status !== GameStatus.InProgress) {
    return state.evaluate();
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const child of state.getChildren()) {
      const evaluation = minimax(child, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const child of state.getChildren()) {
      const evaluation = minimax(child, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
};

export const findBestMoveMinimax = async (
  gameState: GameState,
  depth: number,
  timeLimit: number
): Promise<MoveCommand> => {
  const start = Date.now();
  let bestMove = null;
  let bestValue = -Infinity;
  const children = gameState.getChildren();
  for (const child of children) {
    const value = minimax(child, depth, -Infinity, Infinity, false);
    if (value > bestValue) {
      bestValue = value;
      bestMove = child.commands[child.commands.length - 1][0];
    }
    if (Date.now() - start > timeLimit) {
      break;
    }
  }
  return (
    bestMove || {
      source: new Loc(0, 0),
      destination: new Loc(0, 0),
      promotionRank: None,
    }
  );
};
