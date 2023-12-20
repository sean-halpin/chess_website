import { isSome, unwrap } from "../types/Option";
import { ChessPiece, Team } from "./ChessGameTypes";
import { ChessBoard, MoveResult } from "./ChessGameTypes";

export class GameState {
  // #region Properties (5)

  private _board: ChessBoard = [];
  private _commands: MoveResult[] = [];
  private _counter: number = 0;
  private _currentPlayer: Team.White | Team.Black = Team.White;
  private _winner: any;

  // #endregion Properties (5)

  // #region Constructors (1)

  constructor(
    board: ChessBoard,
    currentPlayer: Team.White | Team.Black,
    commands: MoveResult[],
    counter: number,
    winner: any
  ) {
    this._board = board;
    this._currentPlayer = currentPlayer;
    this._commands = commands;
    this._counter = counter;
    this._winner = winner;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (11)

  public get board(): ChessBoard {
    return this._board;
  }

  public set board(value: ChessBoard) {
    this._board = value;
  }

  public get commands(): MoveResult[] {
    return this._commands;
  }

  public set commands(value: MoveResult[]) {
    this._commands = value;
  }

  public get counter(): number {
    return this._counter;
  }

  public set counter(value: number) {
    this._counter = value;
  }

  public get currentPlayer(): Team.White | Team.Black {
    return this._currentPlayer;
  }

  public set currentPlayer(value: Team.White | Team.Black) {
    this._currentPlayer = value;
  }

  public get pieces(): ChessPiece[] {
    return this.board
      .flat()
      .filter(isSome)
      .map(unwrap);
  }

  public get winner(): any {
    return this._winner;
  }

  public set winner(value: any) {
    this._winner = value;
  }

  // #endregion Public Accessors (11)

  // #region Public Methods (1)

  // a function which creates a deep copy the current state
  public clone(): GameState {
    const clonedBoard: ChessBoard = this._board.map((row) => [...row]);
    const clonedCommands: MoveResult[] = [...this._commands];
    const clonedCounter: number = this._counter;
    const clonedCurrentPlayer: Team = this._currentPlayer;
    const clonedWinner: any = this._winner;

    return new GameState(
      clonedBoard,
      clonedCurrentPlayer,
      clonedCommands,
      clonedCounter,
      clonedWinner
    );
  }

  // #endregion Public Methods (1)
}
