// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { PieceType, PieceProps } from "./Piece";
import { GameCommand } from "./GameCommand";

// Initial state for all pieces (sample positions)
const initialGameState: PieceProps[] = [];

type PieceColor = "white" | "black";

function pushPiece(
  gs: PieceProps[],
  color: PieceColor,
  row: number,
  type: PieceType,
  i: number
) {
  gs.push({
    id: `${color}-${type}-${i}`,
    type: type,
    color: color,
    position: { row: row, col: i },
  });
}

function placePieces(gs: PieceProps[], color: PieceColor, row: number) {
  const piecesOrder: PieceType[] = [
    "castle",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "castle",
  ];

  for (let i = 0; i < 8; i++) {
    if (i === 3) {
      pushPiece(gs, color, row, "queen", i);
    } else if (i === 4) {
      pushPiece(gs, color, row, "king", i);
    } else {
      pushPiece(gs, color, row, piecesOrder[i], i);
    }
  }
}

function placePawns(gs: PieceProps[]) {
  for (let i = 0; i < 8; i++) {
    pushPiece(gs, "white", 1, "pawn", i);
    pushPiece(gs, "black", 6, "pawn", i);
  }
}

function placeBackRow(gs: PieceProps[]) {
  placePieces(gs, "white", 0);
  placePieces(gs, "black", 7);
}

const ChessGame: React.FC = () => {
  placePawns(initialGameState);
  placeBackRow(initialGameState);
  const [gameState, setGameState] = useState<PieceProps[]>(initialGameState);

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
