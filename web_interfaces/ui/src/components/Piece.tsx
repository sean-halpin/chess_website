// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { IChessPiece, Team } from "../game/ChessGameTypes";

export const Piece: React.FC<IChessPiece> = ({ id, team, rank, position }) => {
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

  if (team === Team.White) {
    return (
      <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <img src={imagePath} alt={`${team} ${rank}`} className="piece" />
      </div>
    );
  } else {
    return (
      <div>
        <img src={imagePath} alt={`${team} ${rank}`} className="piece" />
      </div>
    );
  }
};
