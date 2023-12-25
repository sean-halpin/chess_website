// Board.tsx

import React from "react";
import Square from "./Square";
import { MoveCommand } from "../game/GameCommands";
import { Loc } from "../game/Loc";
import { ChessPiece } from "../game/ChessPiece";
import { None, Some } from "../types/Option";

interface BoardProps {
  pieces: ChessPiece[];
  sendMoveCommand: (command: MoveCommand) => void;
}

const Board: React.FC<BoardProps> = ({ pieces, sendMoveCommand }) => {
  const renderSquare = (row: number, col: number): JSX.Element => {
    const isEven = (row + col) % 2 === 1;
    const color = isEven ? "rgb(255, 205, 148)" : "rgb(200, 110, 25)";
    const piece = pieces.find((p) => {
      return p ? p.position.row === row && p.position.col === col : false;
    });

    return (
      <Square
        key={`${row}-${col}`}
        color={color}
        piece={piece !== undefined ? Some(piece) : None}
        position={new Loc(row, col)}
        sendMoveCommand={sendMoveCommand}
      />
    );
  };

  const renderRow = (row: number): JSX.Element => {
    const squares: JSX.Element[] = [];

    for (let col = 0; col <= 7; col++) {
      squares.push(renderSquare(row, col));
    }

    return (
      <div key={row} style={{ display: "flex" }}>
        {squares}
      </div>
    );
  };

  const rows: JSX.Element[] = [];
  for (let row = 7; row >= 0; row--) {
    rows.push(renderRow(row));
  }

  return <div>{rows}</div>;
};

export default Board;
