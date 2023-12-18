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
  private gameState: ChessGame;
  private moveFunctions = {
    pawn: findLegalPawnMoves,
    rook: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

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
        // const ownKingChecked = this.isKingInCheck(
        //   clonedState,
        //   clonedState.currentPlayer,
        //   cmd
        // );
        // const enemyKingChecked = this.isKingInCheck(
        //   clonedState,
        //   clonedState.currentPlayer === Team.White ? Team.Black : Team.White,
        //   cmd
        // );
        // const noLegalFollowingMoves =
        //   this.findLegalMoves(
        //     clonedState,
        //     clonedState.currentPlayer === Team.White ? Team.Black : Team.White,
        //     cmd
        //   ).length === 0;
        // const checkMate = enemyKingChecked && noLegalFollowingMoves;
        // const draw = !enemyKingChecked && noLegalFollowingMoves;
        // let updatedState = !ownKingChecked
        //   ? this.applyMoveCommand(cmd, clonedState)
        //   : clonedState;

        let updatedState = this.applyMoveCommand(cmd, clonedState);

        // if (checkMate) {
        //   updatedState.winner = clonedState.currentPlayer;
        // } else if (draw) {
        //   console.log("draw");
        //   updatedState.winner = "Draw";
        // }
        this.gameState = {
          ...updatedState,
          counter: clonedState.counter + 1,
        };
        return { success: true, data: this };
      // if (ownKingChecked) {
      //   console.warn("Invalid move: puts own king in check");
      // } else {
      //   console.log(`[${ChessGameLogic.name}]`);
      //   console.log(this.gameState.board);
      //   return { success: true, data: this };
      // }
      default:
        console.warn(`[${ChessGameLogic.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  }

  getCurrentFen() {
    return gameToFEN(this.gameState);
  }

  private attemptCommand = (
    cmd: MoveCommand,
    gameState: ChessGame
  ): Option<MoveResult> => {
    switch (cmd.command) {
      case "move":
        const movingPiece = gameState.board
          .flat()
          .filter(isSome)
          .map(unwrap)
          .find((piece) => piece.id === cmd.pieceId) as ChessPiece;
        if (movingPiece) {
          if (gameState.currentPlayer !== movingPiece.team) {
            console.log("[Game] Team not in play");
            return None;
          }

          const moveFunction = this.moveFunctions[movingPiece.rank];
          if (moveFunction) {
            const moves = moveFunction(movingPiece, gameState);
            const chosenMove = moves.find((result) =>
              result.destination.isEqual(cmd.destination)
            );
            console.log(moves);
            if (chosenMove) return Some(chosenMove);
          }
        }
        break;
      default:
        break;
    }
    return None;
  };

  private applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: ChessGame
  ): ChessGame => {
    const clonedGameState = CopyGameState(gameState);
    console.log(clonedGameState);
    const updatedBoard = clonedGameState.board;
    const cmdResult: Option<MoveResult> = this.attemptCommand(
      newCommand,
      clonedGameState
    );

    if (isSome(cmdResult)) {
      const { destination, takenPiece, movingPiece } = unwrap(cmdResult);

      // Remove taken piece
      if (isSome(takenPiece)) {
        updatedBoard[unwrap(takenPiece).position.row][
          unwrap(takenPiece).position.col
        ] = None;
      }

      // Update moving piece
      if (movingPiece) {
        movingPiece.position = destination;
        movingPiece.firstMove = false;
        updatedBoard[newCommand.source.row][newCommand.source.col] = None;
        updatedBoard[movingPiece.position.row][movingPiece.position.col] =
          Some(movingPiece);
      }

      // Push Latest Command Result
      clonedGameState.commands.push(unwrap(cmdResult));

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

  private isKingInCheck = (
    gameState: ChessGame,
    playerColor: Team,
    moveCommand: MoveCommand
  ): boolean => {
    // Make a copy of the current game state
    const clonedGameState = CopyGameState(gameState);

    // Apply the move command to the copied game state
    const updatedGameState = this.applyMoveCommand(
      moveCommand,
      clonedGameState
    );

    // Find the player's king on the updated board
    const king = updatedGameState.board
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) => piece.team === playerColor && piece.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = playerColor === Team.White ? Team.Black : Team.White;
    const opponentPieces = updatedGameState.board
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece) => piece?.team === opponentColor)
      .map((piece) => piece as ChessPiece);

    for (const opponentPiece of opponentPieces) {
      const opponentMoves = this.moveFunctions[opponentPiece.rank](
        opponentPiece,
        updatedGameState
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
    team: Team,
    moveCommand: MoveCommand
  ): MoveCommand[] => {
    const legalMoves: MoveCommand[] = [];
    // Make a copy of the current game state
    const clonedState = CopyGameState(gameState);
    // Apply the move command to the copied game state
    const updatedGameState = this.applyMoveCommand(moveCommand, clonedState);

    const pieces = updatedGameState.board.flat().filter(isSome).map(unwrap);

    for (const piece of pieces) {
      const moves = this.moveFunctions[piece.rank](piece, updatedGameState);
      legalMoves.push(...moves.flat().map((m) => m.toMoveCommand()));
    }
    return legalMoves.filter((m) =>
      this.isKingInCheck(updatedGameState, team, m)
    );
  };

  getGameState(): ChessGame {
    return CopyGameState(this.gameState);
  }

  cpuMove(team: Team): Result<ChessGameLogic, string> {
    const clonedGameState = CopyGameState(this.gameState);
    let possibleMoves = [];
    const pieces = this.pieces.filter((p) => p !== null && p.team === team);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

    if (randomPiece) {
      possibleMoves = this.moveFunctions[randomPiece?.rank](
        randomPiece,
        clonedGameState
      );

      if (possibleMoves.length > 0) {
        const randomMove: MoveResult =
          possibleMoves.flat()[
            Math.floor(Math.random() * possibleMoves.flat().length)
          ];

        const moveCommand: MoveCommand = {
          command: "move",
          pieceId: randomPiece.id,
          source: new BoardLocation(
            randomPiece.position.row,
            randomPiece.position.col
          ),
          destination: new BoardLocation(
            randomMove.destination.row,
            randomMove.destination.col
          ),
        };

        return this.executeCommand(moveCommand);
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
  winner: Team | "Check" | "Checkmate" | "Draw" | null;
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
