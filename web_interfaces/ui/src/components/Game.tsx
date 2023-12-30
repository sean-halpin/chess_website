// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import { Team } from "../chess_game/Team";
import { MoveCommand } from "../chess_game/GameCommands";
import "./Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { ChessGame } from "../chess_game/ChessGame";

export interface GameProps {
  game: ChessGame;
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
    game: new ChessGame(),
    displayText: "",
    fen: "",
  });

  async function executeCpuMoves(team: Team) {
    state.game
      .cpuMoveMinimax(team)
      .then((res) => {
        if (res.success) {
          playAudio();
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

  if (
    !state.game.status?.includes("Checkmate") &&
    !state.game.status?.includes("Draw")
  ) {
    const curr_player = state.game.currentPlayer;
    const capitalized_player =
      curr_player.charAt(0).toUpperCase() + curr_player.slice(1);

    state.displayText = `${capitalized_player} to move`;
  } else {
    state.displayText = `${state.game.status}`;
  }
  state.fen = state.game.getCurrentFen();

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
            playAudio();
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

  if (state) {
    if (isTouchDevice()) {
      return (
        <div>
          <div className="header">
            <h1>Chess</h1>
          </div>
          <div className="topnav">
            <button>Connect</button>
          </div>
          <div className="row">
            <div className="column">
              <h2></h2>
              <p></p>
            </div>
            <div className="column">
              <div className="chessBox">
                <DndProvider backend={TouchBackend}>
                  <Board
                    pieces={state.game.pieces}
                    sendMoveCommand={sendMoveCommand}
                    legalMoves={ChessGame.findLegalMovesCurry(
                      state.game.gameState
                    )}
                  />
                </DndProvider>
              </div>
              <div>
                <TextComponent
                  statusMessage={state.game.status || ""}
                  nextToMove={`${state.game.currentPlayer} to move next`}
                  fenString={state.fen}
                />
                <AudioPlayer ref={audioPlayerRef} />
              </div>
            </div>
            <div className="column">
              <h2></h2>
              <p></p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <div className="header">
            <h1>Chess</h1>
          </div>
          <div className="topnav">
            <button>Connect</button>
          </div>
          <div className="row">
            <div className="column">
              <h2></h2>
              <p></p>
            </div>
            <div className="column">
              <div className="chessBox">
                <DndProvider backend={HTML5Backend}>
                  <Board
                    pieces={state.game.pieces}
                    sendMoveCommand={sendMoveCommand}
                    legalMoves={ChessGame.findLegalMovesCurry(
                      state.game.gameState
                    )}
                  />
                </DndProvider>
              </div>
              <div>
                <TextComponent
                  statusMessage={state.game.status || ""}
                  nextToMove={`${state.game.currentPlayer} to move next`}
                  fenString={state.fen}
                />
                <AudioPlayer ref={audioPlayerRef} />
              </div>
            </div>
            <div className="column">
              <h2></h2>
              <p></p>
            </div>
          </div>
        </div>
      );
    }
  } else {
    return <></>;
  }
};
