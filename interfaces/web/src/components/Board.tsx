import React, { useEffect, useState } from "react";
import Square from "./Square";
import { ChessPiece, Loc, MoveCommand, None, Option, Some, Team, isSome } from "@sean_halpin/chess_game";

interface BoardProps {
  pieces: ChessPiece[];
  sendMoveCommand: (command: MoveCommand) => void;
  legalMoves: MoveCommand[];
  currentPlayer: Team;
  gameOver: boolean;
  lastMove?: MoveCommand;
  interactionKey: number;
}

const Board: React.FC<BoardProps> = ({
  pieces, sendMoveCommand, legalMoves, currentPlayer, gameOver, lastMove, interactionKey,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Loc>();
  useEffect(() => setSelectedSquare(undefined), [interactionKey, currentPlayer, gameOver]);

  const handleSquareClick = (position: Loc, piece: Option<ChessPiece>) => {
    if (gameOver || currentPlayer !== Team.White) return;
    if (selectedSquare !== undefined) {
      const legalMove = legalMoves.find((move) =>
        move.source.isEqual(selectedSquare) && move.destination.isEqual(position)
      );
      if (legalMove !== undefined) {
        setSelectedSquare(undefined);
        sendMoveCommand(new MoveCommand(selectedSquare, position));
        return;
      }
    }
    if (isSome(piece) && piece.unwrap().team === Team.White) setSelectedSquare(position);
    else setSelectedSquare(undefined);
  };

  const destinations = selectedSquare === undefined ? [] : legalMoves
    .filter((move) => move.source.isEqual(selectedSquare))
    .map((move) => move.destination);
  const renderSquare = (row: number, col: number): JSX.Element => {
    const position = new Loc(row, col);
    const piece = pieces.find((candidate) => candidate.position.isEqual(position));
    return <Square
      key={`${row}-${col}`}
      color={(row + col) % 2 === 1 ? "rgb(255, 205, 148)" : "rgb(200, 110, 25)"}
      piece={piece === undefined ? None : Some(piece)}
      position={position}
      sendMoveCommand={sendMoveCommand}
      selected={selectedSquare?.isEqual(position) ?? false}
      legalDestination={destinations.some((destination) => destination.isEqual(position))}
      lastMoveSource={lastMove?.source.isEqual(position) ?? false}
      lastMoveDestination={lastMove?.destination.isEqual(position) ?? false}
      draggable={currentPlayer === Team.White && !gameOver}
      onSquareClick={handleSquareClick}
    />;
  };

  return <div>{Array.from({ length: 8 }, (_, index) => 7 - index).map((row) =>
    <div key={row} style={{ display: "flex" }}>
      {Array.from({ length: 8 }, (_, col) => renderSquare(row, col))}
    </div>
  )}</div>;
};

export default Board;
