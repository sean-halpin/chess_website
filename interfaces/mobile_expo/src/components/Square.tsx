import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Piece } from "./Piece";
import { MoveCommand } from "@sean_halpin/chess_game";
import { Loc } from "@sean_halpin/chess_game";
import { ChessPiece } from "@sean_halpin/chess_game";
import { Option, isSome } from "@sean_halpin/chess_game";
import { DraxView } from "react-native-drax";

interface SquareProps {
  color: string;
  piece: Option<ChessPiece>;
  position: Loc;
  sendMoveCommand: (command: MoveCommand) => void;
  draggedPieceMoves: MoveCommand[];
}

function maybePiece(
  position: Loc,
  piece: Option<ChessPiece>,
  draggedPieceMoves: MoveCommand[],
  sendMoveCommand: (command: MoveCommand) => void
) {
  const isDraggedPieceLegalDestination = draggedPieceMoves.some((move) => {
    return move.destination.isEqual(position);
  });
  if (isSome(piece)) {
    const p = piece.unwrap();
    return (
      <View style={styles.pieceContainer}>
        <View
          style={isDraggedPieceLegalDestination ? styles.circleContainer : null}
        />
        <Piece
          id={p.id}
          team={p.team}
          rank={p.rank}
          position={p.position}
          draggedPieceMoves={draggedPieceMoves}
          sendMoveCommand={sendMoveCommand}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.pieceContainer}>
        <View
          style={isDraggedPieceLegalDestination ? styles.circleContainer : null}
        />
      </View>
    );
  }
}

function colToNotation(row: number): string {
  return String.fromCharCode(97 + row);
}

const Square: React.FC<SquareProps> = ({
  color,
  piece,
  position,
  sendMoveCommand,
  draggedPieceMoves,
}) => {
  return (
    <DraxView
      style={[
        styles.container,
        { backgroundColor: color, borderColor: "#000" },
      ]}
      receptive={true}
      onReceiveDragDrop={({ dragged: { payload } }) => {
        const source = Loc.fromNotation(payload);
        const destination = position;
        console.log(
          `[Square] Dropped ${payload} to ${destination.toNotation()}`
        );
        const moveCommand: MoveCommand = {
          command: "move",
          source: source.unwrap(),
          destination: destination,
        };
        sendMoveCommand(moveCommand);
      }}
    >
      {maybePiece(position, piece, draggedPieceMoves, sendMoveCommand)}
      <Text
        style={[
          styles.box,
          { color: (position.col + position.row) % 2 ? "#000" : "#FFF" },
          styles.box1,
        ]}
      >
        {position.row === 0 ? colToNotation(position.col) : ""}
      </Text>
      <Text
        style={[
          styles.box,
          { color: (position.col + position.row) % 2 ? "#000" : "#FFF" },
          styles.box2,
        ]}
      >
        {position.col === 7 ? position.row + 1 : ""}
      </Text>
    </DraxView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 50,
    height: 50,
    borderWidth: 0.5,
  },
  box: {
    position: "absolute",
  },
  box1: {
    top: 32,
    zIndex: 3,
  },
  box2: {
    top: 32,
    left: 42,
    zIndex: 2,
  },
  pieceContainer: {
    zIndex: 1,
  },
  circleContainer: {
    position: "absolute",
    width: 15,
    height: 15,
    backgroundColor: "rgba(0,255,0,255)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,255)",
    marginTop: 18,
    marginLeft: 18,
    zIndex: 4,
  },
});

export default Square;
