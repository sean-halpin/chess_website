// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { IChessPiece } from "../game/ChessGameLogic";

export const Piece: React.FC<IChessPiece> = ({
  id,
  team,
  rank,
  position,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { id, team, rank, position },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const imagePath = `${
    process.env.PUBLIC_URL || ""
  }/images/${team}-${rank.toLowerCase()}.png`;

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <img src={imagePath} alt={`${team} ${rank}`} className="piece" />
    </div>
  );
};
