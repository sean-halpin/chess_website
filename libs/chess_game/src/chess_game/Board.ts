import { Option } from "../rust_types/Option";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";

export class Board {
  // #region Properties (1)

  private readonly _squares: ReadonlyArray<ReadonlyArray<Option<ChessPiece>>> =
    [];

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(squares: ReadonlyArray<ReadonlyArray<Option<ChessPiece>>>) {
    this._squares = squares;
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (1)

  public get squares(): ReadonlyArray<ReadonlyArray<Option<ChessPiece>>> {
    return this._squares;
  }

  // #endregion Public Getters And Setters (1)

  // #region Public Static Methods (2)

  public static isLocOOB(location: Loc): boolean {
    return (
      location.row < 0 ||
      location.row > 7 ||
      location.col < 0 ||
      location.col > 7
    );
  }

  public static isRowColOOB(row: number, col: number): boolean {
    return row < 0 || row > 7 || col < 0 || col > 7;
  }

  // #endregion Public Static Methods (2)

  // #region Public Methods (3)

  public pieceFromLoc(location: Loc): Option<ChessPiece> {
    return this.squares[location.row][location.col];
  }

  public pieceFromRowCol(row: number, col: number): Option<ChessPiece> {
    return this.squares[row][col];
  }

  public updatePieceFromLoc(
    location: Loc,
    newPiece: Option<ChessPiece>
  ): Board {
    const updatedSquares = this.squares.map((row, rowIndex) => {
      return row.map((piece, colIndex) => {
        if (rowIndex === location.row && colIndex === location.col) {
          return newPiece;
        } else {
          return piece;
        }
      });
    });

    return new Board(updatedSquares);
  }

  // #endregion Public Methods (3)
}
