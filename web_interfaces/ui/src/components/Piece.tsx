// ChessPiece.tsx

import React from "react";
import "./Piece.css";

export interface PieceProps {
  id: string;
  color: "white" | "black";
  type: "pawn" | "castle" | "knight" | "bishop" | "queen" | "king";
  position: { row: number; col: number };
}

export const Piece: React.FC<PieceProps> = ({ id, color, type, position }) => {
  const imagePath = `${
    process.env.PUBLIC_URL || ""
  }/images/${color}-${type.toLowerCase()}.png`;

  return <img src={imagePath} alt={`${color} ${type}`} color={`${color}`} className="piece" />;
};

