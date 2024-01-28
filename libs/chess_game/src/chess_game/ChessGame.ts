// ChessGameLogic.ts

import { gameToFEN, fenPieceToTeam, fenToRank, fenToTeam } from "./FenNotation";
import { MoveCommand } from "./MoveCommand";
import { moveFunctions } from "./PieceLogic";
import { Err, Ok, Result } from "../rust_types/Result";
import { Rank, rankValue } from "./Rank";
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
import { StandardAlgebraicNotationMove } from "./StandardAlgebraicNotationMove";
import { MoveCommandAndResult } from "./MoveCommandAndResult";

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
  ): MoveCommandAndResult[] => {
    const legalMoves: MoveCommandAndResult[] = [];
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
          .map(
            (m): MoveCommandAndResult =>
              new MoveCommandAndResult(m.toMoveCommand(), m)
          )
      );
    }
    return legalMoves.filter(
      (move) =>
        !this.isKingInCheck(
          this.applyMoveCommand(move.command, clonedState),
          team
        )
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

  private static isCastleMove = (move: string): boolean => {
    return move === "O-O" || move === "O-O-O";
  };

  public static SANMovesToChessGame(
    moves: string[]
  ): Result<ChessGame, string> {
    let game = new ChessGame();

    for (const move of moves) {
      console.log(move);
      const legalMoves = ChessGame.findLegalMoves(
        game.gameState,
        game.gameState.currentPlayer
      );
      const sanCmdOption = Loc.fromSAN(move);
      if (sanCmdOption.isNone()) {
        console.error("Ambiguous move", move);
        return Err(`Invalid move ${move}`);
      }
      const sanCmd: StandardAlgebraicNotationMove = sanCmdOption.unwrap();
      const moveCommands: MoveCommandAndResult[] = legalMoves.filter((m) => {
        // Handle Castle Moves
        if (ChessGame.isCastleMove(move)) {
          if (m.result.rookSrcDestCastling.isNone()) {
            return false;
          }
          const rookSrcDestCastling = m.result.rookSrcDestCastling.unwrap();
          const dest = rookSrcDestCastling.dest;
          const validDestinations = [
            Loc.fromNotation("c1").unwrap(),
            Loc.fromNotation("c8").unwrap(),
            Loc.fromNotation("f1").unwrap(),
            Loc.fromNotation("f8").unwrap(),
          ];
          return validDestinations.some((validDest) => validDest.isEqual(dest));
        } else {
          const destination = sanCmd.destination.unwrap();
          return m.command.destination.isEqual(destination);
        }
      });
      if (!moveCommands || moveCommands.length === 0) {
        console.error("Ambiguous move", move, sanCmd);
        return Err(`Invalid move ${move} - ${sanCmd.toString()}`);
      }
      let moveCommand;
      if (moveCommands.length === 1) {
        console.log("Single move", move, sanCmd);
        moveCommand = Some(moveCommands[0]);
      } else if (sanCmd.sourcePieceRank.isSome()) {
        const ambiguousCommandsFilteredByRank: MoveCommandAndResult[] =
          moveCommands
            .map((move) => {
              const movingPiece = game.gameState.board.pieceFromLoc(
                move.command.source
              );
              if (movingPiece.isNone()) {
                return { m: move, r: None };
              }
              return { m: move, r: Some(movingPiece.unwrap().rank) };
            })
            .filter((move) => {
              if (move.r.isSome() && sanCmd.sourcePieceRank.isSome()) {
                return move.r.unwrap() === sanCmd.sourcePieceRank.unwrap();
              }
              return false;
            })
            .map((move) => move.m);
        if (ambiguousCommandsFilteredByRank.length === 1) {
          moveCommand = Some(ambiguousCommandsFilteredByRank[0]);
        } else {
          console.error(
            "Ambiguous move",
            move,
            sanCmd,
            ambiguousCommandsFilteredByRank.length
          );
          return Err(
            `Amibuous move ${move} - ${sanCmd.toString()} - ${
              ambiguousCommandsFilteredByRank.length
            }`
          );
        }
      } else if (sanCmd.sourcePieceRank.isNone()) {
        const legalMovesWithSourceRank = moveCommands.map((move) => {
          const movingPiece = game.gameState.board.pieceFromLoc(
            move.command.source
          );
          if (movingPiece.isNone()) {
            return { m: move, r: None };
          }
          return { m: move, r: Some(movingPiece.unwrap().rank) };
        });
        // take the first moveCommand with the lowest rank value using rankValue function from legalMovesWithSourceRank
        const moveCommandWithLowestRankValue = legalMovesWithSourceRank.reduce(
          (acc, curr) => {
            if (acc.r.isSome() && curr.r.isSome()) {
              return rankValue(acc.r.unwrap()) < rankValue(curr.r.unwrap())
                ? acc
                : curr;
            }
            return acc;
          }
        );
        moveCommand = Some(moveCommandWithLowestRankValue.m);
      } else {
        console.error("Ambiguous move", move, sanCmd);
        return Err(`Amibuous move ${move} - ${sanCmd.toString()}`);
      }
      const cmdResult = game.executeCommand(moveCommand.unwrap().command);
      if (cmdResult.isError()) {
        console.error(cmdResult.error, move, sanCmd);
        console.error(cmdResult.error, move, sanCmd.toString());
        return Err(cmdResult.error);
      } else {
        game = cmdResult.data;
        game.gameState.board.print();
      }
    }
    return Ok(game);
  }

  private executeCommandAlgebraic = (
    cmd: string
  ): Result<ChessGame, string> => {
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
    console.log(
      "Executing command",
      cmd.source.toNotation(),
      cmd.destination.toNotation()
    );
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
