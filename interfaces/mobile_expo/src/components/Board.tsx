import React, { useState } from "react";
import { View } from "react-native";
import Square from "./Square";
import { MoveCommand } from "@sean_halpin/chess_game";
import { ChessPiece, Team, Loc } from "@sean_halpin/chess_game";
import { None, Some, Option } from "@sean_halpin/chess_game";
import { DraxView } from "react-native-drax";

interface BoardProps {
  pieces: ChessPiece[];
  sendMoveCommand: (command: MoveCommand) => void;
  legalMoves: (team: Team) => MoveCommand[];
}

export const Board: React.FC<BoardProps> = ({
  pieces,
  sendMoveCommand,
  legalMoves,
}) => {
  const renderSquare = (
    row: number,
    col: number,
    draggedPieceMoves: MoveCommand[]
  ): JSX.Element => {
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
        draggedPieceMoves={draggedPieceMoves}
      />
    );
  };

  const renderSquares = (row: number, draggedPieceMoves: MoveCommand[]) => {
    const squares: JSX.Element[] = [];

    for (let col = 0; col <= 7; col++) {
      squares.push(renderSquare(row, col, draggedPieceMoves));
    }
    return squares;
  };

  const renderRow = (
    row: number,
    draggedPieceMoves: MoveCommand[]
  ): JSX.Element => {
    return (
      <View key={row} style={{ flexDirection: "row" }}>
        {renderSquares(row, draggedPieceMoves)}
      </View>
    );
  };

  const renderRows = (optionalPiece: Option<ChessPiece>) => {
    const rows: JSX.Element[] = [];
    const legalMovesBlack = legalMoves(Team.Black);
    const legalMovesWhite = legalMoves(Team.White);
    const draggedPieceMoves = [...legalMovesBlack, ...legalMovesWhite].filter(
      (move) => {
        return optionalPiece.isSome()
          ? move.source.isEqual(optionalPiece.unwrap().position)
          : false;
      }
    );
    for (let row = 7; row >= 0; row--) {
      rows.push(renderRow(row, draggedPieceMoves));
    }
    return rows;
  };

  const getPiece = (loc: string): Option<ChessPiece> => {
    const piece = pieces.find((p) => {
      return p ? p.position.toNotation() === loc : false;
    });
    return piece !== undefined ? Some(piece) : None;
  };

  const [draggingPiece, setDraggingPiece] = useState<Option<ChessPiece>>(None);

  return (
    <DraxView
      monitoring={true}
      onMonitorDragStart={(_event) => {
        setDraggingPiece(getPiece(_event.dragged.payload));
        console.log(`[Board] Drag Start - ${_event.dragged.payload}`);
      }}
      onMonitorDragDrop={(_event) => {
        setDraggingPiece(None);
        console.log(`[Board] Drag Drop - ${_event.dragged.payload}`);
      }}
      onMonitorDragEnd={(_event) => {
        setDraggingPiece(None);
        console.log(`[Board] Drag End - ${_event.dragged.payload}`);
      }}
    >
      {renderRows(draggingPiece)}
    </DraxView>
  );
};
