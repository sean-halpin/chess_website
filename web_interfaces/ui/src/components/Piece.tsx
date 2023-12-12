// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";

export type PieceType =
  | "castle"
  | "knight"
  | "bishop"
  | "queen"
  | "king"
  | "pawn";

export interface PieceProps {
  id: string;
  color: "white" | "black";
  type: PieceType;
  position: { row: number; col: number };
}

export const Piece: React.FC<PieceProps> = ({ id, color, type, position }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: "PIECE",
    item: { id, color, type, position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const imagePath = `${
    process.env.PUBLIC_URL || ""
  }/images/${color}-${type.toLowerCase()}.png`;

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <img src={imagePath} alt={`${color} ${type}`} className="piece" />
    </div>
  );
};