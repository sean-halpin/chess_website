import React, { useEffect, useState } from "react";
import { View, Image, ImageSourcePropType, Text } from "react-native";
import { Loc, MoveCommand, Rank, Team } from "@sean_halpin/chess_game";
import { DraxView } from "react-native-drax";

export interface PieceProps {
  id: string;
  team: Team;
  rank: Rank;
  position: Loc;
  moves: MoveCommand[];
}

const imageMapping: Record<string, ImageSourcePropType> = {
  "white-pawn": require("../../assets/images/White-pawn.png"),
  "white-rook": require("../../assets/images/White-rook.png"),
  "white-knight": require("../../assets/images/White-knight.png"),
  "white-bishop": require("../../assets/images/White-bishop.png"),
  "white-queen": require("../../assets/images/White-queen.png"),
  "white-king": require("../../assets/images/White-king.png"),

  "black-pawn": require("../../assets/images/Black-pawn.png"),
  "black-rook": require("../../assets/images/Black-rook.png"),
  "black-knight": require("../../assets/images/Black-knight.png"),
  "black-bishop": require("../../assets/images/Black-bishop.png"),
  "black-queen": require("../../assets/images/Black-queen.png"),
  "black-king": require("../../assets/images/Black-king.png"),
};

export const Piece: React.FC<PieceProps> = ({
  id,
  team,
  rank,
  position,
  moves,
}) => {
  const imagePath = `${team}-${rank}`.toLowerCase();
  const imageSource: ImageSourcePropType = imageMapping[imagePath];

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <View>
      <DraxView
        draggable={true}
        snapbackDuration={0}
        snapbackDelay={0}
        draggingStyle={styles.dragging}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        payload={position.toNotation()}
      >
        <Image source={imageSource} style={styles.pieceImage} />
      </DraxView>
    </View>
  );
};

const styles = {
  pieceImage: {
    width: 50,
    height: 50,
  },
  dragging: {
    opacity: 0.1,
  },
};
