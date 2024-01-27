import { None, Option } from "../rust_types/Option";
import { Rank, algebraicFromRank } from "./Rank";
import { Loc } from "./Loc";

export class StandardAlgebraicNotationMove {
  // #region Properties (2)
  public location: Option<Loc>;
  public movingPieceRank: Option<Rank>;
  public kingSideCastle: boolean;
  public queenSideCastle: boolean;

  // #endregion Properties (2)
  // #region Constructors (1)
  private constructor(
    loc: Option<Loc> = None,
    piece: Option<Rank> = None,
    kingSideCastle: boolean = false,
    queenSideCastle: boolean = false
  ) {
    this.location = loc;
    this.movingPieceRank = piece;
    this.kingSideCastle = kingSideCastle;
    this.queenSideCastle = queenSideCastle;
  }

  // #endregion Constructors (1)
  // #region Public Static Methods (2)
  public static withLoc(loc: Option<Loc>): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(loc, None);
  }

  public static withLocRank(
    loc: Option<Loc>,
    piece: Option<Rank>
  ): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(loc, piece);
  }

  public static withKingSideCastle(): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(None, None, true);
  }

  public static withQueenSideCastle(): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(None, None, false, true);
  }

  // #endregion Public Static Methods (2)
  // #region Public Methods (1)
  public toString() {
    if (this.movingPieceRank.isSome()) {
      return `${algebraicFromRank(this.movingPieceRank.unwrap())}${this.location
        .unwrap()
        .toNotation()}`;
    } else {
      return this.location.unwrap().toNotation();
    }
  }
}
