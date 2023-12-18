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
import { Rank } from "./ChessGameTypes";
import { Team } from "./ChessGameTypes";
import { None, Some, isSome, unwrap, Option, isNone } from "../types/Option";
import {
  BoardLocation,
  ChessPiece,
  ChessBoard,
  MoveResult,
} from "./ChessGameTypes";

export class ChessGameLogic {
  private moveFunctions = {
    pawn: findLegalPawnMoves,
    rook: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };
  private gameState: ChessGame;

  public get currentPlayer(): string {
    return this.gameState.currentPlayer;
  }
  public get winner(): Team | "Check" | "Checkmate" | "Draw" | null {
    return this.gameState.winner;
  }
  public get pieces(): ChessPiece[] {
    return this.gameState.board.flat().filter(isSome).map(unwrap);
  }

  constructor(fen?: string) {
    this.gameState = this.initializeGameState(fen);
  }

  private createPiece(
    team: Team,
    position: BoardLocation,
    rank: Rank,
    i: number
  ): ChessPiece {
    return {
      id: `${team}-${rank}-${i}`,
      rank,
      team: team,
      position,
      firstMove: true,
    };
  }

  private initializeGameState(
    fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ): ChessGame {
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
              new BoardLocation(7 - Math.floor(index / 8), index % 8),
              fenToRank(fenInstruction),
              index
            )
          );
          index += 1;
        }
      });
    });
    const initialBoard: ChessBoard = Array.from({ length: 8 }, () =>
      Array(8).fill(None)
    );
    pieces.forEach((piece) => {
      initialBoard[piece.position.row][piece.position.col] = Some(piece);
    });

    const initialState: ChessGame = {
      board: initialBoard,
      currentPlayer: fenToTeam(activeColor),
      commands: [],
      counter: 0,
      winner: null,
    };
    return initialState;
  }

  executeCommand(cmd: MoveCommand): Result<ChessGameLogic, string> {
    switch (cmd.command) {
      case "move":
        const clonedState = CopyGameState(this.gameState);
        const currentPlayer = clonedState.currentPlayer;
        const enemyPlayer =
          currentPlayer === Team.White ? Team.Black : Team.White;
        let updatedState;
        updatedState = this.applyMoveCommand(cmd, clonedState);
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
          updatedState = {
            ...updatedState,
            winner: `Checkmate, ${clonedState.currentPlayer as Team} wins`,
          };
        } else if (draw) {
          console.log("Draw");
          updatedState = { ...updatedState, winner: "Draw" };
        } else if (enemyKingChecked) {
          console.log("Check");
          updatedState = { ...updatedState, winner: "Check" };
        }
        // Lastly update the game state
        this.gameState = {
          ...updatedState,
          counter: clonedState.counter + 1,
        };

        return { success: true, data: this };
      default:
        console.warn(`[${ChessGameLogic.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  }

  getCurrentFen() {
    return gameToFEN(this.gameState);
  }

  private applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: ChessGame
  ): ChessGame => {
    const clonedGameState = CopyGameState(gameState);
    const updatedBoard = clonedGameState.board;

    const movingPiece: ChessPiece = updatedBoard
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find((piece) => piece.position.row === newCommand.source.row && piece.position.col === newCommand.source.col) as ChessPiece;
    console.log(movingPiece.id);
    const moveResult: MoveResult[] = this.moveFunctions[movingPiece.rank](
      movingPiece,
      clonedGameState
    ).filter(
      (move) =>
        move.destination.isEqual(newCommand.destination) &&
        move.movingPiece.position.row === newCommand.source.row && move.movingPiece.position.col === newCommand.source.col
    );
    if (moveResult.length > 0) {
      const move = moveResult[0];
      // Remove taken piece
      if (isSome(move.takenPiece)) {
        updatedBoard[unwrap(move.takenPiece).position.row][
          unwrap(move.takenPiece).position.col
        ] = None;
      }
      // Update moving piece
      if (movingPiece) {
        movingPiece.position = move.destination;
        movingPiece.firstMove = false;
        updatedBoard[newCommand.source.row][newCommand.source.col] = None;
        updatedBoard[move.destination.row][move.destination.col] =
          Some(movingPiece);
      }

      // Push Latest Command Result
      clonedGameState.commands.push(move);

      // Return New GameState
      return {
        board: updatedBoard,
        currentPlayer:
          clonedGameState.currentPlayer === Team.White
            ? Team.Black
            : Team.White,
        commands: clonedGameState.commands,
        counter: clonedGameState.counter,
        winner: null,
      };
    }
    return clonedGameState;
  };

  private isKingInCheck = (gameState: ChessGame, team: Team): boolean => {
    // Make a copy of the current game state
    const clonedGameState = CopyGameState(gameState);

    // Find the player's king on the updated board
    const king = clonedGameState.board
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) => piece.team === team && piece.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = team === Team.White ? Team.Black : Team.White;
    const opponentPieces = clonedGameState.board
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

  private findLegalMoves = (
    gameState: ChessGame,
    team: Team
  ): MoveCommand[] => {
    const legalMoves: MoveCommand[] = [];
    // Make a copy of the current game state
    const clonedState = CopyGameState(gameState);
    // Apply the move command to the copied game state

    const pieces = clonedState.board
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

  cpuMove(team: Team): Result<ChessGameLogic, string> {
    const clonedGameState = CopyGameState(this.gameState);
    let possibleMoves: MoveCommand[] = [];
    const pieces = this.pieces.filter((p) => p !== null && p.team === team);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

    if (randomPiece) {
      possibleMoves = this.findLegalMoves(clonedGameState, team);

      if (possibleMoves.length > 0) {
        const randomMove: MoveCommand =
          possibleMoves.flat()[
            Math.floor(Math.random() * possibleMoves.flat().length)
          ];

        return this.executeCommand(randomMove);
      } else {
        return { success: false, error: "No possible moves" };
      }
    }
    return { success: false, error: "No pieces to move" };
  }
}

export interface ChessGame {
  board: ChessBoard;
  currentPlayer: Team.White | Team.Black;
  winner: any;
  commands: MoveResult[];
  counter: number;
}
export const CopyGameState = (state: ChessGame): ChessGame => {
  return JSON.parse(JSON.stringify(state));
};
export const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
export const isSquareEmpty = (r: number, c: number, b: ChessBoard) => {
  return !isOOB(r, c) && isNone(b[r][c]);
};
export const squareEntry = (
  r: number,
  c: number,
  b: ChessBoard
): Option<ChessPiece> => {
  if (!isOOB(r, c)) {
    return b[r][c];
  } else {
    return None;
  }
};
