import { MoveCommand } from "./MoveCommand";
import { None, Option } from "../rust_types/Option";
import { ChessPiece } from "./ChessPiece";
import { Loc } from "./Loc";

export class MoveResult {
  // #region Constructors (1)

  constructor(
    readonly destination: Loc,
    readonly sourcePieceRank: ChessPiece,
    readonly takenPiece: Option<ChessPiece>,
    readonly enPassantPossible: boolean = false,
    readonly kingLocationsMustNotBeInCheck: Option<Loc[]> = None,
    readonly rookSrcDestCastling: Option<{ src: Loc; dest: Loc }> = None
  ) {}

  // #endregion Constructors (1)

  // #region Public Methods (1)

  public toMoveCommand(): MoveCommand {
    return {
      source: this.sourcePieceRank.position,
      destination: this.destination,
    };
  }

  // #endregion Public Methods (1)
}
