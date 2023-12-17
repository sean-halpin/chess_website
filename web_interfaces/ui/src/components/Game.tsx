// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import { Team } from "../game/ChessGameLogic";
import { GameCommand } from "../game/GameCommand";
import "./Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { ChessGameLogic } from "../game/ChessGameLogic";

export interface GameProps {
  game: ChessGameLogic;
  displayText: string;
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
  });

  const initial_player = state.game.currentPlayer;
  const capitalized_initial_player =
    initial_player.charAt(0).toUpperCase() + initial_player.slice(1);
  state.displayText = `${capitalized_initial_player} to move`;

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
      if (state.game.winner === null && state.game.currentPlayer === Team.Black) {
        // randomMove(gameState, Team.Black);
      }
    };
    waitOneSecond();
  });

  //   const randomMove = (gameState: GameState, color: string) => {
  //     let possibleMoves = [];
  //     const pieces = gameState.board
  //       .flat()
  //       .filter((p) => p !== null && p.team === color);
  //     const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
  //     if (randomPiece) {
  //       possibleMoves = moveFunctions[randomPiece?.rank](randomPiece, gameState);
  //       if (possibleMoves.length > 0) {
  //         const randomMove: MoveResult =
  //           possibleMoves.flat()[
  //             Math.floor(Math.random() * possibleMoves.flat().length)
  //           ];
  //         const moveCommand: GameCommand = {
  //           command: "move",
  //           pieceId: randomPiece.id,
  //           source: new BoardLocation(
  //             randomPiece.position.row,
  //             randomPiece.position.col
  //           ),
  //           destination: new BoardLocation(
  //             randomMove.destination.row,
  //             randomMove.destination.col
  //           ),
  //         };
  //         sendGameCommand(moveCommand);
  //       } else {
  //         randomMove(gameState, color);
  //       }
  //     }
  //   };

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        const result = state.game.executeCommand(newCommand);
        if (result.success) {
            playAudio();
            setState({
                ...state,
                game: result.data
            });
        }
        break;
      case "resign":
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
          <h1>Chess</h1>
          <DndProvider backend={TouchBackend}>
            <Board
              pieces={state.game.pieces}
              sendGameCommand={sendGameCommand}
            />
          </DndProvider>
          <TextComponent text={state.displayText} />
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      );
    } else {
      return (
        <div>
          <h1>Chess</h1>
          <DndProvider backend={HTML5Backend}>
            <Board
              pieces={state.game.pieces}
              sendGameCommand={sendGameCommand}
            />
          </DndProvider>
          <TextComponent text={state.displayText} />
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      );
    }
  } else {
    return <></>;
  }
};
