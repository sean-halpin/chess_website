import { Team } from "./Team";
import { MoveResult } from "./MoveResult";
import { Board } from "./Board";
import _ from "lodash";

export class GameState {
  // #region Constructors (1)

  constructor(
    readonly board: Board,
    readonly currentPlayer: Team.White | Team.Black,
    readonly commands: MoveResult[],
    readonly counter: number,
    readonly status: any
  ) {}

  // #endregion Constructors (1)

  // #region Public Methods (2)

  public clone(){
    return _.cloneDeep(this);
  }

  public withWinner(winner: string): GameState {
    return new GameState(this.board, this.currentPlayer, this.commands, this.counter, winner);
  }

  // #endregion Public Methods (2)
}
