// Board.tsx

import React from "react";
import Square from "./Square";
import { MaybeChessPiece } from "../game/ChessGameLogic";
import { GameCommand } from "../game/GameCommand";

interface BoardProps {
  pieces: MaybeChessPiece[];
  sendGameCommand: (command: GameCommand) => void;
}

const Board: React.FC<BoardProps> = ({ pieces, sendGameCommand }) => {
  const squareSize = 50;

  const renderSquare = (row: number, col: number): JSX.Element => {
    const isEven = (row + col) % 2 === 1;
    const color = isEven ? "silver" : "saddlebrown";

    const piece =
      pieces
        .filter((p) => p !== null)
        .find((p) => {
          return p
            ? p.position.row === row && p.position.col === col
            : false;
        }) || null;
    return (
      <Square
        key={`${row}-${col}`}
        size={squareSize}
        color={color}
        piece={piece}
        position={{ row: row, col: col }}
        sendGameCommand={sendGameCommand}
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
