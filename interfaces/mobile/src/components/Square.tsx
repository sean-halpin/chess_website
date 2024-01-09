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
  moves: MoveCommand[];
}

function maybePiece(piece: Option<ChessPiece>, moves: MoveCommand[]) {
  if (isSome(piece)) {
    const p = piece.unwrap();
    return (
      <View style={styles.pieceContainer}>
        <Piece
          id={p.id}
          team={p.team}
          rank={p.rank}
          position={p.position}
          moves={moves}
        />
      </View>
    );
  } else {
    return <></>;
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
  moves,
}) => {
  return (
    <DraxView
      receptive={true}
      onReceiveDragDrop={({ dragged: { payload } }) => {
        console.log(`Square.tsx: Received payload: ${payload}`);
        const source = Loc.fromNotation(payload);
        const destination = position;
        const moveCommand: MoveCommand = {
          command: "move",
          source: source.unwrap(),
          destination: destination,
        };
        sendMoveCommand(moveCommand);
      }}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: color, borderColor: "#000" },
        ]}
      >
        {maybePiece(piece, moves)}
        <View style={styles.circleContainer} />
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
      </View>
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
    width: 0,
    height: 0,
    backgroundColor: "rgba(0,0,0,0)",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0)",
    margin: "auto",
    marginTop: 18,
    zIndex: 4,
    position: "relative",
  },
});

export default Square;
