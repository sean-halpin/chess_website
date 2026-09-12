import React from "react";
import { useDrag } from "react-dnd";
import { ChessPiece } from "@sean_halpin/chess_game";
import "./css/Piece.css";

export const Piece: React.FC<ChessPiece & { draggable: boolean }> = ({ id, team, rank, position, draggable }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { id, team, rank, position },
    canDrag: draggable,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const imagePath = `${process.env.PUBLIC_URL || ""}/images/${team}-${rank.toLowerCase()}.png`;
  return <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
    <img src={imagePath} alt={`${team} ${rank}`} className="pieceImage" />
  </div>;
};
