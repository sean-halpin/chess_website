// Game.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Board } from "./Board";
import { TextComponent } from "./TextComponent";
import { ChessGame, MoveCommand, Team } from "@sean_halpin/chess_game";
import { Audio } from "expo-av";
import { SoundObject } from "expo-av/build/Audio";

export interface GameProps {
  game: ChessGame;
  displayText: string;
  fen: string;
}

export const Game: React.FC = () => {
  const [player, setPlayer] = useState<SoundObject>();

  async function playSound() {
    console.log("[Game] Loading Sound");
    const player = await Audio.Sound.createAsync(
      require("../../assets/audio/table_knock.wav")
    );
    setPlayer(player);

    console.log("[Game] Playing Sound");
    await player.sound.playAsync();
  }

  useEffect(() => {
    return player
      ? () => {
          console.log("[Game] Unloading Sound");
          player.sound.unloadAsync();
        }
      : undefined;
  }, [player]);

  const [state, setState] = useState<GameProps>({
    game: new ChessGame(),
    displayText: "",
    fen: "",
  });

  async function executeCpuMoves(team: Team) {
    state.game
      .cpuMoveMinimax(team)
      .then((res) => {
        if (res.success) {
          playSound();
          setState({
            ...state,
            game: res.data,
          });
        }
      })
      .catch((err) => {
        console.error("Error during CPU move:", err);
      });
  }

  useEffect(() => {
    const waitOneSecond = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (state.game.currentPlayer === Team.Black) {
        executeCpuMoves(Team.Black);
      }
    };
    if (
      !state.game.status?.includes("Checkmate") &&
      !state.game.status?.includes("Draw")
    ) {
      const curr_player = state.game.currentPlayer;
      const capitalized_player =
        curr_player.charAt(0).toUpperCase() + curr_player.slice(1);
      state.displayText = `${capitalized_player} to move`;
      waitOneSecond();
    } else {
      state.displayText = `${state.game.status}`;
    }
  });

  const sendMoveCommand = (newCommand: MoveCommand) => {
    switch (newCommand.command) {
      case "move":
        {
          const result = state.game.executeCommand(newCommand);
          if (result.success) {
            playSound();
            setState({
              ...state,
              game: result.data,
            });
          }
        }
        break;
      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chess</Text>
      <View style={styles.row}>
        <View style={styles.column}>
          <View style={styles.chessBoard}>
            <Board
              pieces={state.game.pieces}
              sendMoveCommand={sendMoveCommand}
              legalMoves={ChessGame.findLegalMovesCurry(state.game.gameState)}
            />
          </View>
          <View>
            <TextComponent
              statusMessage={state.game.status || ""}
              nextToMove={`${state.game.currentPlayer} to move next`}
              fenString={state.fen}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  chessBoard: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    marginTop: 50,
    color: "white",
  },
  text: {
    color: "white",
  },
  column: {},
  row: {},
});
