import { Team } from "./Team";
import { Rank } from "./Rank";
import { Loc } from "./Loc";

export class ChessPiece {
  // #region Constructors (1)

  constructor(
    readonly id: string,
    readonly team: Team,
    readonly rank: Rank,
    readonly position: Loc,
    readonly firstMove: boolean = true
  ) {}

  // #endregion Constructors (1)
}
