// Square.tsx

import React from "react";
import { Piece, PieceProps } from "./Piece";
import { useDrop } from "react-dnd";

interface SquareProps {
  size: number;
  color: string;
  piece: PieceProps | undefined;
  position: { row: number; col: number };
}

function maybePiece(piece: PieceProps | undefined) {
  if (piece !== undefined) {
    return (
      <Piece
        id={piece.id}
        color={piece.color}
        type={piece.type}
        position={piece.position}
      />
    );
  } else {
    return <></>;
  }
}

const Square: React.FC<SquareProps> = ({ size, color, piece, position }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "PIECE", // Make sure it matches the type used in useDrag
    drop: (item: PieceProps) => {
      // Handle the drop event here
      console.log(
        `Dropped ${item.color} ${item.type} from ${item.position.row}-${item.position.col} to ${position.row}-${position.col}`
      );
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const squareStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: `${color}`,
    border: "1px solid #000",
  };

  return (
    <div ref={drop} style={{ ...squareStyle, opacity: isOver ? 0.7 : 1 }}>
      {maybePiece(piece)}
    </div>
  );
};

export default Square;
