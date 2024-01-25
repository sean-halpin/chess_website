import { None, Option, Some } from "../rust_types/Option";

export class Loc {
  // #region Properties (2)

  public col: number;
  public row: number;

  // #endregion Properties (2)

  // #region Constructors (1)

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  // #endregion Constructors (1)

  // #region Public Static Methods (3)

  /**
   * Creates a Loc object from a chess notation string.
   *
   * @param notation - The chess notation string representing the location. e.g. a1, b2, c3, ...
   * @returns An Option<Loc> object representing the location if the notation is valid, otherwise None.
   */
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

  public static fromRowCol(row: number, col: number): Option<Loc> {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
      return None; // Invalid row or column
    }

    return Some(new Loc(row, col));
  }

  public static fromSAN(move: string): Option<Loc> {
    try {
      if (move.length === 2) {
        return this.fromNotation(move);
      } else {
        console.warn(`Invalid move: ${move}`);
        return None;
      }
    } catch (e) {
      console.warn(`Invalid move: ${move}`);
      return None;
    }
  }

  // #endregion Public Static Methods (3)

  // #region Public Methods (3)

  public isCentral(): boolean {
    return this.row >= 3 && this.row <= 4 && this.col >= 3 && this.col <= 4;
  }

  public isEqual(otherLocation: Loc): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }

  public toNotation(): string {
    const row = this.row + 1;
    const column = String.fromCharCode(this.col + 97);
    return `${column}${row}`;
  }

  // #endregion Public Methods (3)
}
