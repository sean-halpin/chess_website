// Piece.tsx

import React from "react";
import "./Piece.css";
import { useDrag } from "react-dnd";
import { BoardLocation } from "./GameCommand";

export enum Rank {
  Castle = "castle",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn",
}

export enum Team {
  White = "white",
  Black = "black",
}

export interface IChessPiece {
  id: string;
  team: Team;
  rank: Rank;
  position: BoardLocation;
  firstMove?: boolean;
}

export class ChessPiece implements IChessPiece {
    constructor(
      public readonly id: string,
      public readonly team: Team,
      public readonly rank: Rank,
      public readonly position: BoardLocation,
      public readonly firstMove: boolean = true
    ) {}
  }

export type MaybeChessPiece = IChessPiece | null;

export const Piece: React.FC<IChessPiece> = ({
  id,
  team: color,
  rank,
  position,
}) => {
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
