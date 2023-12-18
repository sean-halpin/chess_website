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
    public readonly rank: Rank,
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
      pieceId: this.movingPiece.id,
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }
}
