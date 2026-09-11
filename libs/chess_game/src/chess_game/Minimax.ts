import { MoveCommand } from "./MoveCommand";
import { GameState, GameStatus } from "./GameState";
import { Team } from "./Team";
import { ChessGame } from "./ChessGame";

export const MATE_SCORE = 1_000_000;

class SearchTimeoutError extends Error {
  constructor() {
    super("Minimax search timed out");
  }
}

const throwIfSearchTimedOut = (deadline: number) => {
  if (Date.now() >= deadline) {
    throw new SearchTimeoutError();
  }
};

const terminalEvaluation = (
  state: GameState,
  children: GameState[],
  depth: number
): number | undefined => {
  if (
    state.status === GameStatus.Draw ||
    state.status === GameStatus.Stalemate
  ) {
    return 0;
  }

  if (children.length > 0) {
    return undefined;
  }

  if (!ChessGame.isKingInCheck(state, state.currentPlayer)) {
    return 0;
  }

  return state.currentPlayer === Team.White
    ? -MATE_SCORE - depth
    : MATE_SCORE + depth;
};

export const minimax = (
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  deadline = Infinity
): number => {
  throwIfSearchTimedOut(deadline);
  const children = state.getChildren();
  const terminalScore = terminalEvaluation(state, children, depth);
  if (terminalScore !== undefined) {
    return terminalScore;
  }

  if (depth === 0) {
    return state.evaluate();
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const child of children) {
      throwIfSearchTimedOut(deadline);
      const evaluation = minimax(
        child,
        depth - 1,
        alpha,
        beta,
        false,
        deadline
      );
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const child of children) {
      throwIfSearchTimedOut(deadline);
      const evaluation = minimax(
        child,
        depth - 1,
        alpha,
        beta,
        true,
        deadline
      );
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
  team: Team,
  depth: number,
  timeLimit: number
): Promise<MoveCommand> => {
  if (team !== gameState.currentPlayer) {
    throw new Error(
      `Cannot find a minimax move for ${team}: it is ${gameState.currentPlayer}'s turn`
    );
  }

  if (!Number.isInteger(depth) || depth <= 0) {
    throw new Error("Minimax depth must be a positive integer");
  }

  const maximizingRoot = team === Team.White;
  const children = gameState.getChildren();
  if (children.length === 0) {
    throw new Error(`Cannot find a minimax move for ${team}: no legal moves available`);
  }

  const deadline = Date.now() + timeLimit;
  // A deadline that expires before depth one still returns a valid legal move.
  let bestMove = children[0].commands[children[0].commands.length - 1].command;

  for (let searchDepth = 1; searchDepth <= depth; searchDepth++) {
    let completedMove: MoveCommand | undefined;
    let bestValue = maximizingRoot ? -Infinity : Infinity;

    try {
      for (const child of children) {
        throwIfSearchTimedOut(deadline);
        const value = minimax(
          child,
          searchDepth - 1,
          -Infinity,
          Infinity,
          !maximizingRoot,
          deadline
        );
        if (
          (maximizingRoot && value > bestValue) ||
          (!maximizingRoot && value < bestValue)
        ) {
          bestValue = value;
          completedMove = child.commands[child.commands.length - 1].command;
        }
      }
    } catch (error) {
      if (error instanceof SearchTimeoutError) {
        break;
      }
      throw error;
    }

    if (completedMove !== undefined) {
      bestMove = completedMove;
    }
  }

  return bestMove;
};
