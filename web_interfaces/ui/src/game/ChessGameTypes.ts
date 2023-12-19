import { MoveCommand } from "./GameCommands";
import { Option } from "../types/Option";

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
