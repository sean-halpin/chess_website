// ChessGameLogic.ts

import { gameToFEN, fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import { MoveCommand } from "./GameCommands";
import { moveFunctions } from "./PieceLogic";
import { Result } from "../types/Result";
import { rankValue } from "./Rank";
import { Rank } from "./Rank";
import { Team } from "./Team";
import { None, Some, isSome, unwrap, Option, isNone } from "../types/Option";
import { MoveResult } from "./MoveResult";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";
import { Board } from "./Board";
import { GameState } from "./GameState";
import { findBestMoveMinimax } from "./Minimax";

export class ChessGame {
  // #region Properties (11)

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
      null
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
      const move = moveResult[0];
      // Remove taken piece
      if (isSome(move.takenPiece)) {
        updatedBoard = updatedBoard = updatedBoard.updatePieceFromLoc(
          move.takenPiece.unwrap().position,
          None
        );
      }
      // Update moving piece
      if (movingPiece) {
        // Handle Castle
        if (move.rookSrcDestCastling.isSome()) {
          const castlingRookSrcDest = move.rookSrcDestCastling.unwrap();
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
          (move.destination.row === 0 || move.destination.row === 7)
            ? Rank.Queen // Promote pawn to queen
            : movingPiece.rank,
          move.destination,
          false
        );
        updatedBoard = updatedBoard.updatePieceFromLoc(newCommand.source, None);
        updatedBoard = updatedBoard.updatePieceFromLoc(
          newCommand.destination,
          Some(updatedPiece)
        );
      }

      // Push Latest Command Result
      clonedGameState.commands.push(move);

      return new GameState(
        updatedBoard,
        clonedGameState.currentPlayer === Team.White ? Team.Black : Team.White,
        clonedGameState.commands,
        clonedGameState.counter,
        null
      );
    }
    return clonedGameState;
  };
  public static evaluateBoard = (gameState: GameState): number => {
    let score = 0;
    const pieces = gameState.board.squares.flat().filter(isSome).map(unwrap);
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

  public executeCommand = (cmd: MoveCommand): Result<ChessGame, string> => {
    switch (cmd.command) {
      case "move":
        {
          const clonedState = this.gameState.clone();
          const currentPlayer = clonedState.currentPlayer;
          const enemyPlayer =
            currentPlayer === Team.White ? Team.Black : Team.White;
          let updatedState = ChessGame.applyMoveCommand(cmd, clonedState);
          const ownKingChecked = ChessGame.isKingInCheck(
            updatedState,
            currentPlayer
          );
          if (ownKingChecked) {
            const err = "Invalid move: puts own king in check";
            console.warn(err);
            return { success: false, error: err };
          }
          const enemyKingChecked = ChessGame.isKingInCheck(
            updatedState,
            enemyPlayer
          );
          const noLegalFollowingMoves =
            ChessGame.findLegalMoves(updatedState, enemyPlayer).length === 0;
          const checkMate = enemyKingChecked && noLegalFollowingMoves;
          const draw = !enemyKingChecked && noLegalFollowingMoves;

          if (checkMate) {
            console.log("Checkmate");
            updatedState = updatedState.withWinner(`Checkmate`);
          } else if (draw) {
            console.log("Draw");
            updatedState = updatedState.withWinner("Draw");
          } else if (enemyKingChecked) {
            console.log("Check");
            updatedState = updatedState.withWinner("Check");
          }
          // Lastly update the game state from updatedState
          this.gameState = updatedState;
        }
        return { success: true, data: this };
      default:
        console.warn(`[${ChessGame.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  };
  public getCurrentFen = () => {
    return gameToFEN(this.gameState);
  };

  // #endregion Properties (11)

  // #region Constructors (1)

  constructor(fen?: string) {
    this._gameState = this.initializeGameState(fen);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (5)

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

  public get status(): Team | "Check" | "Checkmate" | "Draw" | null {
    return this.gameState.status;
  }

  // #endregion Public Accessors (5)

  // #region Public Methods (1)

  public async cpuMoveMinimax(team: Team): Promise<Result<ChessGame, string>> {
    const clonedGameState = this.gameState.clone();
    const possibleMoves = ChessGame.findLegalMoves(clonedGameState, team);

    if (possibleMoves.length > 0) {
      const bestMove = findBestMoveMinimax(clonedGameState, 3, 3 * 1000);
      return this.executeCommand(await bestMove);
    } else {
      return { success: false, error: "No possible moves" };
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
