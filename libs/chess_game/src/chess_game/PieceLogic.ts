import { None, Some, isSome, unwrap } from "../types/Option";
import {
  isSquareEmpty,
  isSquareEmptyNotation,
  squareEntry,
} from "./ChessGame";
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
  while (!Board.isRowColOOB(newRow, newCol) && count < maximumDistance && !shouldExit) {
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
  if (
    movingPiece.firstMove &&
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
        possiblePiece.unwrap().rank === Rank.Pawn &&
        possiblePiece.unwrap().team !== movingPiece.team
      );
    };
    if (enPassantAttackable(-1)) {
      moveResults.push(
        new MoveResult(
          new Loc(attackableRow, attackableCol(-1)),
          movingPiece,
          currentBoard.pieceFromRowCol(
            movingPieceCurrentRow,
            movingPieceCurrentCol - 1
          )
        )
      );
    }
    if (enPassantAttackable(1)) {
      moveResults.push(
        new MoveResult(
          new Loc(attackableRow, attackableCol(1)),
          movingPiece,
          currentBoard.pieceFromRowCol(
            movingPieceCurrentRow,
            movingPieceCurrentCol + 1
          )
        )
      );
    }
  }
  return moveResults;
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
  const cP = gameState.currentPlayer;
  const row = cP === Team.White ? "1" : "8";
  const kingLoc = Loc.fromNotation(`e${row}`).unwrap();
  const queenSideRookLoc = Loc.fromNotation(`a${row}`).unwrap();
  const maybeKing = gameState.board.pieceFromLoc(kingLoc);
  const maybeQueenSideRook = gameState.board.pieceFromLoc(queenSideRookLoc);
  if (maybeKing.isSome() && maybeQueenSideRook.isSome()) {
    const king = maybeKing.unwrap();
    const rook = maybeQueenSideRook.unwrap();
    if (king.firstMove && rook.firstMove) {
      const row = cP === Team.White ? "1" : "8";
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
    if (king.firstMove && rook.firstMove) {
      const row = cP === Team.White ? "1" : "8";
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
