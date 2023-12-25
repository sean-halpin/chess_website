import { MoveCommand } from "./GameCommands";
import { None, Option } from "../types/Option";
import { ChessPiece } from "./ChessPiece";
import { Loc } from "./Loc";

export enum Rank {
  Rook = "rook",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn",
}

// function that takes a rank and returns the value of the rank
export function rankValue(rank: Rank): number {
  switch (rank) {
    case Rank.Pawn:
      return 1;
    case Rank.Knight:
    case Rank.Bishop:
      return 3;
    case Rank.Rook:
      return 5;
    case Rank.Queen:
      return 9;
    case Rank.King:
      return 100;
  }
}

export enum Team {
  White = "white",
  Black = "black",
}
interface IMoveResult {
  // #region Properties (4)

  destination: Loc;
  enPassantPossible?: Boolean;
  movingPiece: ChessPiece;
  takenPiece: Option<ChessPiece>;

  // #endregion Properties (4)
}
export class MoveResult implements IMoveResult {
  // #region Constructors (1)

  constructor(
    public destination: Loc,
    public movingPiece: ChessPiece,
    public takenPiece: Option<ChessPiece>,
    public enPassantPossible: boolean = false,
    public kingLocationsMustNotBeInCheck: Option<Loc[]> = None,
    public rookSrcDestCastling: Option<{ src: Loc; dest: Loc }> = None
  ) {}

  // #endregion Constructors (1)

  // #region Public Methods (1)

  public toMoveCommand(): MoveCommand {
    return {
      command: "move",
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }

  // #endregion Public Methods (1)
}
