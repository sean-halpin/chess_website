// Piece.tsx

import React, { useEffect } from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { Team } from "../chess_game/Team";
import { Rank } from "../chess_game/Rank";
import { Loc } from "../chess_game/Loc";
import { MoveCommand } from "../chess_game/GameCommands";

export interface PieceProps {
  id: string;
  team: Team;
  rank: Rank;
  position: Loc;
  moves: MoveCommand[];
}

export const Piece: React.FC<PieceProps> = ({
  id,
  team,
  rank,
  position,
  moves,
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

  useEffect(() => {
    const handleDraggingState = (_moves: MoveCommand[]) => {
      const legalMoves = moves.filter((m) => m.source.isEqual(position));

      if (isDragging) {
        // Change elements when dragging
        legalMoves.forEach((location) => {
          const element = document.getElementById(
            location.destination.toNotation()
          );

          if (element) {
            element.style.backgroundColor = "rgba(0, 255, 0, 0.7)";
            element.style.border = "1px solid rgba(255,255,255,1)";
            element.style.height = "15px";
            element.style.width = "15px";
          }
        });
      } else {
        // Reset elements when not dragging
        const elements = document.getElementsByClassName("circle-container");
        Array.from(elements).forEach((element) => {
          (element as HTMLElement).style.backgroundColor = "rgba(0, 0, 0, 0)";
          (element as HTMLElement).style.border = "1px solid rgba(0,0,0,0)";
          (element as HTMLElement).style.height = "0px";
          (element as HTMLElement).style.width = "0px";
        });
      }
    };

    handleDraggingState(moves);

    // Cleanup function to reset elements when component unmounts or isDragging changes
    return () => {
      const elements = document.getElementsByClassName("circle-container");
      Array.from(elements).forEach((element) => {
        (element as HTMLElement).style.backgroundColor = "rgba(0, 0, 0, 0)";
        (element as HTMLElement).style.border = "1px solid rgba(0,0,0,0)";
        (element as HTMLElement).style.height = "0px";
        (element as HTMLElement).style.width = "0px";
      });
    };
  }, [isDragging, moves, position]); // Re-run the effect when isDragging, moves, or position changes

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
