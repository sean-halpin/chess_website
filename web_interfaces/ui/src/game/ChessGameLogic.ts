// ChessGameLogic.ts

import { fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import { MoveCommand } from "./GameCommand";
import {
  findLegalBishopMoves,
  findLegalCastleMoves,
  findLegalKingMoves,
  findLegalKnightMoves,
  findLegalPawnMoves,
  findLegalQueenMoves,
} from "./PieceLogic";

export enum Rank {
  Castle = "castle",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn",
}

export enum Team {
  White = "white",
  Black = "black",
}

type ExecuteResult<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export class ChessGameLogic {
  private gameState: ChessGame;
  private moveFunctions = {
    pawn: findLegalPawnMoves,
    castle: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

  public get currentPlayer(): string {
    return this.gameState.currentPlayer;
  }
  public get winner(): Team | "draw" | null {
    return this.gameState.winner;
  }
  public get pieces(): MaybeChessPiece[] {
    return this.gameState.board.flat();
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
    const [
      piecePlacement,
      activeColor,
      castlingAvailability,
      enPassant,
      halfmoveClock,
      fullmoveNumber,
    ] = fen.split(" ");

    const fenRows = piecePlacement.split("/");

    let index = 0;
    let pieces: MaybeChessPiece[] = [];
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
      Array(8).fill(null)
    );
    pieces.forEach((piece) => {
      if (piece) {
        initialBoard[piece.position.row][piece.position.col] = piece;
      }
    });

    const initialState: ChessGame = {
      board: initialBoard,
      currentPlayer: fenToTeam(activeColor),
      commands: [],
      counter: 0,
      displayText: "",
      winner: null,
    };
    return initialState;
  }

  executeCommand(cmd: MoveCommand): ExecuteResult<ChessGameLogic, string> {
    switch (cmd.command) {
      case "move":
        const clonedState = CopyGameState(this.gameState);
        const ownKingChecked = this.isKingInCheck(
          clonedState,
          clonedState.currentPlayer,
          cmd
        );
        let updatedState = !ownKingChecked
          ? this.applyMoveCommand(cmd, clonedState)
          : clonedState;

        this.gameState = { ...updatedState, counter: clonedState.counter + 1 };

        if (ownKingChecked) {
          console.warn("Invalid move: puts own king in check");
        } else {
          console.log(`[${ChessGameLogic.name}]`);
          console.log(this.gameState.board);
          return { success: true, data: this };
        }
        break;
      default:
        console.warn(`[${ChessGameLogic.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  }

  private attemptCommand = (
    cmd: MoveCommand,
    gameState: ChessGame
  ): CommandResult => {
    switch (cmd.command) {
      case "move":
        const moving_piece = gameState.board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);
        if (moving_piece) {
          if (gameState.currentPlayer !== moving_piece?.team || !moving_piece) {
            console.log("[Game] Team not in play");
            return null;
          }

          const moveFunction = this.moveFunctions[moving_piece.rank];
          if (moveFunction) {
            const moves = moveFunction(moving_piece, gameState);
            const chosenMove = moves.find((result) =>
              result.destination.isEqual(cmd.destination)
            );
            if (chosenMove) return chosenMove;
          }
        }
        break;
      default:
        break;
    }
    return null;
  };

  private applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: ChessGame
  ): ChessGame => {
    const clonedGameState = CopyGameState(gameState);
    const updatedBoard = clonedGameState.board;
    const cmdResult: CommandResult = this.attemptCommand(
      newCommand,
      clonedGameState
    );

    if (cmdResult) {
      const { takenPiece, movingPiece } = cmdResult;

      // Remove taken piece
      if (takenPiece) {
        updatedBoard[takenPiece.position.row][takenPiece.position.col] = null;
      }

      // Update moving piece
      if (movingPiece) {
        movingPiece.position = cmdResult.destination;
        movingPiece.firstMove = false;
        updatedBoard[newCommand.source.row][newCommand.source.col] = null;
        updatedBoard[movingPiece.position.row][movingPiece.position.col] =
          movingPiece;
      }

      // Push Latest Command Result
      clonedGameState.commands.push(cmdResult);

      // Return New GameState
      return {
        board: updatedBoard,
        currentPlayer:
          clonedGameState.currentPlayer === Team.White
            ? Team.Black
            : Team.White,
        commands: clonedGameState.commands,
        counter: clonedGameState.counter,
        displayText: clonedGameState.displayText,
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

    // Find the current player's king on the updated board
    const king = updatedGameState.board
      .flat()
      .find(
        (piece) => piece?.team === playerColor && piece?.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = playerColor === Team.White ? Team.Black : Team.White;
    const opponentPieces = updatedGameState.board
      .flat()
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

  getGameState(): ChessGame {
    return CopyGameState(this.gameState);
  }

  cpuMove(team: Team): ExecuteResult<ChessGameLogic, string> {
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

export class BoardLocation {
  constructor(public readonly row: number, public readonly col: number) {}

  isEqual(otherLocation: BoardLocation): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }
}

export interface IChessPiece {
  id: string;
  team: Team;
  rank: Rank;
  position: BoardLocation;
  firstMove?: boolean;
}

export class ChessPiece implements IChessPiece {
  constructor(
    public readonly id: string,
    public readonly team: Team,
    public readonly rank: Rank,
    public position: BoardLocation,
    public firstMove: boolean = true
  ) {}
}

export type MaybeChessPiece = ChessPiece | null;

export type ChessBoard = MaybeChessPiece[][];
interface IMoveResult {
  destination: BoardLocation;
  movingPiece: IChessPiece;
  takenPiece: MaybeChessPiece;
  enPassantPossible?: Boolean;
}
export class MoveResult implements IMoveResult {
  constructor(
    public destination: BoardLocation,
    public movingPiece: ChessPiece,
    public takenPiece: MaybeChessPiece,
    public enPassantPossible: Boolean
  ) {}
  toMoveCommand(): MoveCommand {
    return {
      command: "move",
      pieceId: this.movingPiece.id,
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }
}

export type CommandResult = MoveResult | null;

export interface ChessGame {
  board: ChessBoard;
  currentPlayer: Team.White | Team.Black;
  winner: Team | "draw" | null;
  commands: CommandResult[];
  counter: number;
  displayText: string;
}
export const CopyGameState = (state: ChessGame): ChessGame => {
  return JSON.parse(JSON.stringify(state));
};
export const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
export const isSquareEmpty = (r: number, c: number, b: ChessBoard) =>
  !isOOB(r, c) && b[r][c] == null;
export const squareEntry = (
  r: number,
  c: number,
  b: ChessBoard
): MaybeChessPiece => {
  if (!isOOB(r, c) && b[r][c] !== null) {
    return b[r][c];
  } else {
    return null;
  }
};
