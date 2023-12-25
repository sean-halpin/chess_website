import { Team } from "./ChessGameTypes";
import { MoveResult } from "./MoveResult";
import { ChessBoard } from "./ChessBoard";
import _ from "lodash";

export class GameState {
  // #region Constructors (1)

  constructor(
    readonly board: ChessBoard,
    readonly currentPlayer: Team.White | Team.Black,
    readonly commands: MoveResult[],
    readonly counter: number,
    readonly winner: any
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
