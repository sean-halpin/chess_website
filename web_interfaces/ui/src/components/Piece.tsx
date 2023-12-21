// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { Loc, Rank, Team } from "../game/ChessGameTypes";

export interface PieceProps {
  id: string;
  team: Team;
  rank: Rank;
  position: Loc;
}

export const Piece: React.FC<PieceProps> = ({ id, team, rank, position }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "PIECE",
    item: { id, team, rank, position},
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
        <img src={imagePath} alt={`${team} ${rank}`} className="pieceImage" />
      </div>
    );
  } else {
    return (
      <div>
        <img src={imagePath} alt={`${team} ${rank}`} className="pieceImage" />
      </div>
    );
  }
};
