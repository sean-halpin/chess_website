// ChessGameLogic.ts

import { gameToFEN, fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import { MoveCommand } from "./MoveCommand";
import { moveFunctions } from "./PieceLogic";
import { Err, Ok, Result } from "../rust_types/Result";
import { Rank } from "./Rank";
import { Team } from "./Team";
import {
  None,
  Some,
  isSome,
  unwrap,
  Option,
  isNone,
} from "../rust_types/Option";
import { MoveResult } from "./MoveResult";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";
import { Board } from "./Board";
import { GameState, GameStatus } from "./GameState";
import { findBestMoveMinimax } from "./Minimax";

export class ChessGame {
  // #region Properties (10)

  private _gameState: GameState;
  private createPiece = (
    team: Team,
    position: Loc,
    rank: Rank,
    i: number
  ): ChessPiece => {
    return {
      id: `${team}-${rank}-${i}`,
      rank,
      team,
      position,
      firstMove: true,
    };
  };
  private initializeGameState = (
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ): GameState => {
    const [piecePlacement, activeColor] = fen.split(" ");

    const fenRows = piecePlacement.split("/");

    let index = 0;
    const pieces: ChessPiece[] = [];
    fenRows.forEach((row) => {
      row.split("").forEach((fenInstruction) => {
        if (!isNaN(Number(fenInstruction))) {
          index += Number(fenInstruction);
        } else {
          pieces.push(
            this.createPiece(
              fenPieceToTeam(fenInstruction),
              new Loc(7 - Math.floor(index / 8), index % 8),
              fenToRank(fenInstruction),
              index
            )
          );
          index += 1;
        }
      });
    });
    let initialBoard: Board = new Board(
      Array.from({ length: 8 }, () => Array(8).fill(None))
    );
    pieces.forEach((piece) => {
      initialBoard = initialBoard.updatePieceFromLoc(
        piece.position,
        Some(piece)
      );
    });

    const initialState: GameState = new GameState(
      initialBoard,
      fenToTeam(activeColor),
      [],
      0,
      GameStatus.InProgress
    );
    return initialState;
  };

  public static applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: GameState
  ): GameState => {
    const clonedGameState = gameState.clone();
    let updatedBoard = clonedGameState.board;

    const movingPiece: ChessPiece = updatedBoard.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) =>
          piece.position.row === newCommand.source.row &&
          piece.position.col === newCommand.source.col
      ) as ChessPiece;
    const moveResult: MoveResult[] = moveFunctions[movingPiece.rank](
      movingPiece,
      clonedGameState
    ).filter(
      (move) =>
        move.destination.isEqual(newCommand.destination) &&
        move.movingPiece.position.row === newCommand.source.row &&
        move.movingPiece.position.col === newCommand.source.col
    );
    if (moveResult.length > 0) {
      const moveRes = moveResult[0];
      // Remove taken piece
      if (isSome(moveRes.takenPiece)) {
        updatedBoard = updatedBoard = updatedBoard.updatePieceFromLoc(
          moveRes.takenPiece.unwrap().position,
          None
        );
      }
      // Update moving piece
      if (movingPiece) {
        // Handle Castle
        if (moveRes.rookSrcDestCastling.isSome()) {
          const castlingRookSrcDest = moveRes.rookSrcDestCastling.unwrap();
          const castlingRook = updatedBoard.pieceFromLoc(
            castlingRookSrcDest.src
          );
          if (castlingRook.isSome()) {
            const unwrappedCastlingRook = castlingRook.unwrap();
            const updatedRook = new ChessPiece(
              unwrappedCastlingRook.id,
              unwrappedCastlingRook.team,
              unwrappedCastlingRook.rank,
              castlingRookSrcDest.dest,
              false
            );
            updatedBoard = updatedBoard.updatePieceFromLoc(
              castlingRookSrcDest.src,
              None
            );
            updatedBoard = updatedBoard.updatePieceFromLoc(
              castlingRookSrcDest.dest,
              Some(updatedRook)
            );
          }
        }
        const updatedPiece = new ChessPiece(
          movingPiece.id,
          movingPiece.team,
          movingPiece.rank === Rank.Pawn &&
          (moveRes.destination.row === 0 || moveRes.destination.row === 7)
            ? Rank.Queen // Promote pawn to queen
            : movingPiece.rank,
          moveRes.destination,
          false
        );
        updatedBoard = updatedBoard.updatePieceFromLoc(newCommand.source, None);
        updatedBoard = updatedBoard.updatePieceFromLoc(
          newCommand.destination,
          Some(updatedPiece)
        );
      }

      // Push Latest Command Result
      clonedGameState.commands.push([newCommand, moveRes]);

      return new GameState(
        updatedBoard,
        clonedGameState.currentPlayer === Team.White ? Team.Black : Team.White,
        clonedGameState.commands,
        clonedGameState.counter,
        GameStatus.InProgress
      );
    }
    return clonedGameState;
  };
  public static findLegalMoves = (
    gameState: GameState,
    team: Team
  ): MoveCommand[] => {
    const legalMoves: MoveCommand[] = [];
    // Make a copy of the current game state
    const clonedState = gameState.clone();
    // Apply the move command to the copied game state

    const pieces: ChessPiece[] = clonedState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((p: { team: Team }) => p.team === team);

    for (const piece of pieces) {
      const moves = moveFunctions[piece.rank](piece, clonedState);
      legalMoves.push(
        ...moves
          .flat()
          .map((m: { toMoveCommand: () => any }) => m.toMoveCommand())
      );
    }
    return legalMoves.filter(
      (move) =>
        !this.isKingInCheck(this.applyMoveCommand(move, clonedState), team)
    );
  };
  public static findLegalMovesCurry = (gs: GameState) => (t: Team) => {
    return ChessGame.findLegalMoves(gs, t);
  };
  public static isGameOver = (gameState: GameState): boolean => {
    return gameState.status === "Checkmate" || gameState.status === "Draw";
  };
  public static isKingInCheck = (gameState: GameState, team: Team): boolean => {
    // Make a copy of the current game state
    const clonedGameState = gameState.clone();

    // Find the player's king on the updated board
    const king = clonedGameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece: { team: Team; rank: Rank }) =>
          piece.team === team && piece.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = team === Team.White ? Team.Black : Team.White;
    const opponentPieces: ChessPiece[] = clonedGameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece: { team: Team }) => piece.team === opponentColor)
      .map((piece: ChessPiece) => piece as ChessPiece);

    for (const opponentPiece of opponentPieces) {
      const opponentMoves = moveFunctions[opponentPiece.rank](
        opponentPiece,
        clonedGameState
      );

      for (const moveResult of opponentMoves) {
        if (moveResult.destination.isEqual(king.position)) {
          // The king is in check after the move
          return true;
        }
      }
    }

    // The king is not in check after the move
    return false;
  };

  public executeCommandAlgebraic = (cmd: string): Result<ChessGame, string> => {
    const cmdArr = cmd.split(" ");
    const source = cmdArr[0];
    const destination = cmdArr[1];
    try {
      const cmdObj = new MoveCommand(
        Loc.fromNotation(source).unwrap(),
        Loc.fromNotation(destination).unwrap()
      );
      return this.executeCommand(cmdObj);
    } catch (e) {
      return Err("Invalid move");
    }
  };

  public executeCommand = (cmd: MoveCommand): Result<ChessGame, string> => {
    const clonedState = this.gameState.clone();
    const currentPlayer = clonedState.currentPlayer;
    // check the cmd source is the current player's piece
    const piece = clonedState.board.pieceFromLoc(cmd.source);
    if (isNone(piece)) {
      const err = "Invalid move: no piece at source";
      console.info(err);
      return Err(err);
    }
    if (piece.unwrap().team !== currentPlayer) {
      const err = "Invalid move: not current player's piece";
      console.info(err);
      return Err(err);
    }
    const enemyPlayer = currentPlayer === Team.White ? Team.Black : Team.White;
    let updatedState = ChessGame.applyMoveCommand(cmd, clonedState);
    const ownKingChecked = ChessGame.isKingInCheck(updatedState, currentPlayer);
    if (ownKingChecked) {
      const err = "Invalid move: puts own king in check";
      console.warn(err);
      return Err(err);
    }
    const enemyKingChecked = ChessGame.isKingInCheck(updatedState, enemyPlayer);
    const noLegalFollowingMoves =
      ChessGame.findLegalMoves(updatedState, enemyPlayer).length === 0;
    const checkMate = enemyKingChecked && noLegalFollowingMoves;
    const draw = !enemyKingChecked && noLegalFollowingMoves;

    if (checkMate) {
      console.log("Checkmate");
      updatedState = updatedState.updateStatus(GameStatus.Checkmate);
    } else if (draw) {
      console.log("Draw");
      updatedState = updatedState.updateStatus(GameStatus.Draw);
    } else if (enemyKingChecked) {
      console.log("Check");
      updatedState = updatedState.updateStatus(GameStatus.Check);
    }
    // Lastly update the game state from updatedState
    this.gameState = updatedState;
    return Ok(this);
  };
  public getCurrentFen = () => {
    return gameToFEN(this.gameState);
  };

  // #endregion Properties (10)

  // #region Constructors (1)

  constructor(fen?: string) {
    this._gameState = this.initializeGameState(fen);
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (5)

  public get currentPlayer(): string {
    return this.gameState.currentPlayer;
  }

  public get gameState(): GameState {
    return this._gameState;
  }

  public set gameState(value: GameState) {
    this._gameState = value;
  }

  public get pieces(): ChessPiece[] {
    return this.gameState.board.squares.flat().filter(isSome).map(unwrap);
  }

  public get status(): GameStatus {
    return this.gameState.status;
  }

  // #endregion Public Getters And Setters (5)

  // #region Public Methods (1)

  public async cpuMoveMinimax(team: Team): Promise<Result<ChessGame, string>> {
    const clonedGameState = this.gameState.clone();
    const possibleMoves = ChessGame.findLegalMoves(clonedGameState, team);

    if (possibleMoves.length > 0) {
      const bestMove = findBestMoveMinimax(clonedGameState, 3, 3 * 1000);
      return this.executeCommand(await bestMove);
    } else {
      return Err("No legal moves");
    }
  }

  // #endregion Public Methods (1)
}

export const isSquareEmpty = (r: number, c: number, b: Board) => {
  return !Board.isRowColOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};

export const isSquareEmptyLoc = (loc: Loc, b: Board) => {
  return isSquareEmpty(loc.row, loc.col, b);
};

export const isSquareEmptyNotation = (notation: string, b: Board): boolean => {
  const c = notation.toLowerCase().charCodeAt(0) - 97; // Convert letter to column index (A=0, B=1, ...)
  const r = parseInt(notation.charAt(1)) - 1; // Convert number to row index (1=0, 2=1, ...)
  return !Board.isRowColOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};
export const squareEntry = (
  r: number,
  c: number,
  b: Board
): Option<ChessPiece> => {
  if (!Board.isRowColOOB(r, c)) {
    return b.pieceFromRowCol(r, c);
  } else {
    return None;
  }
};
