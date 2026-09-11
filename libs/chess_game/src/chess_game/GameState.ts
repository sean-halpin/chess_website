import { Team } from "./Team";
import { Board } from "./Board";
import _ from "lodash";
import { isSome, unwrap } from "../rust_types/Option";
import { rankValue } from "./Rank";
import { ChessGame } from "./ChessGame";
import { MoveCommandAndResult } from "./MoveCommandAndResult";
import { Loc } from "./Loc";
import { None, Option } from "../rust_types/Option";

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export const noCastlingRights = (): CastlingRights => ({
  whiteKingSide: false,
  whiteQueenSide: false,
  blackKingSide: false,
  blackQueenSide: false,
});

// #region Classes (1)

export class GameState {
  // #region Constructors (1)

  constructor(
    readonly board: Board,
    readonly currentPlayer: Team.White | Team.Black,
    readonly commands: MoveCommandAndResult[],
    readonly counter: number,
    readonly status: GameStatus,
    readonly castlingRights: CastlingRights = noCastlingRights(),
    readonly enPassantTarget: Option<Loc> = None,
    readonly halfmoveClock: number = 0,
    readonly fullmoveNumber: number = 1
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
      ChessGame.applyMoveCommand(move.command, this, move.result)
    );
    return children;
  }

  public updateStatus(status: GameStatus): GameState {
    return new GameState(
      this.board,
      this.currentPlayer,
      this.commands,
      this.counter,
      status,
      this.castlingRights,
      this.enPassantTarget,
      this.halfmoveClock,
      this.fullmoveNumber
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
