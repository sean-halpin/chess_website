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
): Promise<number> => {
    if (depth === 0 || ChessGame.isGameOver(gameState)) {
        return ChessGame.evaluateBoard(gameState);
    }

    let bestScore = maximizingPlayer ? -Infinity : Infinity;

    const moves = ChessGame.findLegalMoves(gameState, gameState.currentPlayer);

    for (const move of moves) {
        const newGameState = ChessGame.applyMoveCommand(move, gameState);

        const score = await alphaBeta(
            newGameState,
            depth - 1,
            alpha,
            beta,
            startTime,
            timeLimit,
            !maximizingPlayer
        );

        if (maximizingPlayer) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, bestScore);
        } else {
            bestScore = Math.min(bestScore, score);
            beta = Math.min(beta, bestScore);
        }

        if (alpha >= beta || Date.now() - startTime >= timeLimit) {
            break;
        }
    }

    return bestScore;
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

    for (let currentDepth = 1; currentDepth <= depth; currentDepth++) {
        const score = await alphaBeta(
            gameState,
            currentDepth,
            alpha,
            beta,
            startTime,
            timeLimit,
            maximizingPlayer
        );

        if (maximizingPlayer) {
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, bestScore);
        } else {
            bestScore = Math.min(bestScore, score);
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
    depth: number,
    timeLimit: number
): Promise<MoveCommand> => {
    let bestMove: MoveCommand | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    const alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;

    const legalMoves = ChessGame.findLegalMoves(
        gameState,
        gameState.currentPlayer
    );

    const scores = await Promise.all(
        legalMoves.map(async (move) => {
            const clonedState = gameState.clone();
            const updatedState = ChessGame.applyMoveCommand(move, clonedState);
            return minimax(updatedState, depth, alpha, beta, timeLimit, false);
        })
    );

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
