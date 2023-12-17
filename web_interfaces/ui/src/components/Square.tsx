// Square.tsx

import React from "react";
import { Piece, MaybeChessPiece } from "./Piece";
import { useDrop } from "react-dnd";
import { GameCommand, BoardLocation } from "./GameCommand";

interface SquareProps {
  size: number;
  color: string;
  piece: MaybeChessPiece;
  position: { row: number; col: number };
  sendGameCommand: (command: GameCommand) => void;
}

function maybePiece(piece: MaybeChessPiece) {
  if (piece) {
    return (
      <Piece
        id={piece.id}
        team={piece.team}
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
    drop: (piece: MaybeChessPiece) => {
      if (piece) {
        let info = `[Square] Dropped ${piece.team} ${piece.rank} from ${piece.position.row}-${piece.position.col} to ${position.row}-${position.col}`;
        console.log(info);
        const moveCommand: GameCommand = {
          command: "move",
          pieceId: piece.id,
          source: new BoardLocation(piece.position.row, piece.position.col),
          destination: new BoardLocation(position.row, position.col),
        };
        sendGameCommand(moveCommand);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const squareStyle: React.CSSProperties = {
    width: '50px',
    height: '50px',
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
