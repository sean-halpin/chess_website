import React from "react";
import { View } from "react-native";
import Square from "./Square";
import { MoveCommand } from "@sean_halpin/chess_game";
import { Loc } from "@sean_halpin/chess_game";
import { ChessPiece } from "@sean_halpin/chess_game";
import { None, Some } from "@sean_halpin/chess_game";
import { Team } from "@sean_halpin/chess_game";

interface BoardProps {
  pieces: ChessPiece[];
  sendMoveCommand: (command: MoveCommand) => void;
  legalMoves: (team: Team) => MoveCommand[];
}

export const Board: React.FC<BoardProps> = ({ pieces, sendMoveCommand, legalMoves }) => {
  const renderSquare = (row: number, col: number, moves: MoveCommand[]): JSX.Element => {
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
        moves={moves}
      />
    );
  };

  const renderRow = (row: number, moves: MoveCommand[]): JSX.Element => {
    const squares: JSX.Element[] = [];

    for (let col = 0; col <= 7; col++) {
      squares.push(renderSquare(row, col, moves));
    }

    return (
      <View key={row} style={{ flexDirection: "row" }}>
        {squares}
      </View>
    );
  };

  const rows: JSX.Element[] = [];
  const legalMovesBlack = legalMoves(Team.Black);
  const legalMovesWhite = legalMoves(Team.White);
  const legalMovesAll = [...legalMovesBlack, ...legalMovesWhite];
  for (let row = 7; row >= 0; row--) {
    rows.push(renderRow(row, legalMovesAll));
  }

  return <View>{rows}</View>;
};
