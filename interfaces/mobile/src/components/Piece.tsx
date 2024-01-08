import React, { useEffect, useState } from "react";
import { View, Image, ImageSourcePropType, Text } from "react-native";
import { Loc, MoveCommand, Rank, Team } from "@sean_halpin/chess_game";

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
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleDraggingState = (_moves: MoveCommand[]) => {
      const legalMoves = moves.filter((m) => m.source.isEqual(position));
    };

    handleDraggingState(moves);

    // Cleanup function to reset elements when component unmounts or isDragging changes
    return () => {
      // Cleanup logic if needed
    };
  }, [moves, position]); // Re-run the effect when moves or position changes

  const imageSource: ImageSourcePropType = imageMapping[imagePath];

  const onLoad = () => {
    setImageLoaded(true);
  };

  return (
    (
      <View>
        <Image
          source={imageSource}
          style={styles.pieceImage}
          resizeMode="contain"
          onLoad={onLoad}
        />
        {!imageLoaded && <Text>Loading...</Text>}
      </View>
    )
  );
};

const styles = {
  pieceImage: {
    width: 50,
    height: 50,
  },
};
