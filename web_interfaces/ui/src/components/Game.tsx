// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { Rank, ChessPiece, IChessPiece } from "./Piece";
import { GameCommand, Loc } from "./GameCommand";

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
  const board: ChessBoard = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );
  pieces.forEach((p) => {
    if (p) {
      board[p.position.row][p.position.col] = p;
    }
  });
  const [gameState, setGameState] = useState<GameState>({
    board: board,
    currentPlayer: "white",
  });

  const findLegalPawnMoves = (
    piece: IChessPiece,
    src: Loc,
    dest: Loc,
    board: ChessBoard
  ): Loc[] => {
    const dests: Loc[] = [];
    const teamDirection = piece.color === "white" ? 1 : -1;
    const { row, col } = piece.position;

    const isSquareEmpty = (r: number, c: number) => board[r]?.[c] == null;

    if (isSquareEmpty(row + 1 * teamDirection, col)) {
      dests.push(new Loc(row + 1 * teamDirection, col));
    }

    if (
      piece.firstMove &&
      isSquareEmpty(row + 2 * teamDirection, col) &&
      isSquareEmpty(row + 1 * teamDirection, col)
    ) {
      dests.push(new Loc(row + 2 * teamDirection, col));
    }

    return dests;
  };

  const isCommandLegal = (cmd: GameCommand, board: ChessBoard): Boolean => {
    switch (cmd.command) {
      case "move":
        let moving_piece = board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);
        if (moving_piece) {
          switch (moving_piece.rank) {
            case "pawn":
              console.log("Check Pawn Legal");
              return (
                findLegalPawnMoves(
                  moving_piece,
                  cmd.source,
                  cmd.destination,
                  board
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
        if (isCommandLegal(newCommand, updatedBoard)) {
          const pieceToMove =
            updatedBoard[newCommand.source.row][newCommand.source.col];
          if (pieceToMove) pieceToMove.position = newCommand.destination;
          // Update the destination cell with the moved piece
          updatedBoard[newCommand.destination.row][newCommand.destination.col] =
            pieceToMove;
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
