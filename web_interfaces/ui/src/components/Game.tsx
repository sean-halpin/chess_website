// ChessGame.tsx

import React, { useState } from "react";
import Board from "./Board";
import { PieceType, PieceProps } from "./Piece";

// Initial state for all pieces (sample positions)
const initialGameState: PieceProps[] = [];

type PieceColor = "white" | "black";

function placePieces(gs: PieceProps[], color: string, row: number) {
  const piecesOrder = [
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
    const type = piecesOrder[i];
    if (i === 3) {
      gs.push({
        id: `${color}-${type}-${i}`,
        type: "queen" as PieceType,
        color: color as PieceColor,
        position: { row: row, col: i },
      });
    } else if (i === 4) {
      gs.push({
        id: `${color}-${type}-${i}`,
        type: "king" as PieceType,
        color: color as PieceColor,
        position: { row: row, col: i },
      });
    } else {
      gs.push({
        id: `${color}-${type}-${i}`,
        type: type as PieceType,
        color: color as PieceColor,
        position: { row: row, col: i },
      });
    }
  }
}

function placePawns(gs: PieceProps[]) {
  for (let i = 0; i < 8; i++) {
    gs.push({
      id: `white-pawn-${i}`,
      type: "pawn",
      color: "white",
      position: { row: 1, col: i },
    });
    gs.push({
      id: `black-pawn-${i}`,
      type: "pawn",
      color: "black",
      position: { row: 6, col: i },
    });
  }
}

function placeBackRow(gs: PieceProps[]) {
  placePieces(gs, "white", 0);
  placePieces(gs, "black", 7);
}

const ChessGame: React.FC = () => {
  const [gameState, setGameState] = useState<PieceProps[]>(initialGameState);
  placePawns(initialGameState);
  placeBackRow(initialGameState);

  return (
    <div>
      <h1>Chess Game</h1>
      <Board gameState={gameState} />
    </div>
  );
};

export default ChessGame;
