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
export class Loc {
  // #region Constructors (1)

  constructor(public readonly row: number, public readonly col: number) {}

  // #endregion Constructors (1)

  // #region Public Static Methods (1)

  public static fromNotation(notation: string): Option<Loc> {
    const column = notation.charCodeAt(0) - 97; // Convert letter to column index (A=0, B=1, ...)
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

    return Some(new Loc(row, column));
  }

  // #endregion Public Static Methods (1)

  // #region Public Methods (1)

  public isEqual(otherLocation: Loc): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }

  // #endregion Public Methods (1)
}

export class ChessPiece {
  // #region Constructors (1)

  constructor(
    public readonly id: string,
    public readonly team: Team,
    public rank: Rank,
    public position: Loc,
    public firstMove: boolean = true
  ) {}

  // #endregion Constructors (1)
}

// export type ChessBoard = Option<ChessPiece>[][];

export class ChessBoard {
  private _pieces: Option<ChessPiece>[][] = [];
  constructor(pieces: Option<ChessPiece>[][]) {
    this._pieces = pieces;
  }
  public get pieces(): Option<ChessPiece>[][] {
    return this._pieces;
  }
  public set pieces(value: Option<ChessPiece>[][]) {
    this._pieces = value;
  }
  public pieceFromLoc(location: Loc): Option<ChessPiece> {
    return this.pieces[location.row][location.col];
  }
  public updatePieceFromLoc(location: Loc, newPiece: Option<ChessPiece>) {
    if (newPiece.isSome()) {
      newPiece.unwrap().position = location;
    }
    this.pieces[location.row][location.col] = newPiece;
  }
  public pieceFromRowCol(row: number, col: number): Option<ChessPiece> {
    return this.pieces[row][col];
  }
  public updatePieceFromRowCol(
    row: number,
    col: number,
    newPiece: Option<ChessPiece>
  ) {
    if (newPiece.isSome()) {
      newPiece.unwrap().position = new Loc(row, col);
    }
    this.pieces[row][col] = newPiece;
  }
  public clone(): ChessBoard {
    return new ChessBoard(this._pieces.map((row) => [...row]));
  }
}

interface IMoveResult {
  // #region Properties (4)

  destination: Loc;
  enPassantPossible?: Boolean;
  movingPiece: ChessPiece;
  takenPiece: Option<ChessPiece>;

  // #endregion Properties (4)
}
export class MoveResult implements IMoveResult {
  // #region Constructors (1)

  constructor(
    public destination: Loc,
    public movingPiece: ChessPiece,
    public takenPiece: Option<ChessPiece>,
    public enPassantPossible: boolean = false,
    public kingLocationsMustNotBeInCheck: Option<Loc[]> = None,
    public rookSrcDestCastling: Option<{ src: Loc; dest: Loc }> = None
  ) {}

  // #endregion Constructors (1)

  // #region Public Methods (1)

  public toMoveCommand(): MoveCommand {
    return {
      command: "move",
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }

  // #endregion Public Methods (1)
}
