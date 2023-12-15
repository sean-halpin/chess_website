// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { Rank, ChessPiece, IChessPiece } from "./Piece";
import { GameCommand, BoardLocation } from "./GameCommand";
import "./Game.css";

type PieceColor = "white" | "black";

const createPiece = (
  color: PieceColor,
  position: BoardLocation,
  rank: Rank,
  i: number
): ChessPiece => ({
  id: `${color}-${rank}-${i}`,
  rank,
  color,
  position,
  firstMove: true,
});

const createPiecesOrder = (): Rank[] => [
  "castle",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "castle",
];

const createPieces = (color: PieceColor, row: number): ChessPiece[] =>
  Array.from({ length: 8 }, (_, column) =>
    createPiece(
      color,
      new BoardLocation(row, column),
      column === 3
        ? "queen"
        : column === 4
        ? "king"
        : createPiecesOrder()[column],
      column
    )
  );

const createPawns = (): ChessPiece[] =>
  Array.from({ length: 16 }, (_, column) =>
    createPiece(
      column < 8 ? "white" : "black",
      new BoardLocation(column < 8 ? 1 : 6, column % 8),
      "pawn",
      column % 8
    )
  );

const placeBackRow = (): ChessPiece[] => [
  ...createPieces("white", 0),
  ...createPieces("black", 7),
];

type ChessBoard = ChessPiece[][];
interface MoveResult {
  destination: BoardLocation;
  movingPiece: ChessPiece;
  takenPiece: ChessPiece;
  enPassantPossible?: Boolean;
}
type CommandResult = MoveResult | null;

export interface GameState {
  board: ChessBoard;
  currentPlayer: "white" | "black";
  winner?: "white" | "black" | "draw";
  commands: CommandResult[];
}

export const ChessGame: React.FC = () => {
  const pieces: ChessPiece[] = [...createPawns(), ...placeBackRow()];
  const initialBoard: ChessBoard = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );
  pieces.forEach((p) => {
    if (p) {
      initialBoard[p.position.row][p.position.col] = p;
    }
  });
  const [gameState, setGameState] = useState<GameState>({
    board: initialBoard,
    currentPlayer: "white",
    commands: [],
  });

  const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
  const isSquareEmpty = (r: number, c: number, b: ChessBoard) =>
    !isOOB(r, c) && b[r][c] == null;
  const isSquareAttackable = (
    r: number,
    c: number,
    b: ChessBoard,
    mP: IChessPiece
  ): ChessPiece | null =>
    !isOOB(r, c) && b[r][c]?.color !== mP.color ? b[r][c] : null;

  const findLegalPawnMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    const currentBoard = gameState.board;
    const teamDirection = movingPiece.color === "white" ? 1 : -1;
    const { row: movingPieceCurrentRow, col: movingPieceCurrentCol } =
      movingPiece.position;

    // Pawn advance 1
    const nextRow = movingPieceCurrentRow + 1 * teamDirection;
    if (isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)) {
      moveResults.push({
        destination: new BoardLocation(nextRow, movingPieceCurrentCol),
        movingPiece,
        takenPiece: null,
      });
    }

    // Pawn sideways attack
    const attackableCol = (column_offset: number) =>
      movingPieceCurrentCol + column_offset;
    const attackableRow = nextRow;
    if (
      isSquareAttackable(
        attackableRow,
        attackableCol(1),
        currentBoard,
        movingPiece
      )
    ) {
      moveResults.push({
        destination: new BoardLocation(attackableRow, attackableCol(1)),
        movingPiece,
        takenPiece: currentBoard[attackableRow][attackableCol(1)],
      });
    }
    if (
      isSquareAttackable(
        attackableRow,
        attackableCol(-1),
        currentBoard,
        movingPiece
      )
    ) {
      moveResults.push({
        destination: new BoardLocation(attackableRow, attackableCol(-1)),
        movingPiece,
        takenPiece: currentBoard[attackableRow][attackableCol(-1)],
      });
    }

    // Pawn advance 2 on first move
    const doubleMoveRow = nextRow + 1 * teamDirection;
    if (
      movingPiece.firstMove &&
      isSquareEmpty(doubleMoveRow, movingPieceCurrentCol, currentBoard) &&
      isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)
    ) {
      moveResults.push({
        destination: new BoardLocation(doubleMoveRow, movingPieceCurrentCol),
        movingPiece,
        takenPiece: null,
        enPassantPossible: true,
      });
    }

    // En Passant
    const lastCommand = gameState.commands[gameState.commands.length - 1];
    if (gameState.commands.length > 0 && lastCommand?.enPassantPossible) {
      const enPassantAttackable = (column_offset: number) =>
        isSquareAttackable(
          movingPieceCurrentRow,
          movingPieceCurrentCol + column_offset,
          currentBoard,
          movingPiece
        )?.rank === "pawn";
      if (enPassantAttackable(-1)) {
        moveResults.push({
          destination: new BoardLocation(attackableRow, attackableCol(-1)),
          movingPiece,
          takenPiece:
            currentBoard[movingPieceCurrentRow][movingPieceCurrentCol - 1],
        });
      }
      if (enPassantAttackable(1)) {
        moveResults.push({
          destination: new BoardLocation(attackableRow, attackableCol(1)),
          movingPiece,
          takenPiece:
            currentBoard[movingPieceCurrentRow][movingPieceCurrentCol + 1],
        });
      }
    }

    return moveResults;
  };

  const findMovesInDirection = (
    movingPiece: IChessPiece,
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
    while (!isOOB(newRow, newCol) && count < maximumDistance) {
      count += 1;
      if (isSquareEmpty(newRow, newCol, currentBoard)) {
        moveResults.push({
          destination: new BoardLocation(newRow, newCol),
          movingPiece,
          takenPiece: null,
        });
      }

      const attackedPiece = isSquareAttackable(
        newRow,
        newCol,
        currentBoard,
        movingPiece
      );

      if (attackedPiece) {
        moveResults.push({
          destination: new BoardLocation(newRow, newCol),
          movingPiece,
          takenPiece: attackedPiece,
        });
        break;
      }

      newRow += rowOffset;
      newCol += colOffset;
    }

    return moveResults;
  };

  const findHorVerMoves = (
    movingPiece: IChessPiece,
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
    movingPiece: IChessPiece,
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

  const findLegalCastleMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return findHorVerMoves(movingPiece, gameState);
  };

  const findLegalBishopMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return findDiagonalMoves(movingPiece, gameState);
  };

  const findLegalQueenMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return [
      ...findHorVerMoves(movingPiece, gameState),
      ...findDiagonalMoves(movingPiece, gameState),
    ];
  };

  const findLegalKingMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return [
      ...findHorVerMoves(movingPiece, gameState, 1),
      ...findDiagonalMoves(movingPiece, gameState, 1),
    ];
  };

  const findLegalKnightMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, 2, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, -2, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, -1, 2, 1));
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -1, -2, 1)
    );
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, 1, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, -1, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, -2, 1, 1));
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -2, -1, 1)
    );

    return moveResults;
  };

  const executeCommand = (
    cmd: GameCommand,
    gameState: GameState
  ): CommandResult => {
    switch (cmd.command) {
      case "move":
        let moving_piece = gameState.board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);

        if (gameState.currentPlayer !== moving_piece?.color || !moving_piece) {
          return null;
        }

        const moveFunctions = {
          pawn: findLegalPawnMoves,
          castle: findLegalCastleMoves,
          knight: findLegalKnightMoves,
          bishop: findLegalBishopMoves,
          queen: findLegalQueenMoves,
          king: findLegalKingMoves,
        };

        const moveFunction = moveFunctions[moving_piece.rank];
        if (moveFunction) {
          const moves = moveFunction(moving_piece, gameState);
          const validMove = moves.find((result) =>
            result.destination.isEqual(cmd.destination)
          );
          if (validMove) return validMove;
        }
        break;

      case "resign":
        break;

      default:
        break;
    }
    return null;
  };

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        console.log(`[Game] New Command: ${newCommand.command}`);
        const updatedBoard = [...gameState.board.map((row) => [...row])]; // Create a copy of the board
        const cmdResult: CommandResult = executeCommand(newCommand, gameState);
        if (cmdResult) {
          // Remove taken piece
          let takenPiece = cmdResult.takenPiece;
          if (takenPiece) {
            updatedBoard[takenPiece.position.row][takenPiece.position.col] =
              null;
            takenPiece = null;
          }
          // Update moving piece
          const movingPiece = cmdResult.movingPiece;
          if (movingPiece) {
            movingPiece.position = cmdResult.destination;
            movingPiece.firstMove = false;
            updatedBoard[newCommand.source.row][newCommand.source.col] = null;
            updatedBoard[movingPiece.position.row][movingPiece.position.col] =
              movingPiece;
          }
          // Push Latest Command Result
          gameState.commands.push(cmdResult);
          // Update GameState
          const updatedGameState: GameState = {
            board: updatedBoard,
            currentPlayer:
              gameState.currentPlayer === "white" ? "black" : "white",
            commands: gameState.commands,
          };
          setGameState(updatedGameState);
        }
        break;
      case "resign":
        console.log(`[Game] New Command: ${newCommand.command}`);
        break;
      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };

  if (gameState) {
    console.log(gameState.board.flat());
    return (
      <div>
        <h1>Chess Game</h1>
        <DndProvider backend={HTML5Backend}>
          <Board
            pieces={gameState.board.flat()}
            sendGameCommand={sendGameCommand}
          />
        </DndProvider>
      </div>
    );
  } else {
    return <></>;
  }
};
