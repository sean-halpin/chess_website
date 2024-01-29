import { None, Option } from "../rust_types/Option";
import { Rank, algebraicFromRank } from "./Rank";
import { Loc } from "./Loc";

export class StandardAlgebraicNotationMove {
  // #region Properties (7)

  public destination: Option<Loc>;
  public kingSideCastle: Option<boolean>;
  public queenSideCastle: Option<boolean>;
  public sourceColumn: Option<number>;
  public sourcePieceRank: Option<Rank>;
  public sourceRow: Option<number>;
  public takesPiece: Option<boolean>;
  public promotionRank: Option<Rank>;

  // #endregion Properties (7)

  // #region Constructors (1)

  private constructor(
    dest: Option<Loc> = None,
    sourcePieceRank: Option<Rank> = None,
    kingSideCastle: Option<boolean> = None,
    queenSideCastle: Option<boolean> = None,
    takesPiece: Option<boolean> = None,
    sourceColumn: Option<number> = None,
    sourceRow: Option<number> = None,
    promotionRank: Option<Rank> = None
  ) {
    this.destination = dest;
    this.sourcePieceRank = sourcePieceRank;
    this.kingSideCastle = kingSideCastle;
    this.queenSideCastle = queenSideCastle;
    this.takesPiece = takesPiece;
    this.sourceColumn = sourceColumn;
    this.sourceRow = sourceRow;
    this.promotionRank = promotionRank;
  }

  // #endregion Constructors (1)

  // #region Public Static Methods (1)

  public static create(
    dest: Option<Loc>,
    sourcePieceRank: Option<Rank>,
    kingSideCastle: Option<boolean>,
    queenSideCastle: Option<boolean>,
    takesPiece: Option<boolean>,
    sourceColumn: Option<number>,
    sourceRow: Option<number>,
    promotionRank: Option<Rank> = None
  ): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(
      dest,
      sourcePieceRank,
      kingSideCastle,
      queenSideCastle,
      takesPiece,
      sourceColumn,
      sourceRow,
      promotionRank
    );
  }

  // #endregion Public Static Methods (1)

  // #region Public Methods (1)

  public toString() {
    if (this.sourcePieceRank.isSome()) {
      return `${algebraicFromRank(
        this.sourcePieceRank.unwrap()
      )}${this.destination.unwrap().toNotation()}`;
    } else {
      return this.destination.unwrap().toNotation();
    }
  }

  // #endregion Public Methods (1)
}
