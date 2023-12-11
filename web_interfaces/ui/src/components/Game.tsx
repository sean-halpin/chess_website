// ChessGame.tsx

import React, { useState } from "react";
import Board from "./Board";
import { PieceProps } from "./Piece";

// Initial state for all pieces (sample positions)
const initialGameState: PieceProps[] = [];

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
  for (let i = 0; i < 8; i++) {
    switch (i) {
      case 0:
      case 7:
        gs.push({
          id: `white-castle-${i}`,
          type: "castle",
          color: "white",
          position: { row: 0, col: i },
        });
        gs.push({
          id: `black-castle-${i}`,
          type: "castle",
          color: "black",
          position: { row: 7, col: i },
        });
        break;
      case 1:
      case 6:
        gs.push({
          id: `white-knight-${i}`,
          type: "knight",
          color: "white",
          position: { row: 0, col: i },
        });
        gs.push({
          id: `black-knight-${i}`,
          type: "knight",
          color: "black",
          position: { row: 7, col: i },
        });
        break;
      case 2:
      case 5:
        gs.push({
          id: `white-bishop-${i}`,
          type: "bishop",
          color: "white",
          position: { row: 0, col: i },
        });
        gs.push({
          id: `black-bishop-${i}`,
          type: "bishop",
          color: "black",
          position: { row: 7, col: i },
        });
        break;
      default:
        break;
    }
  }
}

const ChessGame: React.FC = () => {
  const [gameState, setGameState] = useState<PieceProps[]>(initialGameState);
  placePawns(initialGameState);
  placeBackRow(initialGameState);

  const movePiece = (
    pieceId: string,
    newPosition: { row: number; col: number }
  ): void => {
    setGameState((prevGameState) =>
      prevGameState.map((piece) =>
        piece.id === pieceId ? { ...piece, position: newPosition } : piece
      )
    );
  };

  return (
    <div>
      <h1>Chess Game</h1>
      <Board gameState={gameState} onMovePiece={movePiece} />
    </div>
  );
};

export default ChessGame;
