// ChessGameLogic.ts

import { MoveCommand } from "./GameCommand";

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

export class ChessGameLogic {
  private gameState: GameState;

  constructor(fen?: string) {
    this.gameState = this.initializeGameState(fen);
  }

  private initializeGameState(fen?: string): GameState {
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

    const initialState: GameState = {
      board: initialBoard,
      currentPlayer: Team.White,
      commands: [],
      counter: 0,
      displayText: "",
      winner: null,
    };
    return initialState;
  }

  movePiece(fromSquare: string, toSquare: string): void {
    // Implement logic to move a chess piece from one square to another
    // Update the game state accordingly
    // Throw an error if the move is invalid
  }

  // You can add more methods for other chess game interactions

  getGameState(): GameState {
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

export interface GameState {
  board: ChessBoard;
  currentPlayer: Team.White | Team.Black;
  winner: Team.White | Team.Black | "draw" | null;
  commands: CommandResult[];
  counter: number;
  displayText: string;
}
export const CopyGameState = (state: GameState): GameState => {
  return JSON.parse(JSON.stringify(state));
};
