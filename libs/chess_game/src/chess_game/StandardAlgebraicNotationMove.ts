import { None, Option } from "../rust_types/Option";
import { Rank, algebraicFromRank } from "./Rank";
import { Loc } from "./Loc";

export class StandardAlgebraicNotationMove {
  // #region Properties (2)
  public destination: Option<Loc>;
  public sourcePieceRank: Option<Rank>;
  public kingSideCastle: boolean;
  public queenSideCastle: boolean;
  public takesPiece: boolean;
  public sourceFile: Option<number>;
  public sourceRank: Option<number>;

  // #endregion Properties (2)
  // #region Constructors (1)
  private constructor(
    dest: Option<Loc> = None,
    sourcePieceRank: Option<Rank> = None,
    kingSideCastle: boolean = false,
    queenSideCastle: boolean = false,
    takesPiece: boolean = false,
    sourceFile: Option<number> = None,
    sourceRank: Option<number> = None
  ) {
    this.destination = dest;
    this.sourcePieceRank = sourcePieceRank;
    this.kingSideCastle = kingSideCastle;
    this.queenSideCastle = queenSideCastle;
    this.takesPiece = takesPiece;
    this.sourceFile = sourceFile;
    this.sourceRank = sourceRank;
  }

  // #endregion Constructors (1)
  // #region Public Static Methods (2)
  public static withLoc(loc: Option<Loc>): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(loc, None);
  }

  public static withLocRank(
    dest: Option<Loc>,
    piece: Option<Rank>
  ): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(dest, piece);
  }

  public static withKingSideCastle(): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(None, None, true);
  }

  public static withQueenSideCastle(): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(None, None, false, true);
  }

  public static withTakesPiece(
    dest: Option<Loc>,
    piece: Option<Rank>,
    sourceFile: Option<number>,
    sourceRank: Option<number>
  ): StandardAlgebraicNotationMove {
    return new StandardAlgebraicNotationMove(
      dest,
      piece,
      false,
      false,
      true,
      sourceFile,
      sourceRank
    );
  }

  // #endregion Public Static Methods (2)
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
}
