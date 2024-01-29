import { None, Option, Some } from "../rust_types/Option";
import { Rank, rankFromAlgebraic } from "./Rank";
import { StandardAlgebraicNotationMove } from "./StandardAlgebraicNotationMove";

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

  // #region Public Static Methods (5)

  public static columnFromNotation(col: string): Option<number> {
    const column = col.charCodeAt(0) - 97; // Convert letter to column index (A=0, B=1, ...)
    if (isNaN(column) || column < 0 || column > 7) {
      return None; // Invalid notation
    }
    return Some(column);
  }

  /**
   * Creates a Loc object from a chess notation string.
   *
   * @param notation - The chess notation string representing the location. e.g. a1, b2, c3, ...
   * @returns An Option<Loc> object representing the location if the notation is valid, otherwise None.
   */
  public static fromNotation(notation: string): Option<Loc> {
    const column = this.columnFromNotation(notation.charAt(0)); // Convert letter to column index (A=0, B=1, ...)
    const row = this.rowFromNotation(notation.charAt(1)); // Convert number to row index (1=0, 2=1, ...)
    if (column.isNone() || row.isNone()) {
      return None; // Invalid notation
    }

    return Some(new Loc(row.unwrap(), column.unwrap()));
  }

  public static fromRowCol(row: number, col: number): Option<Loc> {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
      return None; // Invalid row or column
    }

    return Some(new Loc(row, col));
  }

  public static fromSAN(move: string): Option<StandardAlgebraicNotationMove> {
    try {
      console.log("fromSAN", move);
      if (move === "O-O" || move === "O-O-O") {
        if (move === "O-O") {
          // prettier-ignore
          return Some(StandardAlgebraicNotationMove.create(None, None, Some(true), None, None, None, None));
        } else if (move === "O-O-O") {
          // prettier-ignore
          return Some(StandardAlgebraicNotationMove.create(None, None, None, Some(true), None, None, None));
        } else {
          console.warn(`Invalid move: ${move}`);
          return None;
        }
      } else if (move.length === 2) {
        const locOption = this.fromNotation(move);
        if (locOption.isNone()) {
          return None;
        }
        // prettier-ignore
        return Some(StandardAlgebraicNotationMove.create(locOption, None, None, None, None, None, None));
      } else if (move.length >= 3) {
        const loc = this.fromNotation(
          move.substring(move.length - 2, move.length)
        );
        const lhs = move.substring(0, move.length - 2);
        const collect = <T>(options: Option<T>[]) => {
          const results: T[] = [];
          options.forEach((option) => {
            if (option.isSome()) {
              results.push(option.unwrap());
            }
          });
          return results;
        };
        // prettier-ignore
        const maybePieceRank: Rank[] = collect(lhs.split("").map((c) => { return rankFromAlgebraic(c) }));
        // prettier-ignore
        const maybeTakesPiece: boolean[] = collect(lhs.split("").map((c) => { return c === "x" ? Some(true) : None}));
        // prettier-ignore
        const maybeSourceColumn: number[] = collect(lhs.split("").map((c) => { return this.columnFromNotation(c) }));
        // prettier-ignore
        const maybeSourceRow: number[] = collect(lhs.split("").map((c) => { return this.rowFromNotation(c) }));
        if (loc.isNone()) {
          console.warn(`Invalid move: ${move} ${move.length}`);
          return None;
        }
        return Some(
          StandardAlgebraicNotationMove.create(
            loc,
            maybePieceRank.length > 0 ? Some(maybePieceRank[0]) : None,
            None,
            None,
            maybeTakesPiece.length > 0 ? Some(maybeTakesPiece[0]) : None,
            maybeSourceColumn.length > 0 ? Some(maybeSourceColumn[0]) : None,
            maybeSourceRow.length > 0 ? Some(maybeSourceRow[0]) : None
          )
        );
      } else {
        console.warn(`Invalid move: ${move} ${move.length}`);
        return None;
      }
    } catch (e) {
      console.warn(`Invalid move: ${move}`);
      return None;
    }
  }

  public static rowFromNotation(row: string): Option<number> {
    const rowNumber = parseInt(row.charAt(0)) - 1; // Convert number to row index (1=0, 2=1, ...)
    if (isNaN(rowNumber) || rowNumber < 0 || rowNumber > 7) {
      return None; // Invalid notation
    }
    return Some(rowNumber);
  }

  // #endregion Public Static Methods (5)

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
