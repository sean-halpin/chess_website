// Square.tsx

import React from "react";
import { Piece } from "./Piece";
import { useDrop } from "react-dnd";
import { MoveCommand } from "../game/GameCommands";
import { BoardLocation, ChessPiece } from "../game/ChessGameTypes";
import { Option, isSome, unwrap } from "../types/Option";

interface SquareProps {
  size: number;
  color: string;
  piece: Option<ChessPiece>;
  position: { row: number; col: number };
  sendMoveCommand: (command: MoveCommand) => void;
}

function maybePiece(piece: Option<ChessPiece>) {
  if (isSome(piece)) {
    let p = unwrap(piece);
    return (
      <Piece
        id={p.id}
        team={p.team}
        rank={p.rank}
        position={p.position}
        firstMove={p.firstMove}
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
  sendMoveCommand,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: "PIECE", // Make sure it matches the type used in useDrag
    drop: (piece: ChessPiece) => {
      if (piece) {
        let info = `[Square] Dropped ${piece.team} ${piece.rank} from ${piece.position.row}-${piece.position.col} to ${position.row}-${position.col}`;
        console.log(info);
        const moveCommand: MoveCommand = {
          command: "move",
          source: new BoardLocation(piece.position.row, piece.position.col),
          destination: new BoardLocation(position.row, position.col),
        };
        sendMoveCommand(moveCommand);
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
