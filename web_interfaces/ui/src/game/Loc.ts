import { None, Option, Some } from "../types/Option";

export class Loc {
  // #region Constructors (1)

  constructor(readonly row: number, readonly col: number) {}

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

  // #region Public Methods (2)

  public isEqual(otherLocation: Loc): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }

  public toNotation(): string {
    const row = this.row + 1;
    const column = String.fromCharCode(this.col + 97);
    return `${column}${row}`;
  }

  // #endregion Public Methods (2)
}
