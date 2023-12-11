import React from "react";
import Square from "./Square";
import { PieceProps } from "./Piece";

interface BoardProps {
  gameState: PieceProps[];
}

const Board: React.FC<BoardProps> = ({ gameState }) => {
  const rowCount = 8;
  const squareSize = 50;

  const renderSquare = (row: number, col: number): JSX.Element => {
    const isEven = (row + col) % 2 === 0;
    const color = isEven ? "silver" : "saddlebrown";

    const piece = gameState.find(
      (p) => p.position.row === 7 - row && p.position.col === col
    );

    return (
      <Square
        key={`${row}-${col}`}
        size={squareSize}
        color={color}
        piece={piece}
      />
    );
  };

  const renderRow = (row: number): JSX.Element => {
    const squares: JSX.Element[] = [];

    for (let col = 0; col < rowCount; col++) {
      squares.push(renderSquare(row, col));
    }

    return (
      <div key={row} style={{ display: "flex" }}>
        {squares}
      </div>
    );
  };

  const rows: JSX.Element[] = [];
  for (let row = 0; row < rowCount; row++) {
    rows.push(renderRow(row));
  }

  return <div>{rows}</div>;
};

export default Board;
