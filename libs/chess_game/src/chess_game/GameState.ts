import { Team } from "./Team";
import { Board } from "./Board";
import _ from "lodash";
import { isSome, unwrap } from "../rust_types/Option";
import { rankValue } from "./Rank";
import { ChessGame } from "./ChessGame";
import { MoveCommandAndResult } from "./MoveCommandAndResult";

// #region Classes (1)

export class GameState {
  // #region Constructors (1)

  constructor(
    readonly board: Board,
    readonly currentPlayer: Team.White | Team.Black,
    readonly commands: MoveCommandAndResult[],
    readonly counter: number,
    readonly status: GameStatus
  ) {}

  // #endregion Constructors (1)

  // #region Public Methods (4)

  public clone() {
    return _.cloneDeep(this);
  }

  public evaluate() {
    let score = 0;
    const pieces = this.board.squares.flat().filter(isSome).map(unwrap);
    for (const piece of pieces) {
      if (piece.team === Team.White) {
        score += rankValue(piece.rank);
        if (piece.position.isCentral()) {
          score += 0.1; // Increase score for controlling the center
        }
      } else {
        score -= rankValue(piece.rank);
        if (piece.position.isCentral()) {
          score -= 0.1; // Decrease score for opponent controlling the center
        }
      }
    }
    return score;
  }

  public getChildren() {
    const moves = ChessGame.findLegalMoves(this, this.currentPlayer);

    const children = moves.map((move) =>
      ChessGame.applyMoveCommand(move.command, this)
    );
    return children;
  }

  public updateStatus(status: GameStatus): GameState {
    return new GameState(
      this.board,
      this.currentPlayer,
      this.commands,
      this.counter,
      status
    );
  }

  // #endregion Public Methods (4)
}

// #endregion Classes (1)

// #region Enums (1)

export enum GameStatus {
  InProgress = "In Progress",
  Checkmate = "Checkmate",
  Stalemate = "Stalemate",
  Draw = "Draw",
  Check = "Check",
}

// #endregion Enums (1)
