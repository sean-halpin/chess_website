import {
  BoardLocation,
  ChessPiece,
  GameState,
  MoveResult,
  Rank,
  Team,
  isOOB,
  isSquareEmpty,
  squareEntry,
} from "./ChessGameLogic";

export const findLegalPawnMoves = (
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
      new MoveResult(
        new BoardLocation(nextRow, movingPieceCurrentCol),
        movingPiece,
        null,
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
    possiblePieceRight !== null &&
    possiblePieceRight?.team !== movingPiece.team
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
    possiblePieceLeft !== null &&
    possiblePieceLeft?.team !== movingPiece.team
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
        null,
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
        possiblePiece?.rank === Rank.Pawn &&
        possiblePiece?.team !== movingPiece.team
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

const findMovesInDirection = (
  movingPiece: ChessPiece,
  gameState: GameState,
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
    if (isSquareEmpty(newRow, newCol, currentBoard)) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(newRow, newCol),
          movingPiece,
          null,
          false
        )
      );
    }

    const possiblePiece = squareEntry(newRow, newCol, currentBoard);

    if (possiblePiece) {
      if (possiblePiece?.team !== movingPiece.team) {
        moveResults.push(
          new MoveResult(
            new BoardLocation(newRow, newCol),
            movingPiece,
            possiblePiece,
            false
          )
        );
      }
      shouldExit = true;
    }
    newRow += rowOffset;
    newCol += colOffset;
  }
  return moveResults;
};

const findHorVerMoves = (
  movingPiece: ChessPiece,
  gameState: GameState,
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
  gameState: GameState,
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

export const findLegalCastleMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return findHorVerMoves(movingPiece, gameState);
};

export const findLegalBishopMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return findDiagonalMoves(movingPiece, gameState);
};

export const findLegalQueenMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return [
    ...findHorVerMoves(movingPiece, gameState),
    ...findDiagonalMoves(movingPiece, gameState),
  ];
};

export const findLegalKingMoves = (
  movingPiece: ChessPiece,
  gameState: GameState
): MoveResult[] => {
  return [
    ...findHorVerMoves(movingPiece, gameState, 1),
    ...findDiagonalMoves(movingPiece, gameState, 1),
  ];
};

export const findLegalKnightMoves = (
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
