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
import {
  CastlingRights,
  DrawReason,
  GameState,
  GameStatus,
} from "./GameState";
import { findBestMoveMinimax } from "./Minimax";
import { StandardAlgebraicNotationMove } from "./StandardAlgebraicNotationMove";
import { MoveCommandAndResult } from "./MoveCommandAndResult";

export class ChessGame {
  // #region Properties (12)

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

  private initializeGameState = (
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ): GameState => {
    const fields = fen.trim().split(/\s+/);
    if (fields.length !== 6) {
      throw new Error("Invalid FEN: expected six fields");
    }
    const [piecePlacement, activeColor, castling, enPassant, halfmove, fullmove] =
      fields;
    if (activeColor !== "w" && activeColor !== "b") {
      throw new Error("Invalid FEN: active color must be w or b");
    }

    const fenRows = piecePlacement.split("/");
    if (fenRows.length !== 8) {
      throw new Error("Invalid FEN: expected eight board ranks");
    }

    let index = 0;
    const pieces: ChessPiece[] = [];
    fenRows.forEach((row) => {
      let rankWidth = 0;
      row.split("").forEach((fenInstruction) => {
        if (/^[1-8]$/.test(fenInstruction)) {
          index += Number(fenInstruction);
          rankWidth += Number(fenInstruction);
        } else {
          if (!/^[prnbqkPRNBQK]$/.test(fenInstruction)) {
            throw new Error("Invalid FEN: invalid board piece");
          }
          pieces.push(
            this.createPiece(
              fenPieceToTeam(fenInstruction),
              new Loc(7 - Math.floor(index / 8), index % 8),
              fenToRank(fenInstruction),
              index
            )
          );
          index += 1;
          rankWidth += 1;
        }
      });
      if (rankWidth !== 8) {
        throw new Error("Invalid FEN: each rank must contain eight squares");
      }
    });
    const whiteKings = pieces.filter(
      (piece) => piece.team === Team.White && piece.rank === Rank.King
    );
    const blackKings = pieces.filter(
      (piece) => piece.team === Team.Black && piece.rank === Rank.King
    );
    if (whiteKings.length !== 1 || blackKings.length !== 1) {
      throw new Error("Invalid FEN: exactly one king is required for each team");
    }
    if (!/^(?:-|K?Q?k?q?)$/.test(castling) ||
      (castling !== "-" && new Set(castling).size !== castling.length)) {
      throw new Error("Invalid FEN: invalid castling rights");
    }
    if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant)) {
      throw new Error("Invalid FEN: invalid en-passant target");
    }
    if (!/^\d+$/.test(halfmove) || !/^[1-9]\d*$/.test(fullmove)) {
      throw new Error("Invalid FEN: invalid move counters");
    }
    const castlingRights: CastlingRights = {
      whiteKingSide: castling.includes("K"),
      whiteQueenSide: castling.includes("Q"),
      blackKingSide: castling.includes("k"),
      blackQueenSide: castling.includes("q"),
    };
    const enPassantTarget = enPassant === "-"
      ? None
      : Loc.fromNotation(enPassant);
    let initialBoard: Board = new Board(
      Array.from({ length: 8 }, () => Array(8).fill(None))
    );
    pieces.forEach((piece) => {
      initialBoard = initialBoard.updatePieceFromLoc(
        piece.position,
        Some(piece)
      );
    });

    let initialState: GameState = new GameState(
      initialBoard,
      fenToTeam(activeColor),
      [],
      0,
      GameStatus.InProgress,
      castlingRights,
      enPassantTarget,
      Number(halfmove),
      Number(fullmove)
    );
    initialState = new GameState(
      initialState.board,
      initialState.currentPlayer,
      initialState.commands,
      initialState.counter,
      initialState.status,
      initialState.castlingRights,
      initialState.enPassantTarget,
      initialState.halfmoveClock,
      initialState.fullmoveNumber,
      [ChessGame.positionKey(initialState)]
    );
    const sideToMove = initialState.currentPlayer;
    const hasLegalMoves = ChessGame.findLegalMoves(initialState, sideToMove).length > 0;
    if (!hasLegalMoves) {
      initialState = initialState.updateStatus(
        ChessGame.isKingInCheck(initialState, sideToMove)
          ? GameStatus.Checkmate
          : GameStatus.Draw
      );
      if (!ChessGame.isKingInCheck(initialState, sideToMove)) {
        initialState = initialState.updateDraw(DrawReason.Stalemate);
      }
    } else if (ChessGame.isKingInCheck(initialState, sideToMove)) {
      initialState = initialState.updateStatus(GameStatus.Check);
    }
    const automaticDraw = ChessGame.automaticDrawReason(initialState);
    if (automaticDraw !== undefined && initialState.status !== GameStatus.Checkmate) {
      initialState = initialState.updateDraw(automaticDraw);
    }
    return initialState;
  };

  public static applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: GameState,
    generatedMoveResult?: MoveResult
  ): GameState => {
    let updatedBoard = gameState.board;

    const movingPiece: ChessPiece =
      generatedMoveResult?.sourcePieceRank ??
      (updatedBoard.squares
        .flat()
        .filter(isSome)
        .map(unwrap)
        .find(
          (piece) =>
            piece.position.row === newCommand.source.row &&
            piece.position.col === newCommand.source.col
        ) as ChessPiece);
    const moveRes =
      generatedMoveResult ??
      moveFunctions[movingPiece.rank](movingPiece, gameState).find(
        (move) =>
          move.destination.isEqual(newCommand.destination) &&
          move.sourcePieceRank.position.row === newCommand.source.row &&
          move.sourcePieceRank.position.col === newCommand.source.col &&
          ((move.pawnPromotion.isNone() && newCommand.promotionRank.isNone()) ||
            (move.pawnPromotion.isSome() &&
              newCommand.promotionRank.isSome() &&
              move.pawnPromotion.unwrap() === newCommand.promotionRank.unwrap()))
      );
    if (moveRes !== undefined) {
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
            ? newCommand.promotionRank.isSome()
              ? newCommand.promotionRank.unwrap()
              : Rank.Queen // Promote pawn to queen by default
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
      const updatedCommands = [
        ...gameState.commands,
        new MoveCommandAndResult(newCommand, moveRes),
      ];
      const updatedCastlingRights = { ...gameState.castlingRights };
      const clearRookCastlingRight = (team: Team, location: Loc) => {
        const homeRow = team === Team.White ? 0 : 7;
        if (location.row !== homeRow) {
          return;
        }
        if (location.col === 0) {
          if (team === Team.White) {
            updatedCastlingRights.whiteQueenSide = false;
          } else {
            updatedCastlingRights.blackQueenSide = false;
          }
        } else if (location.col === 7) {
          if (team === Team.White) {
            updatedCastlingRights.whiteKingSide = false;
          } else {
            updatedCastlingRights.blackKingSide = false;
          }
        }
      };
      if (movingPiece.rank === Rank.King) {
        if (movingPiece.team === Team.White) {
          updatedCastlingRights.whiteKingSide = false;
          updatedCastlingRights.whiteQueenSide = false;
        } else {
          updatedCastlingRights.blackKingSide = false;
          updatedCastlingRights.blackQueenSide = false;
        }
      } else if (movingPiece.rank === Rank.Rook) {
        clearRookCastlingRight(movingPiece.team, newCommand.source);
      }
      if (
        isSome(moveRes.takenPiece) &&
        moveRes.takenPiece.unwrap().rank === Rank.Rook
      ) {
        const takenRook = moveRes.takenPiece.unwrap();
        clearRookCastlingRight(takenRook.team, takenRook.position);
      }
      const isPawnMove = movingPiece.rank === Rank.Pawn;
      const enPassantTarget =
        isPawnMove && Math.abs(newCommand.destination.row - newCommand.source.row) === 2
          ? Some(
              new Loc(
                (newCommand.destination.row + newCommand.source.row) / 2,
                newCommand.source.col
              )
            )
          : None;
      const halfmoveClock =
        isPawnMove || isSome(moveRes.takenPiece)
          ? 0
          : gameState.halfmoveClock + 1;
      const fullmoveNumber =
        gameState.fullmoveNumber +
        (gameState.currentPlayer === Team.Black ? 1 : 0);

      const nextState = new GameState(
        updatedBoard,
        gameState.currentPlayer === Team.White ? Team.Black : Team.White,
        updatedCommands,
        gameState.counter,
        GameStatus.InProgress,
        updatedCastlingRights,
        enPassantTarget,
        halfmoveClock,
        fullmoveNumber,
        gameState.positionHistory
      );
      return new GameState(
        nextState.board,
        nextState.currentPlayer,
        nextState.commands,
        nextState.counter,
        nextState.status,
        nextState.castlingRights,
        nextState.enPassantTarget,
        nextState.halfmoveClock,
        nextState.fullmoveNumber,
        [...gameState.positionHistory, ChessGame.positionKey(nextState)]
      );
    }
    return gameState.clone();
  };
  public static findLegalMoves = (
    gameState: GameState,
    team: Team
  ): MoveCommandAndResult[] => {
    const legalMoves: MoveCommandAndResult[] = [];
    const pieces: ChessPiece[] = gameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((p: { team: Team }) => p.team === team);

    for (const piece of pieces) {
      const moves = moveFunctions[piece.rank](piece, gameState);
      legalMoves.push(
        ...moves
          .flat()
          .map(
            (m): MoveCommandAndResult =>
              new MoveCommandAndResult(m.toMoveCommand(), m)
          )
      );
    }
    return legalMoves
      .filter(
        (move) =>
          isNone(move.result.takenPiece) ||
          move.result.takenPiece.unwrap().rank !== Rank.King
      )
      .filter(
        (move) =>
          move.result.kingLocationsMustNotBeInCheck.isNone() ||
          this.isCastlePathSafe(gameState, team, move.result)
      )
      .filter(
        (move) =>
          !this.isKingInCheck(
            this.applyMoveCommand(move.command, gameState, move.result),
            team
          )
      );
  };
  public static findLegalMovesCurry = (gs: GameState) => (t: Team) => {
    return ChessGame.findLegalMoves(gs, t);
  };
  public static isGameOver = (gameState: GameState): boolean => {
    return (
      gameState.status === GameStatus.Checkmate ||
      gameState.status === GameStatus.Draw ||
      gameState.status === GameStatus.Stalemate
    );
  };
  private static commandsEqual = (left: MoveCommand, right: MoveCommand): boolean =>
    left.source.isEqual(right.source) &&
    left.destination.isEqual(right.destination) &&
    ((left.promotionRank.isNone() && right.promotionRank.isNone()) ||
      (left.promotionRank.isSome() &&
        right.promotionRank.isSome() &&
        left.promotionRank.unwrap() === right.promotionRank.unwrap()));
  private static legalMoveForCommand = (
    gameState: GameState,
    command: MoveCommand
  ): MoveCommandAndResult | undefined =>
    ChessGame.findLegalMoves(gameState, gameState.currentPlayer).find((move) =>
      ChessGame.commandsEqual(move.command, command)
    );
  private static hasLegalEnPassantCapture = (gameState: GameState): boolean => {
    if (gameState.enPassantTarget.isNone()) {
      return false;
    }
    const target = gameState.enPassantTarget.unwrap();
    const team = gameState.currentPlayer;
    const direction = team === Team.White ? 1 : -1;
    const sourceRow = target.row - direction;
    for (const sourceCol of [target.col - 1, target.col + 1]) {
      if (Board.isRowColOOB(sourceRow, sourceCol)) {
        continue;
      }
      const source = new Loc(sourceRow, sourceCol);
      const movingPawn = gameState.board.pieceFromLoc(source);
      const capturedPawn = gameState.board.pieceFromRowCol(sourceRow, target.col);
      if (
        movingPawn.isNone() ||
        capturedPawn.isNone() ||
        movingPawn.unwrap().team !== team ||
        movingPawn.unwrap().rank !== Rank.Pawn ||
        capturedPawn.unwrap().team === team ||
        capturedPawn.unwrap().rank !== Rank.Pawn
      ) {
        continue;
      }
      const movedPawn = new ChessPiece(
        movingPawn.unwrap().id,
        team,
        Rank.Pawn,
        target,
        false
      );
      const board = gameState.board
        .updatePieceFromLoc(source, None)
        .updatePieceFromLoc(new Loc(sourceRow, target.col), None)
        .updatePieceFromLoc(target, Some(movedPawn));
      const afterCapture = new GameState(
        board,
        gameState.currentPlayer,
        gameState.commands,
        gameState.counter,
        gameState.status,
        gameState.castlingRights,
        None,
        gameState.halfmoveClock,
        gameState.fullmoveNumber
      );
      if (!ChessGame.isKingInCheck(afterCapture, team)) {
        return true;
      }
    }
    return false;
  };
  public static positionKey = (gameState: GameState): string => {
    const [placement, activeColor, castling] = gameToFEN(gameState).split(" ");
    const enPassant = ChessGame.hasLegalEnPassantCapture(gameState)
      ? gameState.enPassantTarget.unwrap().toNotation()
      : "-";
    return `${placement} ${activeColor} ${castling} ${enPassant}`;
  };
  public static insufficientMaterial = (gameState: GameState): boolean => {
    const nonKings = gameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece) => piece.rank !== Rank.King);
    if (nonKings.some((piece) =>
      piece.rank === Rank.Pawn || piece.rank === Rank.Rook || piece.rank === Rank.Queen
    )) {
      return false;
    }
    const knights = nonKings.filter((piece) => piece.rank === Rank.Knight);
    if (knights.length > 0) {
      return nonKings.length === 1;
    }
    const bishopColours = new Set(
      nonKings.map((piece) => (piece.position.row + piece.position.col) % 2)
    );
    return bishopColours.size <= 1;
  };
  public static automaticDrawReason = (
    gameState: GameState
  ): DrawReason | undefined => {
    if (ChessGame.insufficientMaterial(gameState)) {
      return DrawReason.InsufficientMaterial;
    }
    const repetitions = gameState.positionHistory.filter(
      (key) => key === ChessGame.positionKey(gameState)
    ).length;
    if (repetitions >= 5) {
      return DrawReason.FivefoldRepetition;
    }
    if (gameState.halfmoveClock >= 150) {
      return DrawReason.SeventyFiveMoveRule;
    }
    return undefined;
  };
  public static isSquareAttacked = (
    gameState: GameState,
    defendingTeam: Team,
    square: Loc
  ): boolean => {
    const attackingTeam =
      defendingTeam === Team.White ? Team.Black : Team.White;
    const attackers = gameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .filter((piece) => piece.team === attackingTeam);

    for (const piece of attackers) {
      const rowDelta = square.row - piece.position.row;
      const colDelta = square.col - piece.position.col;
      const absRow = Math.abs(rowDelta);
      const absCol = Math.abs(colDelta);
      if (
        piece.rank === Rank.Pawn &&
        rowDelta === (piece.team === Team.White ? 1 : -1) &&
        absCol === 1
      ) {
        return true;
      }
      if (piece.rank === Rank.Knight &&
        ((absRow === 1 && absCol === 2) || (absRow === 2 && absCol === 1))) {
        return true;
      }
      if (piece.rank === Rank.King && absRow <= 1 && absCol <= 1) {
        return true;
      }
      const movesStraight = rowDelta === 0 || colDelta === 0;
      const movesDiagonal = absRow === absCol;
      const canSlide =
        (movesStraight && (piece.rank === Rank.Rook || piece.rank === Rank.Queen)) ||
        (movesDiagonal && (piece.rank === Rank.Bishop || piece.rank === Rank.Queen));
      if (canSlide) {
        const rowStep = Math.sign(rowDelta);
        const colStep = Math.sign(colDelta);
        let row = piece.position.row + rowStep;
        let col = piece.position.col + colStep;
        let blocked = false;
        while (row !== square.row || col !== square.col) {
          if (isSome(gameState.board.pieceFromRowCol(row, col))) {
            blocked = true;
            break;
          }
          row += rowStep;
          col += colStep;
        }
        if (!blocked) {
          return true;
        }
      }
    }
    return false;
  };
  private static isCastlePathSafe = (
    gameState: GameState,
    team: Team,
    moveResult: MoveResult
  ): boolean => {
    const king = moveResult.sourcePieceRank;
    const locations = moveResult.kingLocationsMustNotBeInCheck.unwrap();
    return locations.every((location) => {
      const board = gameState.board
        .updatePieceFromLoc(king.position, None)
        .updatePieceFromLoc(
          location,
          Some(new ChessPiece(king.id, king.team, king.rank, location, false))
        );
      const state = new GameState(
        board,
        gameState.currentPlayer,
        gameState.commands,
        gameState.counter,
        gameState.status,
        gameState.castlingRights,
        gameState.enPassantTarget,
        gameState.halfmoveClock,
        gameState.fullmoveNumber
      );
      return !this.isSquareAttacked(state, team, location);
    });
  };
  public static isKingInCheck = (gameState: GameState, team: Team): boolean => {
    // Find the player's king on the updated board
    const king = gameState.board.squares
      .flat()
      .filter(isSome)
      .map(unwrap)
      .find(
        (piece: { team: Team; rank: Rank }) =>
          piece.team === team && piece.rank === Rank.King
      ) as ChessPiece;

    return this.isSquareAttacked(gameState, team, king.position);
  };

  public executeCommand = (cmd: MoveCommand): Result<ChessGame, string> => {
    if (ChessGame.isGameOver(this.gameState)) {
      return Err(`Invalid move: game is over (${this.gameState.status})`);
    }
    console.log(
      "Executing command",
      cmd.source.toNotation(),
      cmd.destination.toNotation()
    );
    const currentState = this.gameState;
    const currentPlayer = currentState.currentPlayer;
    // check the cmd source is the current player's piece
    const piece = currentState.board.pieceFromLoc(cmd.source);
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
    const legalMove = ChessGame.legalMoveForCommand(currentState, cmd);
    if (legalMove === undefined) {
      return Err("Invalid move: move is not legal");
    }
    const enemyPlayer = currentPlayer === Team.White ? Team.Black : Team.White;
    let updatedState = ChessGame.applyMoveCommand(
      cmd,
      currentState,
      legalMove.result
    );
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
      updatedState = updatedState.updateDraw(DrawReason.Stalemate);
    } else if (enemyKingChecked) {
      console.log("Check");
      updatedState = updatedState.updateStatus(GameStatus.Check);
    }
    const automaticDraw = ChessGame.automaticDrawReason(updatedState);
    if (!checkMate && automaticDraw !== undefined) {
      updatedState = updatedState.updateDraw(automaticDraw);
    }
    // Lastly update the game state from updatedState
    this.gameState = updatedState;
    return Ok(this);
  };
  public canClaimDraw = (command?: MoveCommand): DrawReason | undefined => {
    if (ChessGame.isGameOver(this.gameState)) {
      return undefined;
    }
    const state = command === undefined
      ? this.gameState
      : (() => {
          const legalMove = ChessGame.legalMoveForCommand(this.gameState, command);
          return legalMove === undefined
            ? undefined
            : ChessGame.applyMoveCommand(command, this.gameState, legalMove.result);
        })();
    if (state === undefined) {
      return undefined;
    }
    const repetitions = state.positionHistory.filter(
      (key) => key === ChessGame.positionKey(state)
    ).length;
    if (repetitions >= 3) {
      return DrawReason.ThreefoldRepetition;
    }
    if (state.halfmoveClock >= 100) {
      return DrawReason.FiftyMoveRule;
    }
    return undefined;
  };
  public claimDraw = (command?: MoveCommand): Result<ChessGame, string> => {
    const reason = this.canClaimDraw(command);
    if (reason === undefined) {
      return Err("Draw cannot be claimed in this position");
    }
    this.gameState = this.gameState.updateDraw(reason);
    return Ok(this);
  };
  public getCurrentFen = () => {
    return gameToFEN(this.gameState);
  };

  // #endregion Properties (12)

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

  // #region Public Static Methods (1)

  public static SANMovesToChessGame(
    moves: string[]
  ): Result<ChessGame, string> {
    let game = new ChessGame();

    for (const move of moves) {
      console.log(move);
      // get legal moves
      const legalMoves = ChessGame.findLegalMoves(
        game.gameState,
        game.gameState.currentPlayer
      );
      // extract info from SAN move
      const sanCmdOption = Loc.fromSAN(move);
      if (sanCmdOption.isNone()) {
        console.error("Ambiguous move", move);
        return Err(`Invalid move ${move}`);
      }
      // unwrap SAN move
      const sanCmd: StandardAlgebraicNotationMove = sanCmdOption.unwrap();
      // filter castle moves
      const filterIfCastleMove = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        // eslint-disable-next-line no-debugger
        if (
          sanMove.kingSideCastle.isNone() &&
          sanMove.queenSideCastle.isNone()
        ) {
          return true;
        }
        const kingSideCastleDestinations = [
          Loc.fromNotation("g1").unwrap(),
          Loc.fromNotation("g8").unwrap(),
        ];
        const queenSideCastleDestinations = [
          Loc.fromNotation("c1").unwrap(),
          Loc.fromNotation("c8").unwrap(),
        ];
        if (sanMove.kingSideCastle.isSome()) {
          return (
            kingSideCastleDestinations.filter(
              (d) =>
                m.command.destination.isEqual(d) &&
                m.result.sourcePieceRank.rank === Rank.King
            ).length > 0
          );
        }
        if (sanMove.queenSideCastle.isSome()) {
          return (
            queenSideCastleDestinations.filter(
              (d) =>
                m.command.destination.isEqual(d) &&
                m.result.sourcePieceRank.rank === Rank.King
            ).length > 0
          );
        }
        return true;
      };
      // filterMovesWithDestination
      const filterIfDestination = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        if (sanCmd.destination.isNone()) {
          return true;
        }
        return m.command.destination.isEqual(sanMove.destination.unwrap());
      };
      // filter Moves with source column
      const filterIfSourceColumn = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        if (sanCmd.sourceColumn.isNone()) {
          return true;
        }
        return m.command.source.col === sanMove.sourceColumn.unwrap();
      };
      // filter Moves with source row
      const filterIfSourceRow = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        if (sanCmd.sourceRow.isNone()) {
          return true;
        }
        return m.command.source.row === sanMove.sourceRow.unwrap();
      };
      // filter moves with source piece rank
      const filterIfSourceRank = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        if (sanCmd.sourcePieceRank.isNone()) {
          return true;
        }
        return (
          m.result.sourcePieceRank.rank === sanMove.sourcePieceRank.unwrap() &&
          m.command.destination.isEqual(sanMove.destination.unwrap())
        );
      };
      // filter moves with pawn promotion
      const filterIfPawnPromotion = (
        m: MoveCommandAndResult,
        sanMove: StandardAlgebraicNotationMove
      ) => {
        if (sanMove.promotionRank.isNone()) {
          return true;
        }
        return (
          m.result.sourcePieceRank.rank === Rank.Pawn &&
          m.command.promotionRank.isSome() &&
          m.command.promotionRank.unwrap() === sanMove.promotionRank.unwrap()
        );
      };
      // reduce to move with lowest rank value if multiple moves
      const reduceToLowestRankValue = (
        m: MoveCommandAndResult,
        n: MoveCommandAndResult
      ) => {
        return rankValue(m.result.sourcePieceRank.rank) <=
          rankValue(n.result.sourcePieceRank.rank)
          ? m
          : n;
      };
      // filter legal moves by SAN move
      const moveCommands: MoveCommandAndResult[] = legalMoves
        .filter((m) => filterIfCastleMove(m, sanCmd))
        .filter((m) => filterIfDestination(m, sanCmd))
        .filter((m) => filterIfSourceColumn(m, sanCmd))
        .filter((m) => filterIfSourceRow(m, sanCmd))
        .filter((m) => filterIfSourceRank(m, sanCmd))
        .filter((m) => filterIfPawnPromotion(m, sanCmd));
      if (moveCommands.length === 0) {
        console.error("No legal moves", move);
        return Err(`Invalid move ${move}`);
      } else if (moveCommands.length > 1) {
        // filter by lowest rank value
        const lowestRankValueMove = moveCommands.reduce(
          reduceToLowestRankValue
        );
        // execute move
        const moveCmd = lowestRankValueMove;
        const result = game.executeCommand(moveCmd.command);
        // print board state
        if (result.isError()) {
          console.error("Invalid move", move);
          return Err(`Invalid move ${move}`);
        } else {
          game = result.data;
          game.gameState.board.print();
        }
      } else if (moveCommands.length === 1) {
        // execute move
        const moveCmd = moveCommands[0].command;
        const result = game.executeCommand(moveCmd);
        // print board state
        if (result.isError()) {
          console.error("Invalid move", move);
          return Err(`Invalid move ${move}`);
        } else {
          game = result.data;
          game.gameState.board.print();
        }
      }
    }
    return Ok(game);
  }

  // #endregion Public Static Methods (1)

  // #region Public Methods (1)

  public async moveMinimax(team: Team): Promise<Result<ChessGame, string>> {
    const gameState = this.gameState;
    const drawReason = this.canClaimDraw();
    if (drawReason !== undefined) {
      return this.claimDraw();
    }
    const possibleMoves = ChessGame.findLegalMoves(gameState, team);

    if (possibleMoves.length > 0) {
      const bestMove = findBestMoveMinimax(
        gameState,
        team,
        3,
        3 * 1000
      );
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
