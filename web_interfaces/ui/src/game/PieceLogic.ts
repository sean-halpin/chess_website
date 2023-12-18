import { None, isSome, unwrap } from "../types/Option";
import { ChessGame, isOOB, isSquareEmpty, squareEntry } from "./ChessGameLogic";
import { BoardLocation, ChessPiece, MoveResult } from "./ChessGameTypes";
import { Team } from "./ChessGameTypes";
import { Rank } from "./ChessGameTypes";

const findMovesInDirection = (
  movingPiece: ChessPiece,
  gameState: ChessGame,
  rowOffset: number,
  colOffset: number,
  maximumDistance: number = 8
): MoveResult[] => {
  const moveResults: MoveResult[] = [];
  const currentBoard = gameState.board;
  const { row, col } = movingPiece.position;

  let newRow = row + rowOffset;
  let newCol = col + colOffset;

  let count = 0;
  let shouldExit = false;
  while (!isOOB(newRow, newCol) && count < maximumDistance && !shouldExit) {
    count += 1;
    const possiblePiece = currentBoard[newRow][newCol];
    if (isSome(possiblePiece)) {
      if (unwrap(possiblePiece).team !== movingPiece.team) {
        moveResults.push(
          new MoveResult(
            new BoardLocation(newRow, newCol),
            movingPiece,
            currentBoard[newRow][newCol],
            false
          )
        );
      }
      shouldExit = true;
    } else {
      moveResults.push(
        new MoveResult(
          new BoardLocation(newRow, newCol),
          movingPiece,
          None,
          false
        )
      );
    }

    newRow += rowOffset;
    newCol += colOffset;
  }
  return moveResults;
};

const findHorVerMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame,
  maximumDistance: number = 8
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
  gameState: ChessGame,
  maximumDistance: number = 8
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

export const findLegalPawnMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
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
      new MoveResult(
        new BoardLocation(nextRow, movingPieceCurrentCol),
        movingPiece,
        None,
        false
      )
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
    unwrap(possiblePieceRight).team !== movingPiece.team
  ) {
    moveResults.push(
      new MoveResult(
        new BoardLocation(attackableRow, attackableCol(1)),
        movingPiece,
        currentBoard[attackableRow][attackableCol(1)],
        false
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
    unwrap(possiblePieceLeft).team !== movingPiece.team
  ) {
    moveResults.push(
      new MoveResult(
        new BoardLocation(attackableRow, attackableCol(-1)),
        movingPiece,
        currentBoard[attackableRow][attackableCol(-1)],
        false
      )
    );
  }

  // Pawn advance 2 on first move
  const doubleMoveRow = nextRow + 1 * teamDirection;
  if (
    movingPiece.firstMove &&
    isSquareEmpty(doubleMoveRow, movingPieceCurrentCol, currentBoard) &&
    isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)
  ) {
    moveResults.push(
      new MoveResult(
        new BoardLocation(doubleMoveRow, movingPieceCurrentCol),
        movingPiece,
        None,
        true
      )
    );
  }

  // En Passant
  const lastCommand = gameState.commands[gameState.commands.length - 1];
  if (gameState.commands.length > 0 && lastCommand?.enPassantPossible) {
    const enPassantAttackable = (column_offset: number) => {
      const possiblePiece = squareEntry(
        movingPieceCurrentRow,
        movingPieceCurrentCol + column_offset,
        currentBoard
      );
      return (
        isSome(possiblePiece) &&
        unwrap(possiblePiece).rank === Rank.Pawn &&
        unwrap(possiblePiece).team !== movingPiece.team
      );
    };
    if (enPassantAttackable(-1)) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(attackableRow, attackableCol(-1)),
          movingPiece,
          currentBoard[movingPieceCurrentRow][movingPieceCurrentCol - 1],
          false
        )
      );
    }
    if (enPassantAttackable(1)) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(attackableRow, attackableCol(1)),
          movingPiece,
          currentBoard[movingPieceCurrentRow][movingPieceCurrentCol + 1],
          false
        )
      );
    }
  }
  return moveResults;
};

export const findLegalCastleMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
): MoveResult[] => {
  return findHorVerMoves(movingPiece, gameState);
};

export const findLegalBishopMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
): MoveResult[] => {
  return findDiagonalMoves(movingPiece, gameState);
};

export const findLegalQueenMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
): MoveResult[] => {
  return [
    ...findHorVerMoves(movingPiece, gameState),
    ...findDiagonalMoves(movingPiece, gameState),
  ];
};

export const findLegalKingMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
): MoveResult[] => {
  return [
    ...findHorVerMoves(movingPiece, gameState, 1),
    ...findDiagonalMoves(movingPiece, gameState, 1),
  ];
};

export const findLegalKnightMoves = (
  movingPiece: ChessPiece,
  gameState: ChessGame
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
