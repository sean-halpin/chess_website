import { None, Some, isSome, unwrap } from "../rust_types/Option";
import { isSquareEmpty, isSquareEmptyNotation, squareEntry } from "./ChessGame";
import { MoveResult } from "./MoveResult";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";
import { Team } from "./Team";
import { Rank } from "./Rank";
import { GameState } from "./GameState";
import { Board } from "./Board";

const findMovesInDirection = (
  movingPiece: ChessPiece,
  gameState: GameState,
  rowOffset: number,
  colOffset: number,
  maximumDistance = 8
): MoveResult[] => {
  const moveResults: MoveResult[] = [];
  const currentBoard = gameState.board;
  const { row, col } = movingPiece.position;

  let newRow = row + rowOffset;
  let newCol = col + colOffset;

  let count = 0;
  let shouldExit = false;
  while (
    !Board.isRowColOOB(newRow, newCol) &&
    count < maximumDistance &&
    !shouldExit
  ) {
    count += 1;
    const possiblePiece = currentBoard.pieceFromRowCol(newRow, newCol);
    if (isSome(possiblePiece)) {
      if (unwrap(possiblePiece).team !== movingPiece.team) {
        moveResults.push(
          new MoveResult(
            new Loc(newRow, newCol),
            movingPiece,
            currentBoard.pieceFromRowCol(newRow, newCol)
          )
        );
      }
      shouldExit = true;
    } else {
      moveResults.push(
        new MoveResult(new Loc(newRow, newCol), movingPiece, None)
      );
    }

    newRow += rowOffset;
    newCol += colOffset;
  }
  return moveResults;
};

const findHorVerMoves = (
  movingPiece: ChessPiece,
  gameState: GameState,
  maximumDistance = 8
): MoveResult[] => {
  const moveResults: MoveResult[] = [];

  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, 0, 1, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, 0, -1, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, 1, 0, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, -1, 0, maximumDistance)
  );

  return moveResults;
};

const findDiagonalMoves = (
  movingPiece: ChessPiece,
  gameState: GameState,
  maximumDistance = 8
): MoveResult[] => {
  const moveResults: MoveResult[] = [];

  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, 1, 1, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, 1, -1, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, -1, 1, maximumDistance)
  );
  moveResults.push(
    ...findMovesInDirection(movingPiece, gameState, -1, -1, maximumDistance)
  );

  return moveResults;
};

const findLegalPawnMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  const moveResults: MoveResult[] = [];
  const currentBoard = gameState.board;
  const teamDirection = movingPiece.team === Team.White ? 1 : -1;
  const { row: movingPieceCurrentRow, col: movingPieceCurrentCol } =
    movingPiece.position;

  // Pawn advance 1
  const nextRow = movingPieceCurrentRow + 1 * teamDirection;
  if (isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)) {
    moveResults.push(
      new MoveResult(new Loc(nextRow, movingPieceCurrentCol), movingPiece, None)
    );
  }

  // Pawn sideways attack
  const attackableCol = (column_offset: number) =>
    movingPieceCurrentCol + column_offset;
  const attackableRow = nextRow;
  const possiblePieceRight = squareEntry(
    attackableRow,
    attackableCol(1),
    currentBoard
  );
  if (
    isSome(possiblePieceRight) &&
    possiblePieceRight.unwrap().team !== movingPiece.team
  ) {
    moveResults.push(
      new MoveResult(
        new Loc(attackableRow, attackableCol(1)),
        movingPiece,
        currentBoard.pieceFromRowCol(attackableRow, attackableCol(1))
      )
    );
  }
  const possiblePieceLeft = squareEntry(
    attackableRow,
    attackableCol(-1),
    currentBoard
  );
  if (
    isSome(possiblePieceLeft) &&
    possiblePieceLeft.unwrap().team !== movingPiece.team
  ) {
    moveResults.push(
      new MoveResult(
        new Loc(attackableRow, attackableCol(-1)),
        movingPiece,
        currentBoard.pieceFromRowCol(attackableRow, attackableCol(-1))
      )
    );
  }

  // Pawn advance 2 on first move
  const doubleMoveRow = nextRow + 1 * teamDirection;
  const startingPawnRow = movingPiece.team === Team.White ? 1 : 6;
  if (
    movingPieceCurrentRow === startingPawnRow &&
    isSquareEmpty(doubleMoveRow, movingPieceCurrentCol, currentBoard) &&
    isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)
  ) {
    moveResults.push(
      new MoveResult(
        new Loc(doubleMoveRow, movingPieceCurrentCol),
        movingPiece,
        None,
        true
      )
    );
  }

  // En Passant
  if (gameState.enPassantTarget.isSome()) {
    const target = gameState.enPassantTarget.unwrap();
    const adjacentPawn = squareEntry(
      movingPieceCurrentRow,
      target.col,
      currentBoard
    );
    if (
      target.row === attackableRow &&
      Math.abs(target.col - movingPieceCurrentCol) === 1 &&
      isSquareEmpty(target.row, target.col, currentBoard) &&
      isSome(adjacentPawn) &&
      adjacentPawn.unwrap().rank === Rank.Pawn &&
      adjacentPawn.unwrap().team !== movingPiece.team
    ) {
      moveResults.push(new MoveResult(target, movingPiece, adjacentPawn));
    }
  }
  const promotionRanks = [Rank.Queen, Rank.Rook, Rank.Bishop, Rank.Knight];
  return moveResults.flatMap((move) =>
    move.destination.row === 0 || move.destination.row === 7
      ? promotionRanks.map(
          (promotionRank) =>
            new MoveResult(
              move.destination,
              move.sourcePieceRank,
              move.takenPiece,
              move.enPassantPossible,
              move.kingLocationsMustNotBeInCheck,
              move.rookSrcDestCastling,
              Some(promotionRank)
            )
        )
      : [move]
  );
};

const findLegalCastleMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return findHorVerMoves(movingPiece, gameState);
};

const findLegalBishopMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return findDiagonalMoves(movingPiece, gameState);
};

const findLegalQueenMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return [
    ...findHorVerMoves(movingPiece, gameState),
    ...findDiagonalMoves(movingPiece, gameState),
  ];
};

const findLegalKingMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  const moveResults: MoveResult[] = [];
  moveResults.push(
    ...findHorVerMoves(movingPiece, gameState, 1),
    ...findDiagonalMoves(movingPiece, gameState, 1)
  );

  // Handle Queen side Castling
  const team = movingPiece.team;
  const row = team === Team.White ? "1" : "8";
  const kingLoc = Loc.fromNotation(`e${row}`).unwrap();
  const queenSideRookLoc = Loc.fromNotation(`a${row}`).unwrap();
  const maybeKing = gameState.board.pieceFromLoc(kingLoc);
  const maybeQueenSideRook = gameState.board.pieceFromLoc(queenSideRookLoc);
  if (maybeKing.isSome() && maybeQueenSideRook.isSome()) {
    const king = maybeKing.unwrap();
    const rook = maybeQueenSideRook.unwrap();
    const queenSideRight =
      team === Team.White
        ? gameState.castlingRights.whiteQueenSide
        : gameState.castlingRights.blackQueenSide;
    if (
      queenSideRight &&
      king.team === team &&
      rook.team === team &&
      king.position.isEqual(kingLoc) &&
      king.rank === Rank.King &&
      rook.rank === Rank.Rook
    ) {
      const row = team === Team.White ? "1" : "8";
      const isD1Empty = isSquareEmptyNotation(`d${row}`, gameState.board);
      const isC1Empty = isSquareEmptyNotation(`c${row}`, gameState.board);
      const isB1Empty = isSquareEmptyNotation(`b${row}`, gameState.board);
      if (isD1Empty && isC1Empty && isB1Empty) {
        moveResults.push(
          new MoveResult(
            Loc.fromNotation(`c${row}`).unwrap(),
            king,
            None,
            false,
            Some([
              Loc.fromNotation(`e${row}`).unwrap(),
              Loc.fromNotation(`c${row}`).unwrap(),
              Loc.fromNotation(`d${row}`).unwrap(),
            ]),
            Some({
              src: Loc.fromNotation(`a${row}`).unwrap(),
              dest: Loc.fromNotation(`d${row}`).unwrap(),
            })
          )
        );
      }
    }
  }
  // Handle King side Castling
  const kingSideRookLoc = Loc.fromNotation(`h${row}`).unwrap();
  const maybeKingSideRook = gameState.board.pieceFromLoc(kingSideRookLoc);
  if (maybeKing.isSome() && maybeKingSideRook.isSome()) {
    const king = maybeKing.unwrap();
    const rook = maybeKingSideRook.unwrap();
    const kingSideRight =
      team === Team.White
        ? gameState.castlingRights.whiteKingSide
        : gameState.castlingRights.blackKingSide;
    if (
      kingSideRight &&
      king.team === team &&
      rook.team === team &&
      king.position.isEqual(kingLoc) &&
      king.rank === Rank.King &&
      rook.rank === Rank.Rook
    ) {
      const row = team === Team.White ? "1" : "8";
      const isG1Empty = isSquareEmptyNotation(`g${row}`, gameState.board);
      const isF1Empty = isSquareEmptyNotation(`f${row}`, gameState.board);
      if (isG1Empty && isF1Empty) {
        moveResults.push(
          new MoveResult(
            Loc.fromNotation(`g${row}`).unwrap(),
            king,
            None,
            false,
            Some([
              Loc.fromNotation(`g${row}`).unwrap(),
              Loc.fromNotation(`f${row}`).unwrap(),
              Loc.fromNotation(`e${row}`).unwrap(),
            ]),
            Some({
              src: Loc.fromNotation(`h${row}`).unwrap(),
              dest: Loc.fromNotation(`f${row}`).unwrap(),
            })
          )
        );
      }
    }
  }
  return moveResults;
};

const findLegalKnightMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  const moveResults: MoveResult[] = [];
  moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, 2, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, -2, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, -1, 2, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, -1, -2, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, 1, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, -1, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, -2, 1, 1));
  moveResults.push(...findMovesInDirection(movingPiece, gameState, -2, -1, 1));

  return moveResults;
};

export const moveFunctions = {
  pawn: findLegalPawnMoves,
  rook: findLegalCastleMoves,
  knight: findLegalKnightMoves,
  bishop: findLegalBishopMoves,
  queen: findLegalQueenMoves,
  king: findLegalKingMoves,
};
