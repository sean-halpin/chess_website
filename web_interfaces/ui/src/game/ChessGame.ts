// ChessGameLogic.ts

import { gameToFEN, fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import _ from "lodash";
import { MoveCommand } from "./GameCommands";
import {
  findLegalBishopMoves,
  findLegalCastleMoves,
  findLegalKingMoves,
  findLegalKnightMoves,
  findLegalPawnMoves,
  findLegalQueenMoves,
} from "./PieceLogic";
import { Result } from "../types/Result";
import { Rank, rankValue } from "./ChessGameTypes";
import { Team } from "./ChessGameTypes";
import { None, Some, isSome, unwrap, Option, isNone } from "../types/Option";
import { Loc, ChessPiece, ChessBoard, MoveResult } from "./ChessGameTypes";

export class ChessGame {
  // #region Properties (5)

  private applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: IChessState
  ): IChessState => {
    const clonedGameState = CopyGameState(gameState);
    const updatedBoard = clonedGameState.board;

    const movingPiece: ChessPiece = updatedBoard.pieces
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) =>
          piece.position.row === newCommand.source.row &&
          piece.position.col === newCommand.source.col
      ) as ChessPiece;
    const moveResult: MoveResult[] = this.moveFunctions[movingPiece.rank](
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
        updatedBoard.updatePieceFromLoc(
          move.takenPiece.unwrap().position,
          None
        );
      }
      // Update moving piece
      if (movingPiece) {
        // Handle Pawn Promotion to Queen by default
        if (
          movingPiece.rank === Rank.Pawn &&
          (move.destination.row === 0 || move.destination.row === 7)
        ) {
          movingPiece.rank = Rank.Queen;
        }
        // Handle Castle
        if (move.rookSrcDestCastling.isSome()) {
          const castlingRookSrcDest = move.rookSrcDestCastling.unwrap();
          const castlingRook = updatedBoard.pieceFromLoc(
            castlingRookSrcDest.src
          );
          updatedBoard.updatePieceFromLoc(
            castlingRookSrcDest.src,
            None
          );
          updatedBoard.updatePieceFromLoc(
            castlingRookSrcDest.dest,
            castlingRook
          );
        }
        movingPiece.position = move.destination;
        movingPiece.firstMove = false;
        updatedBoard.updatePieceFromLoc(newCommand.source, None);
        updatedBoard.updatePieceFromLoc(
          newCommand.destination,
          Some(movingPiece)
        );
      }

      // Push Latest Command Result
      clonedGameState.commands.push(move);

      // Return New GameState
      return {
        board: updatedBoard,
        currentPlayer:
          clonedGameState.currentPlayer === Team.White
            ? Team.Black
            : Team.White,
        commands: clonedGameState.commands,
        counter: clonedGameState.counter,
        winner: null,
      };
    }
    return clonedGameState;
  };
  private findLegalMoves = (
    gameState: IChessState,
    team: Team
  ): MoveCommand[] => {
    const legalMoves: MoveCommand[] = [];
    // Make a copy of the current game state
    const clonedState = CopyGameState(gameState);
    // Apply the move command to the copied game state

    const pieces = clonedState.board.pieces
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((p) => p.team === team);

    for (const piece of pieces) {
      const moves = this.moveFunctions[piece.rank](piece, clonedState);
      legalMoves.push(...moves.flat().map((m) => m.toMoveCommand()));
    }
    return legalMoves.filter(
      (move) =>
        !this.isKingInCheck(this.applyMoveCommand(move, clonedState), team)
    );
  };
  private gameState: IChessState;
  private moveFunctions = {
    pawn: findLegalPawnMoves,
    rook: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

  private isKingInCheck = (gameState: IChessState, team: Team): boolean => {
    // Make a copy of the current game state
    const clonedGameState = CopyGameState(gameState);

    // Find the player's king on the updated board
    const king = clonedGameState.board.pieces
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece) => piece.team === team && piece.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = team === Team.White ? Team.Black : Team.White;
    const opponentPieces = clonedGameState.board.pieces
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece) => piece.team === opponentColor)
      .map((piece) => piece as ChessPiece);

    for (const opponentPiece of opponentPieces) {
      const opponentMoves = this.moveFunctions[opponentPiece.rank](
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

  // #endregion Properties (5)

  // #region Constructors (1)

  constructor(fen?: string) {
    this.gameState = this.initializeGameState(fen);
  }

  // #endregion Constructors (1)

  // #region Public Accessors (3)

  public get currentPlayer(): string {
    return this.gameState.currentPlayer;
  }

  public get pieces(): ChessPiece[] {
    return this.gameState.board.pieces.flat().filter(isSome).map(unwrap);
  }

  public get winner(): Team | "Check" | "Checkmate" | "Draw" | null {
    return this.gameState.winner;
  }

  // #endregion Public Accessors (3)

  // #region Public Methods (3)

  public cpuMove(team: Team): Result<ChessGame, string> {
    const clonedGameState = CopyGameState(this.gameState);
    let possibleMoves: MoveCommand[] = [];
    const pieces = this.pieces.filter((p) => p !== null && p.team === team);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

    if (randomPiece) {
      possibleMoves = this.findLegalMoves(clonedGameState, team);

      if (possibleMoves.length > 0) {
        const rankValueFromOption = (piece: Option<ChessPiece>) => {
          if (isSome(piece)) {
            return rankValue(unwrap(piece).rank);
          } else {
            return 0;
          }
        };
        const randomMove =
          possibleMoves.flat()[
            Math.floor(Math.random() * possibleMoves.flat().length)
          ];
        const maxMove: MoveCommand = possibleMoves.reduce((max, move) => {
          return rankValueFromOption(
            clonedGameState.board.pieceFromLoc(move.destination)
          ) >
            rankValueFromOption(
              clonedGameState.board.pieceFromLoc(max.destination)
            )
            ? move
            : max;
        }, randomMove);
        return this.executeCommand(maxMove);
      } else {
        return { success: false, error: "No possible moves" };
      }
    }
    return { success: false, error: "No pieces to move" };
  }

  public executeCommand(cmd: MoveCommand): Result<ChessGame, string> {
    switch (cmd.command) {
      case "move":
        const clonedState = CopyGameState(this.gameState);
        const currentPlayer = clonedState.currentPlayer;
        const enemyPlayer =
          currentPlayer === Team.White ? Team.Black : Team.White;
        let updatedState;
        updatedState = this.applyMoveCommand(cmd, clonedState);
        const ownKingChecked = this.isKingInCheck(updatedState, currentPlayer);
        if (ownKingChecked) {
          const err = "Invalid move: puts own king in check";
          console.warn(err);
          return { success: false, error: err };
        }
        const enemyKingChecked = this.isKingInCheck(updatedState, enemyPlayer);
        const noLegalFollowingMoves =
          this.findLegalMoves(updatedState, enemyPlayer).length === 0;
        const checkMate = enemyKingChecked && noLegalFollowingMoves;
        const draw = !enemyKingChecked && noLegalFollowingMoves;

        if (checkMate) {
          console.log("Checkmate");
          updatedState = {
            ...updatedState,
            winner: `Checkmate, ${clonedState.currentPlayer as Team} wins`,
          };
        } else if (draw) {
          console.log("Draw");
          updatedState = { ...updatedState, winner: "Draw" };
        } else if (enemyKingChecked) {
          console.log("Check");
          updatedState = { ...updatedState, winner: "Check" };
        }
        // Lastly update the game state
        this.gameState = {
          ...updatedState,
          counter: clonedState.counter + 1,
        };

        return { success: true, data: this };
      default:
        console.warn(`[${ChessGame.name}] Unknown command`);
        break;
    }
    return { success: false, error: "" };
  }

  public getCurrentFen() {
    return gameToFEN(this.gameState);
  }

  // #endregion Public Methods (3)

  // #region Private Methods (2)

  private createPiece(
    team: Team,
    position: Loc,
    rank: Rank,
    i: number
  ): ChessPiece {
    return {
      id: `${team}-${rank}-${i}`,
      rank,
      team: team,
      position,
      firstMove: true,
    };
  }

  private initializeGameState(
    fen: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ): IChessState {
    const [piecePlacement, activeColor] = fen.split(" ");

    const fenRows = piecePlacement.split("/");

    let index = 0;
    let pieces: ChessPiece[] = [];
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
    const initialBoard: ChessBoard = new ChessBoard(
      Array.from({ length: 8 }, () => Array(8).fill(None))
    );
    pieces.forEach((piece) => {
      initialBoard.updatePieceFromLoc(piece.position, Some(piece));
    });

    const initialState: IChessState = {
      board: initialBoard,
      currentPlayer: fenToTeam(activeColor),
      commands: [],
      counter: 0,
      winner: null,
    };
    return initialState;
  }

  // #endregion Private Methods (2)
}

export interface IChessState {
  // #region Properties (5)

  board: ChessBoard;
  commands: MoveResult[];
  counter: number;
  currentPlayer: Team.White | Team.Black;
  winner: any;

  // #endregion Properties (5)
}

export const CopyGameState = (state: IChessState): IChessState => {
  return _.cloneDeep(state);
};

export const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
export const isSquareEmpty = (r: number, c: number, b: ChessBoard) => {
  return !isOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};
export const isSquareEmptyNotation = (notation: string, b: ChessBoard) => {
  const c = notation.toLowerCase().charCodeAt(0) - 97; // Convert letter to column index (A=0, B=1, ...)
  const r = parseInt(notation.charAt(1)) - 1; // Convert number to row index (1=0, 2=1, ...)
  return !isOOB(r, c) && isNone(b.pieceFromRowCol(r, c));
};
export const squareEntry = (
  r: number,
  c: number,
  b: ChessBoard
): Option<ChessPiece> => {
  if (!isOOB(r, c)) {
    return b.pieceFromRowCol(r, c);
  } else {
    return None;
  }
};