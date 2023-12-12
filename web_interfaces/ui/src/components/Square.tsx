// Square.tsx

import React from "react";
import { Piece, PieceProps } from "./Piece";
import { useDrop } from "react-dnd";
import { GameCommand } from "./GameCommand";

interface SquareProps {
  size: number;
  color: string;
  piece: PieceProps | undefined;
  position: { row: number; col: number };
  sendGameCommand: (command: GameCommand) => void;
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

const Square: React.FC<SquareProps> = ({
  size,
  color,
  piece,
  position,
  sendGameCommand,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: "PIECE", // Make sure it matches the type used in useDrag
    drop: (item: PieceProps) => {
      // Handle the drop event here
      let info = `Dropped ${item.color} ${item.type} from ${item.position.row}-${item.position.col} to ${position.row}-${position.col}`;
      console.log(info);
      const moveCommand: GameCommand = {
        command: "move",
        pieceId: item.id,
        source: { row: item.position.row, col: item.position.col },
        destination: { row: position.row, col: position.col },
      };
      sendGameCommand(moveCommand);
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
