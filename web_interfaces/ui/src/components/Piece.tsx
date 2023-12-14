// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { BoardLocation } from "./GameCommand";

export type Rank =
  | "castle"
  | "knight"
  | "bishop"
  | "queen"
  | "king"
  | "pawn";

export interface IChessPiece {
  id: string;
  color: "white" | "black";
  rank: Rank;
  position: BoardLocation;
  firstMove: boolean;
}

export type ChessPiece = IChessPiece | null;

export const Piece: React.FC<IChessPiece> = ({ id, color, rank, position }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { id, color, rank, position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const imagePath = `${
    process.env.PUBLIC_URL || ""
  }/images/${color}-${rank.toLowerCase()}.png`;

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <img src={imagePath} alt={`${color} ${rank}`} className="piece" />
    </div>
  );
};
