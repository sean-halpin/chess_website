import React from "react";
import { useDrop } from "react-dnd";
import { ChessPiece, Loc, MoveCommand, Option, Team, isSome } from "@sean_halpin/chess_game";
import { Piece } from "./Piece";
import "./css/Square.css";

interface SquareProps {
  color: string;
  piece: Option<ChessPiece>;
  position: Loc;
  sendMoveCommand: (command: MoveCommand) => void;
  selected: boolean;
  legalDestination: boolean;
  lastMoveSource: boolean;
  lastMoveDestination: boolean;
  draggable: boolean;
  onSquareClick: (position: Loc, piece: Option<ChessPiece>) => void;
}

const Square: React.FC<SquareProps> = ({
  color, piece, position, sendMoveCommand, selected, legalDestination,
  lastMoveSource, lastMoveDestination, draggable, onSquareClick,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: "PIECE",
    drop: (droppedPiece: ChessPiece) => sendMoveCommand(new MoveCommand(droppedPiece.position, position)),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });
  const classes = ["container", selected ? "square-selected" : "", legalDestination ? "square-legal-destination" : "", lastMoveSource || lastMoveDestination ? "square-last-move" : ""].filter(Boolean).join(" ");
  const columnLabel = position.row === 0 ? String.fromCharCode(97 + position.col) : "";
  const rowLabel = position.col === 7 ? position.row + 1 : "";
  return <div className={classes} ref={drop} onClick={() => onSquareClick(position, piece)}
    style={{ width: "50px", height: "50px", backgroundColor: color, border: "1px solid #000", opacity: isOver ? 0.7 : 1 }}>
    {isSome(piece) && <div id="box3" className="box"><Piece {...piece.unwrap()} draggable={draggable && piece.unwrap().team === Team.White} /></div>}
    {legalDestination && <div className="move-marker" />}
    <p id="box1" className="box">{columnLabel}</p>
    <p id="box2" className="box">{rowLabel}</p>
  </div>;
};

export default Square;
