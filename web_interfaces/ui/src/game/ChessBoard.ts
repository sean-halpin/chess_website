import { Option } from "../types/Option";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";

export class ChessBoard {
  // #region Properties (1)

  private readonly _squares: ReadonlyArray<ReadonlyArray<Option<ChessPiece>>> =
    [];

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(squares: ReadonlyArray<ReadonlyArray<Option<ChessPiece>>>) {
    this._squares = squares;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (1)

  public get squares(): ReadonlyArray<ReadonlyArray<Option<ChessPiece>>> {
    return this._squares;
  }

  // #endregion Public Accessors (1)

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
  ): ChessBoard {
    const updatedSquares = this.squares.map((row, rowIndex) => {
      return row.map((piece, colIndex) => {
        if (rowIndex === location.row && colIndex === location.col) {
          return newPiece;
        } else {
          return piece;
        }
      });
    });

    if (newPiece.isSome()) {
      newPiece.unwrap().position = location;
    }
    return new ChessBoard(updatedSquares);
  }

  // #endregion Public Methods (3)
}
