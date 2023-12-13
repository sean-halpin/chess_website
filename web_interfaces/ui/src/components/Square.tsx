// Square.tsx

import React from "react";
import { Piece, ChessPiece } from "./Piece";
import { useDrop } from "react-dnd";
import { GameCommand, Loc } from "./GameCommand";

interface SquareProps {
  size: number;
  color: string;
  piece: ChessPiece;
  position: { row: number; col: number };
  sendGameCommand: (command: GameCommand) => void;
}

function maybePiece(piece: ChessPiece) {
  if (piece) {
    return (
      <Piece
        id={piece.id}
        color={piece.color}
        rank={piece.rank}
        position={piece.position}
        firstMove={piece.firstMove}
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
    drop: (piece: ChessPiece) => {
      if (piece) {
        let info = `Dropped ${piece.color} ${piece.rank} from ${piece.position.row}-${piece.position.col} to ${position.row}-${position.col}`;
        console.log(info);
        const moveCommand: GameCommand = {
          command: "move",
          pieceId: piece.id,
          source: new Loc(piece.position.row, piece.position.col),
          destination: new Loc(position.row, position.col),
        };
        sendGameCommand(moveCommand);
      }
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
