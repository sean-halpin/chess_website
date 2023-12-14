// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { Rank, ChessPiece, IChessPiece } from "./Piece";
import { GameCommand, BoardLocation } from "./GameCommand";

type PieceColor = "white" | "black";

const createPiece = (
  color: PieceColor,
  row: number,
  rank: Rank,
  i: number
): ChessPiece => ({
  id: `${color}-${rank}-${i}`,
  rank,
  color,
  position: { row, col: i },
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
  Array.from({ length: 8 }, (_, i) =>
    createPiece(
      color,
      row,
      i === 3 ? "queen" : i === 4 ? "king" : createPiecesOrder()[i],
      i
    )
  );

const createPawns = (): ChessPiece[] =>
  Array.from({ length: 16 }, (_, i) =>
    createPiece(i < 8 ? "white" : "black", i < 8 ? 1 : 6, "pawn", i % 8)
  );

const placeBackRow = (): ChessPiece[] => [
  ...createPieces("white", 0),
  ...createPieces("black", 7),
];

type ChessBoard = ChessPiece[][];

export interface GameState {
  board: ChessBoard;
  currentPlayer: "white" | "black";
  winner?: "white" | "black" | "draw";
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
  });

  const findLegalPawnMoves = (
    movingPiece: IChessPiece,
    src: BoardLocation,
    dest: BoardLocation,
    currentBoard: ChessBoard
  ): BoardLocation[] => {
    const dests: BoardLocation[] = [];
    const teamDirection = movingPiece.color === "white" ? 1 : -1;
    const { row, col } = movingPiece.position;

    const isOOB = (r: number, c: number) => {
      return r < 0 || r > 7 || c < 0 || c > 7;
    };
    const isSquareEmpty = (r: number, c: number) => {
      return !isOOB(r, c) && currentBoard[r][c] == null;
    };
    const isSquareAttackable = (r: number, c: number) => {
      return (
        !isOOB(r, c) &&
        currentBoard[r][c] != null &&
        currentBoard[r][c]?.color !== movingPiece.color
      );
    };
    // Pawn advance 1
    if (isSquareEmpty(row + 1 * teamDirection, col)) {
      dests.push(new BoardLocation(row + 1 * teamDirection, col));
    }
    // Pawn sideways attack
    if (isSquareAttackable(row + 1 * teamDirection, col + 1)) {
      dests.push(new BoardLocation(row + 1 * teamDirection, col + 1));
    }
    if (isSquareAttackable(row + 1 * teamDirection, col - 1)) {
      dests.push(new BoardLocation(row + 1 * teamDirection, col - 1));
    }
    // Pawn advance 2 on first move
    if (
      movingPiece.firstMove &&
      isSquareEmpty(row + 2 * teamDirection, col) &&
      isSquareEmpty(row + 1 * teamDirection, col)
    ) {
      dests.push(new BoardLocation(row + 2 * teamDirection, col));
    }
    // En Passant

    return dests;
  };

  const isCommandLegal = (cmd: GameCommand, gameState: GameState): Boolean => {
    switch (cmd.command) {
      case "move":
        let moving_piece = gameState.board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);
        if (gameState.currentPlayer !== moving_piece?.color) {
          return false;
        }
        if (moving_piece) {
          switch (moving_piece.rank) {
            case "pawn":
              return (
                findLegalPawnMoves(
                  moving_piece,
                  cmd.source,
                  cmd.destination,
                  gameState.board
                ).filter((location) => location.isEqual(cmd.destination))
                  .length === 1
              );
          }
        }
        break;
      case "resign":
        break;
      default:
        break;
    }
    return false;
  };

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        console.log(`[Game] New Command: ${newCommand.command}`);
        const updatedBoard = [...gameState.board.map((row) => [...row])]; // Create a copy of the board
        if (isCommandLegal(newCommand, gameState)) {
          const pieceToMove =
            updatedBoard[newCommand.source.row][newCommand.source.col];
          if (pieceToMove) {
            pieceToMove.position = newCommand.destination;
            pieceToMove.firstMove = false;
            // Update the destination cell with the moved piece
            updatedBoard[newCommand.destination.row][
              newCommand.destination.col
            ] = pieceToMove;
            updatedBoard[newCommand.source.row][newCommand.source.col] = null; // Empty the source cell

            // Update the position of the moved piece in the gameState
            const updatedGameState: GameState = {
              ...gameState,
              board: updatedBoard,
              currentPlayer:
                gameState.currentPlayer === "white" ? "black" : "white", // Switch player turn
            };
            setGameState(updatedGameState);
          }
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
            gameState={gameState.board.flat()}
            sendGameCommand={sendGameCommand}
          />
        </DndProvider>
      </div>
    );
  } else {
    return <></>;
  }
};
