import { MoveCommand } from "./GameCommands";
import { None, Option, Some } from "../types/Option";

export enum Rank {
  Rook = "rook",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn",
}

// function that takes a rank and returns the value of the rank
export function rankValue(rank: Rank): number {
  switch (rank) {
    case Rank.Pawn:
      return 1;
    case Rank.Knight:
    case Rank.Bishop:
      return 3;
    case Rank.Rook:
      return 5;
    case Rank.Queen:
      return 9;
    case Rank.King:
      return 100;
  }
}

export enum Team {
  White = "white",
  Black = "black",
}
export class BoardLocation {
  constructor(public readonly row: number, public readonly col: number) {}
  static fromNotation(notation: string): Option<BoardLocation> {
    const column = notation.charCodeAt(0) - 65; // Convert letter to column index (A=0, B=1, ...)
    const row = parseInt(notation.charAt(1)) - 1; // Convert number to row index (1=0, 2=1, ...)

    if (
      isNaN(row) ||
      isNaN(column) ||
      row < 0 ||
      row > 7 ||
      column < 0 ||
      column > 7
    ) {
      return None; // Invalid notation
    }

    return Some(new BoardLocation(row, column));
  }

  isEqual(otherLocation: BoardLocation): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }
}

export class ChessPiece {
  constructor(
    public readonly id: string,
    public readonly team: Team,
    public rank: Rank,
    public position: BoardLocation,
    public firstMove: boolean = true
  ) {}
}

export type ChessBoard = Option<ChessPiece>[][];
interface IMoveResult {
  destination: BoardLocation;
  movingPiece: ChessPiece;
  takenPiece: Option<ChessPiece>;
  enPassantPossible?: Boolean;
}
export class MoveResult implements IMoveResult {
  constructor(
    public destination: BoardLocation,
    public movingPiece: ChessPiece,
    public takenPiece: Option<ChessPiece>,
    public enPassantPossible: Boolean
  ) {}
  toMoveCommand(): MoveCommand {
    return {
      command: "move",
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }
}
