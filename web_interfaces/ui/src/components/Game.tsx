// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import { Team } from "../game/ChessGameLogic";
import { MoveCommand } from "../game/GameCommand";
import "./Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { ChessGameLogic } from "../game/ChessGameLogic";
import { stat } from "fs";

export interface GameProps {
  game: ChessGameLogic;
  displayText: string;
  fen: string;
}

export const Game: React.FC = () => {
  const audioPlayerRef = useRef<AudioPlayer>(null);

  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
    }
  };

  const [state, setState] = useState<GameProps>({
    game: new ChessGameLogic(),
    displayText: "",
    fen: "",
  });

  async function executeCpuMoves(team: Team) {
    let success = false;

    while (!success) {
      try {
        const result = await state.game.cpuMove(team);

        if (result.success) {
          success = true;
          playAudio();
          setState({
            ...state,
            game: result.data,
          });
        }
      } catch (error) {
        console.error("Error during CPU move:", error);
        break;
      }
    }
  }

  const initial_player = state.game.currentPlayer;
  const capitalized_initial_player =
    initial_player.charAt(0).toUpperCase() + initial_player.slice(1);
  state.displayText = `${capitalized_initial_player} to move`;
  state.fen = state.game.getCurrentFen();

  useEffect(() => {
    if (state.game.winner === null) {
      const curr_player = state.game.currentPlayer;
      const capitalized_player =
        curr_player.charAt(0).toUpperCase() + curr_player.slice(1);
      state.displayText = `${capitalized_player} to move`;
    }
    const waitOneSecond = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`[Game] Next move ${capitalized_initial_player}`);
      if (
        state.game.winner === null &&
        state.game.currentPlayer === Team.Black
      ) {
        executeCpuMoves(Team.Black);
      }
    };
    waitOneSecond();
  });

  const sendMoveCommand = (newCommand: MoveCommand) => {
    switch (newCommand.command) {
      case "move":
        const result = state.game.executeCommand(newCommand);
        if (result.success) {
          playAudio();
          setState({
            ...state,
            game: result.data,
          });
        }
        break;
      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };

  if (state) {
    if (isTouchDevice()) {
      return (
        <div>
          <div className="chessBox">
            <h1>Chess</h1>
            <DndProvider backend={TouchBackend}>
              <Board
                pieces={state.game.pieces}
                sendMoveCommand={sendMoveCommand}
              />
            </DndProvider>
          </div>
          <div>
            <TextComponent text={state.displayText} textLow={state.fen} />
            <AudioPlayer ref={audioPlayerRef} />
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="chessBox">
            <h1>Chess</h1>
            <DndProvider backend={HTML5Backend}>
              <Board
                pieces={state.game.pieces}
                sendMoveCommand={sendMoveCommand}
              />
            </DndProvider>
          </div>
          <div>
            <TextComponent text={state.displayText} textLow={state.fen} />
            <AudioPlayer ref={audioPlayerRef} />
          </div>
        </div>
      );
    }
  } else {
    return <></>;
  }
};
