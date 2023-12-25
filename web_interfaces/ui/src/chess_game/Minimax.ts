import { ChessGame } from "./ChessGame";
import { MoveCommand } from "./GameCommands";
import { GameState } from "./GameState";

const alphaBeta = async (
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeLimit: number,
  maximizingPlayer: boolean
): Promise<{ score: number; move: MoveCommand | null }> => {
  if (depth === 0 || ChessGame.isGameOver(gameState)) {
    return { score: ChessGame.evaluateBoard(gameState), move: null };
  }

  let bestScore = maximizingPlayer ? -Infinity : Infinity;
  let bestMove: MoveCommand | null = null;

  const moves = ChessGame.findLegalMoves(gameState, gameState.currentPlayer);

  for (const move of moves) {
    const newGameState = ChessGame.applyMoveCommand(move, gameState);

    const result = await alphaBeta(
      newGameState,
      depth - 1,
      alpha,
      beta,
      startTime,
      timeLimit,
      !maximizingPlayer
    );

    const score = result.score;

    if (maximizingPlayer) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }

    if (alpha >= beta) {
      break;
    }

    if (Date.now() - startTime >= timeLimit) {
      break;
    }
  }

  return { score: bestScore, move: bestMove };
};

const minimax = async (
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  timeLimit: number,
  maximizingPlayer: boolean
): Promise<number> => {
  const startTime = Date.now();
  let bestScore = maximizingPlayer ? -Infinity : Infinity;
  let bestMove: MoveCommand | null = null;

  for (let currentDepth = 1; currentDepth <= depth; currentDepth++) {
    const result = await alphaBeta(
      gameState,
      currentDepth,
      alpha,
      beta,
      startTime,
      timeLimit,
      maximizingPlayer
    );

    if (maximizingPlayer) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = result.move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = result.move;
        // log the score and move and depth
        console.log(
          `[Evaluation]Score: ${bestScore}`,
          `Move: ${bestMove?.source.toNotation()} ${bestMove?.destination.toNotation()}`,
          `Depth: ${currentDepth}`
        );
      }
      beta = Math.min(beta, bestScore);
    }

    if (Date.now() - startTime >= timeLimit) {
      break;
    }
  }

  return bestScore;
};

export const findBestMoveMinimax = async (
  gameState: GameState,
  depth: number
): Promise<MoveCommand> => {
  let bestMove: MoveCommand | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const legalMoves = ChessGame.findLegalMoves(
    gameState,
    gameState.currentPlayer
  );

  const promises: Promise<number>[] = [];

  for (const move of legalMoves) {
    const clonedState = gameState.clone();
    const updatedState = ChessGame.applyMoveCommand(move, clonedState);
    const promise = minimax(updatedState, depth, alpha, beta, 5, false);
    promises.push(promise);
  }

  const scores = await Promise.all(promises);

  for (let i = 0; i < legalMoves.length; i++) {
    const move = legalMoves[i];
    const score = scores[i];
    if (score < bestScore) {
      console.log(
        `[Evaluation]Score: ${score}`,
        `Move: ${
          move.command
        } ${move.source.toNotation()} ${move.destination.toNotation()}`
      );
      bestScore = score;
      bestMove = move;
    }
  }

  if (bestMove) {
    return bestMove;
  } else {
    const randomMove =
      legalMoves[Math.floor(Math.random() * legalMoves.length)];
    console.log("[Error] No best move found, returning random move");
    return randomMove;
  }
};
