// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { PieceType, PieceProps } from "./Piece";
import { GameCommand } from "./GameCommand";

type PieceColor = "white" | "black";

const createPiece = (
  color: PieceColor,
  row: number,
  type: PieceType,
  i: number
): PieceProps => ({
  id: `${color}-${type}-${i}`,
  type,
  color,
  position: { row, col: i },
});

const createPiecesOrder = (): PieceType[] => [
  "castle",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "castle",
];

const createPieces = (color: PieceColor, row: number): PieceProps[] =>
  Array.from({ length: 8 }, (_, i) =>
    createPiece(
      color,
      row,
      i === 3 ? "queen" : i === 4 ? "king" : createPiecesOrder()[i],
      i
    )
  );

const createPawns = (): PieceProps[] =>
  Array.from({ length: 16 }, (_, i) =>
    createPiece(i < 8 ? "white" : "black", i < 8 ? 1 : 6, "pawn", i % 8)
  );

const placeBackRow = (): PieceProps[] => [
  ...createPieces("white", 0),
  ...createPieces("black", 7),
];

export interface GameState {
  board: PieceProps[][];
  currentPlayer: "white" | "black";
  winner?: "white" | "black" | "draw";
}

const ChessGame: React.FC = () => {
  const [gameState, setGameState] = useState<PieceProps[]>([
    ...createPawns(),
    ...placeBackRow(),
  ]);

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        console.log(`[Game] New Command: ${newCommand.command}`);
        const updatedGameState = gameState.map((piece) =>
          piece.id === newCommand.pieceId
            ? { ...piece, position: newCommand.destination }
            : piece
        );

        setGameState(updatedGameState);
        break;

      case "resign":
        console.log(`[Game] New Command: ${newCommand.command}`);
        // Handle resign logic here
        break;

      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };

  return (
    <div>
      <h1>Chess Game</h1>
      <DndProvider backend={HTML5Backend}>
        <Board gameState={gameState} sendGameCommand={sendGameCommand} />
      </DndProvider>
    </div>
  );
};

export default ChessGame;
