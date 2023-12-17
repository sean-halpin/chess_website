// ChessGameLogic.ts

import { GameCommand, MoveCommand } from "./GameCommand";
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

  private initializeGameState(fen?: string): ChessGame {
    const createPiece = (
      team: Team,
      position: BoardLocation,
      rank: Rank,
      i: number
    ): ChessPiece => ({
      id: `${team}-${rank}-${i}`,
      rank,
      team: team,
      position,
      firstMove: true,
    });

    const createPiecesOrder = (): Rank[] => [
      Rank.Castle,
      Rank.Knight,
      Rank.Bishop,
      Rank.Pawn,
      Rank.Pawn,
      Rank.Bishop,
      Rank.Knight,
      Rank.Castle,
    ];

    const createPawns = (): MaybeChessPiece[] =>
      Array.from({ length: 16 }, (_, column) =>
        createPiece(
          column < 8 ? Team.White : Team.Black,
          new BoardLocation(column < 8 ? 1 : 6, column % 8),
          Rank.Pawn,
          column % 8
        )
      );

    const createPieces = (team: Team, row: number): MaybeChessPiece[] =>
      Array.from({ length: 8 }, (_, column) =>
        createPiece(
          team,
          new BoardLocation(row, column),
          column === 3
            ? Rank.Queen
            : column === 4
            ? Rank.King
            : createPiecesOrder()[column],
          column
        )
      );

    const placeBackRow = (): MaybeChessPiece[] => [
      ...createPieces(Team.White, 0),
      ...createPieces(Team.Black, 7),
    ];

    const pieces: MaybeChessPiece[] = [...createPawns(), ...placeBackRow()];
    const initialBoard: ChessBoard = Array.from({ length: 8 }, () =>
      Array(8).fill(null)
    );
    pieces.forEach((p) => {
      if (p) {
        initialBoard[p.position.row][p.position.col] = p;
      }
    });

    const initialState: ChessGame = {
      board: initialBoard,
      currentPlayer: Team.White,
      commands: [],
      counter: 0,
      displayText: "",
      winner: null,
    };
    return initialState;
  }

  executeCommand(cmd: GameCommand): ExecuteResult<ChessGameLogic, string> {
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
          return { success: true, data: this };
        }
        break;
      case "resign":
        break;
      default:
        console.warn(`[${ChessGameLogic.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  }

  attemptCommand = (cmd: GameCommand, gameState: ChessGame): CommandResult => {
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

      case "resign":
        break;

      default:
        break;
    }
    return null;
  };

  applyMoveCommand = (
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

  isKingInCheck = (
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

  movePiece(
    fromSquare: string,
    toSquare: string
  ): ExecuteResult<string, string> {
    return { success: true, data: "" };
  }

  getGameState(): ChessGame {
    return this.gameState;
  }
}

export class BoardLocation implements ILocation {
  constructor(public readonly row: number, public readonly col: number) {}

  isEqual(otherLocation: ILocation): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }
}

export interface ILocation {
  readonly row: number;
  readonly col: number;
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
