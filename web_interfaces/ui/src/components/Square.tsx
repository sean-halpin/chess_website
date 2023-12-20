// Square.tsx

import React from "react";
import { Piece } from "./Piece";
import { useDrop } from "react-dnd";
import { MoveCommand } from "../game/GameCommands";
import { BoardLocation, ChessPiece } from "../game/ChessGameTypes";
import { Option, isSome, unwrap } from "../types/Option";
import "./Square.css";

interface SquareProps {
  color: string;
  piece: Option<ChessPiece>;
  position: { row: number; col: number };
  sendMoveCommand: (command: MoveCommand) => void;
}

function maybePiece(piece: Option<ChessPiece>) {
  if (isSome(piece)) {
    let p = unwrap(piece);
    return (
      <div className="box">
        <Piece id={p.id} team={p.team} rank={p.rank} position={p.position} />
      </div>
    );
  } else {
    return <></>;
  }
}

// function that takes a row number and returns the chess alphabet notation
// for that row. 0 -> a, 1 -> b, etc.
function colToNotation(row: number): string {
  return String.fromCharCode(97 + row);
}

const Square: React.FC<SquareProps> = ({
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
    width: "50px",
    height: "50px",
    backgroundColor: `${color}`,
    border: "1px solid #000",
  };

  return (
    <div
      className="container"
      ref={drop}
      style={{ ...squareStyle, opacity: isOver ? 0.7 : 1 }}
    >
      {maybePiece(piece)}
      <p
        className="box"
        style={{
          color:
            (position.col + position.row) % 2
              ? "rgba(0, 0, 0, 1)"
              : "rgba(255, 255, 255, 1)",
        }}
      >
        {position.row === 0 ? colToNotation(position.col) : ""}
      </p>
      <p
        className="box"
        style={{
          color:
            (position.col + position.row) % 2
              ? "rgba(0, 0, 0, 1)"
              : "rgba(255, 255, 255, 1)",
        }}
      >
        {position.col === 7 ? position.row + 1 : ""}
      </p>
    </div>
  );
};

export default Square;
