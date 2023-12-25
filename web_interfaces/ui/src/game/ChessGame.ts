// ChessGameLogic.ts

import { gameToFEN, fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import { MoveCommand } from "./GameCommands";
import {
  findLegalBishopMoves,
  findLegalCastleMoves,
  findLegalKingMoves,
  findLegalKnightMoves,
  findLegalPawnMoves,
  findLegalQueenMoves,
} from "./PieceLogic";
import { Result } from "../types/Result";
import { Rank, rankValue } from "./ChessGameTypes";
import { Team } from "./ChessGameTypes";
import { None, Some, isSome, unwrap, Option, isNone } from "../types/Option";
import { MoveResult } from "./ChessGameTypes";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";
import { ChessBoard } from "./ChessBoard";
import { GameState } from "./GameState";

export class ChessGame {
  // #region Properties (15)

  private alphaBeta = async (
    gameState: GameState,
    depth: number,
    alpha: number,
    beta: number,
    startTime: number,
    timeLimit: number,
    maximizingPlayer: boolean
  ): Promise<{ score: number; move: MoveCommand | null }> => {
    if (depth === 0 || this.isGameOver(gameState)) {
      return { score: this.evaluateBoard(gameState), move: null };
    }

    let bestScore = maximizingPlayer ? -Infinity : Infinity;
    let bestMove: MoveCommand | null = null;

    const moves = this.findLegalMoves(gameState, gameState.currentPlayer);

    for (const move of moves) {
      const newGameState = this.applyMoveCommand(move, gameState);

      const result = await this.alphaBeta(
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
  private applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: GameState
  ): GameState => {
    const clonedGameState = gameState.clone();
    let updatedBoard = clonedGameState.board;

    const movingPiece: ChessPiece = updatedBoard.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) =>
          piece.position.row === newCommand.source.row &&
          piece.position.col === newCommand.source.col
      ) as ChessPiece;
    const moveResult: MoveResult[] = this.moveFunctions[movingPiece.rank](
      movingPiece,
      clonedGameState
    ).filter(
      (move) =>
        move.destination.isEqual(newCommand.destination) &&
        move.movingPiece.position.row === newCommand.source.row &&
        move.movingPiece.position.col === newCommand.source.col
    );
    if (moveResult.length > 0) {
      const move = moveResult[0];
      // Remove taken piece
      if (isSome(move.takenPiece)) {
        updatedBoard = updatedBoard = updatedBoard.updatePieceFromLoc(
          move.takenPiece.unwrap().position,
          None
        );
      }
      // Update moving piece
      if (movingPiece) {
        // Handle Pawn Promotion to Queen by default
        if (
          movingPiece.rank === Rank.Pawn &&
          (move.destination.row === 0 || move.destination.row === 7)
        ) {
          movingPiece.rank = Rank.Queen;
        }
        // Handle Castle
        if (move.rookSrcDestCastling.isSome()) {
          const castlingRookSrcDest = move.rookSrcDestCastling.unwrap();
          const castlingRook = updatedBoard.pieceFromLoc(
            castlingRookSrcDest.src
          );
          updatedBoard = updatedBoard.updatePieceFromLoc(
            castlingRookSrcDest.src,
            None
          );
          updatedBoard = updatedBoard.updatePieceFromLoc(
            castlingRookSrcDest.dest,
            castlingRook
          );
        }
        movingPiece.position = move.destination;
        movingPiece.firstMove = false;
        updatedBoard = updatedBoard.updatePieceFromLoc(newCommand.source, None);
        updatedBoard = updatedBoard.updatePieceFromLoc(
          newCommand.destination,
          Some(movingPiece)
        );
      }

      // Push Latest Command Result
      clonedGameState.commands.push(move);

      return new GameState(
        updatedBoard,
        clonedGameState.currentPlayer === Team.White ? Team.Black : Team.White,
        clonedGameState.commands,
        clonedGameState.counter,
        null
      );
    }
    return clonedGameState;
  };
  private createPiece = (
    team: Team,
    position: Loc,
    rank: Rank,
    i: number
  ): ChessPiece => {
    return {
      id: `${team}-${rank}-${i}`,
      rank,
      team: team,
      position,
      firstMove: true,
    };
  };
  private evaluateBoard = (gameState: GameState): number => {
    let score = 0;
    const pieces = gameState.board.squares.flat().filter(isSome).map(unwrap);
    for (const piece of pieces) {
      if (piece.team === Team.White) {
        score += rankValue(piece.rank);
        if (this.isPieceInCenter(piece.position)) {
          score += 1; // Increase score for controlling the center
        }
      } else {
        score -= rankValue(piece.rank);
        if (this.isPieceInCenter(piece.position)) {
          score -= 1; // Decrease score for opponent controlling the center
        }
      }
    }
    return score;
  };
  private findLegalMoves = (
    gameState: GameState,
    team: Team
  ): MoveCommand[] => {
    const legalMoves: MoveCommand[] = [];
    // Make a copy of the current game state
    const clonedState = gameState.clone();
    // Apply the move command to the copied game state

    const pieces = clonedState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((p) => p.team === team);

    for (const piece of pieces) {
      const moves = this.moveFunctions[piece.rank](piece, clonedState);
      legalMoves.push(...moves.flat().map((m) => m.toMoveCommand()));
    }
    return legalMoves.filter(
      (move) =>
        !this.isKingInCheck(this.applyMoveCommand(move, clonedState), team)
    );
  };
  private gameState: GameState;
  private getBestMove = async (
    gameState: GameState,
    depth: number
  ): Promise<MoveCommand> => {
    let bestMove: MoveCommand | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    const alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;

    const legalMoves = this.findLegalMoves(gameState, gameState.currentPlayer);

    const promises: Promise<number>[] = [];

    for (const move of legalMoves) {
      const clonedState = gameState.clone();
      const updatedState = this.applyMoveCommand(move, clonedState);
      const promise = this.minimax(updatedState, depth, alpha, beta, 5, false);
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

    return bestMove!;
  };
  private initializeGameState = (
    fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ): GameState => {
    const [piecePlacement, activeColor] = fen.split(" ");

    const fenRows = piecePlacement.split("/");

    let index = 0;
    let pieces: ChessPiece[] = [];
    fenRows.forEach((row) => {
      row.split("").forEach((fenInstruction) => {
        if (!isNaN(Number(fenInstruction))) {
          index += Number(fenInstruction);
        } else {
          pieces.push(
            this.createPiece(
              fenPieceToTeam(fenInstruction),
              new Loc(7 - Math.floor(index / 8), index % 8),
              fenToRank(fenInstruction),
              index
            )
          );
          index += 1;
        }
      });
    });
    let initialBoard: ChessBoard = new ChessBoard(
      Array.from({ length: 8 }, () => Array(8).fill(None))
    );
    pieces.forEach((piece) => {
      initialBoard = initialBoard.updatePieceFromLoc(
        piece.position,
        Some(piece)
      );
    });

    const initialState: GameState = new GameState(
      initialBoard,
      fenToTeam(activeColor),
      [],
      0,
      null
    );
    return initialState;
  };
  private isGameOver = (gameState: GameState): boolean => {
    return gameState.winner === "Checkmate" || gameState.winner === "Draw";
  };
  private isKingInCheck = (gameState: GameState, team: Team): boolean => {
    // Make a copy of the current game state
    const clonedGameState = gameState.clone();

    // Find the player's king on the updated board
    const king = clonedGameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) => piece.team === team && piece.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = team === Team.White ? Team.Black : Team.White;
    const opponentPieces = clonedGameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece) => piece.team === opponentColor)
      .map((piece) => piece as ChessPiece);

    for (const opponentPiece of opponentPieces) {
      const opponentMoves = this.moveFunctions[opponentPiece.rank](
        opponentPiece,
        clonedGameState
      );

      for (const moveResult of opponentMoves) {
        if (moveResult.destination.isEqual(king.position)) {
          // The king is in check after the move
          return true;
        }
      }
    }

    // The king is not in check after the move
    return false;
  };
  private isPieceInCenter = (position: Loc): boolean => {
    return [3, 4].includes(position.col) && [3, 4].includes(position.row);
  };
  private minimax = async (
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
      const result = await this.alphaBeta(
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
  private moveFunctions = {
    pawn: findLegalPawnMoves,
    rook: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

  public executeCommand = (cmd: MoveCommand): Result<ChessGame, string> => {
    switch (cmd.command) {
      case "move":
        const clonedState = this.gameState.clone();
        const currentPlayer = clonedState.currentPlayer;
        const enemyPlayer =
          currentPlayer === Team.White ? Team.Black : Team.White;
        let updatedState = this.applyMoveCommand(cmd, clonedState);
        const ownKingChecked = this.isKingInCheck(updatedState, currentPlayer);
        if (ownKingChecked) {
          const err = "Invalid move: puts own king in check";
          console.warn(err);
          return { success: false, error: err };
        }
        const enemyKingChecked = this.isKingInCheck(updatedState, enemyPlayer);
        const noLegalFollowingMoves =
          this.findLegalMoves(updatedState, enemyPlayer).length === 0;
        const checkMate = enemyKingChecked && noLegalFollowingMoves;
        const draw = !enemyKingChecked && noLegalFollowingMoves;

        if (checkMate) {
          console.log("Checkmate");
          updatedState = updatedState.withWinner(
            `Checkmate, ${clonedState.currentPlayer as Team} wins`
          );
        } else if (draw) {
          console.log("Draw");
          updatedState = updatedState.withWinner("Draw");
        } else if (enemyKingChecked) {
          console.log("Check");
          updatedState = updatedState.withWinner("Check");
        }
        // Lastly update the game state from updatedState
        this.gameState = updatedState;

        return { success: true, data: this };
      default:
        console.warn(`[${ChessGame.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  };
  public getCurrentFen = () => {
    return gameToFEN(this.gameState);
  };

  // #endregion Properties (15)

  // #region Constructors (1)

  constructor(fen?: string) {
    this.gameState = this.initializeGameState(fen);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (3)

  public get currentPlayer(): string {
    return this.gameState.currentPlayer;
  }

  public get pieces(): ChessPiece[] {
    return this.gameState.board.squares.flat().filter(isSome).map(unwrap);
  }

  public get winner(): Team | "Check" | "Checkmate" | "Draw" | null {
    return this.gameState.winner;
  }

  // #endregion Public Accessors (3)

  // #region Public Methods (1)

  public async cpuMoveMinimax(team: Team): Promise<Result<ChessGame, string>> {
    const clonedGameState = this.gameState.clone();
    const possibleMoves = this.findLegalMoves(clonedGameState, team);

    if (possibleMoves.length > 0) {
      const bestMove = this.getBestMove(clonedGameState, 6);
      return this.executeCommand(await bestMove);
    } else {
      return { success: false, error: "No possible moves" };
    }
  }

  // #endregion Public Methods (1)

  // #region Private Methods (1)

  private cpuMove(team: Team): Result<ChessGame, string> {
    const clonedGameState = this.gameState.clone();
    let possibleMoves: MoveCommand[] = [];
    const pieces = this.pieces.filter((p) => p !== null && p.team === team);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

    if (randomPiece) {
      possibleMoves = this.findLegalMoves(clonedGameState, team);

      if (possibleMoves.length > 0) {
        const rankValueFromOption = (piece: Option<ChessPiece>) => {
          if (isSome(piece)) {
            return rankValue(unwrap(piece).rank);
          } else {
            return 0;
          }
        };
        const randomMove =
          possibleMoves.flat()[
            Math.floor(Math.random() * possibleMoves.flat().length)
          ];
        const maxMove: MoveCommand = possibleMoves.reduce((max, move) => {
          return rankValueFromOption(
            clonedGameState.board.pieceFromLoc(move.destination)
          ) >
            rankValueFromOption(
              clonedGameState.board.pieceFromLoc(max.destination)
            )
            ? move
            : max;
        }, randomMove);
        return this.executeCommand(maxMove);
      } else {
        return { success: false, error: "No possible moves" };
      }
    }
    return { success: false, error: "No pieces to move" };
  }

  // #endregion Private Methods (1)
}

export const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
export const isSquareEmpty = (r: number, c: number, b: ChessBoard) => {
  return !isOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};

export const isSquareEmptyLoc = (loc: Loc, b: ChessBoard) => {
  return isSquareEmpty(loc.row, loc.col, b);
};

export const isSquareEmptyNotation = (
  notation: string,
  b: ChessBoard
): boolean => {
  const c = notation.toLowerCase().charCodeAt(0) - 97; // Convert letter to column index (A=0, B=1, ...)
  const r = parseInt(notation.charAt(1)) - 1; // Convert number to row index (1=0, 2=1, ...)
  return !isOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};
export const squareEntry = (
  r: number,
  c: number,
  b: ChessBoard
): Option<ChessPiece> => {
  if (!isOOB(r, c)) {
    return b.pieceFromRowCol(r, c);
  } else {
    return None;
  }
};
