// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import { ChessPiece } from "../game/ChessGameLogic";
import { Team } from "../game/ChessGameLogic";
import { Rank } from "../game/ChessGameLogic";
import { GameCommand, MoveCommand, ResignCommand } from "../game/GameCommand";
import { BoardLocation } from "../game/ChessGameLogic";
import "./Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";
import { ChessGameLogic } from "../game/ChessGameLogic";
import { MoveResult } from "../game/ChessGameLogic";
import {
  GameState,
  CommandResult,
  CopyGameState,
} from "../game/ChessGameLogic";
import {
  findLegalBishopMoves,
  findLegalCastleMoves,
  findLegalKingMoves,
  findLegalKnightMoves,
  findLegalPawnMoves,
  findLegalQueenMoves,
} from "../game/PieceLogic";

export const ChessGame: React.FC = () => {
  const audioPlayerRef = useRef<AudioPlayer>(null);

  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
    }
  };

  const [gameState, setGameState] = useState<GameState>(
    new ChessGameLogic().getGameState()
  );

  const initial_player = gameState.currentPlayer;
  const capitalized_initial_player =
    initial_player.charAt(0).toUpperCase() + initial_player.slice(1);
  gameState.displayText = `${capitalized_initial_player} to move`;

  useEffect(() => {
    if (gameState.winner === null) {
      const curr_player = gameState.currentPlayer;
      const capitalized_player =
        curr_player.charAt(0).toUpperCase() + curr_player.slice(1);
      gameState.displayText = `${capitalized_player} to move`;
    }
    const waitOneSecond = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`[Game] Next move ${capitalized_initial_player}`);
      if (gameState.winner === null && gameState.currentPlayer === Team.Black) {
        randomMove(gameState, Team.Black);
      }
    };
    waitOneSecond();
  });

  const moveFunctions = {
    pawn: findLegalPawnMoves,
    castle: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

  const randomMove = (gameState: GameState, color: string) => {
    let possibleMoves = [];
    const pieces = gameState.board
      .flat()
      .filter((p) => p !== null && p.team === color);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    if (randomPiece) {
      possibleMoves = moveFunctions[randomPiece?.rank](randomPiece, gameState);
      if (possibleMoves.length > 0) {
        const randomMove: MoveResult =
          possibleMoves.flat()[
            Math.floor(Math.random() * possibleMoves.flat().length)
          ];
        const moveCommand: GameCommand = {
          command: "move",
          pieceId: randomPiece.id,
          source: new BoardLocation(
            randomPiece.position.row,
            randomPiece.position.col
          ),
          destination: new BoardLocation(
            randomMove.destination.row,
            randomMove.destination.col
          ),
        };
        sendGameCommand(moveCommand);
      } else {
        randomMove(gameState, color);
      }
    }
  };

  const attemptCommand = (
    cmd: GameCommand,
    gameState: GameState
  ): CommandResult => {
    switch (cmd.command) {
      case "move":
        const moving_piece = gameState.board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);
        if (moving_piece) {
          if (gameState.currentPlayer !== moving_piece?.team || !moving_piece) {
            console.log("[Game] Team not in play");
            return null;
          }

          const moveFunction = moveFunctions[moving_piece.rank];
          if (moveFunction) {
            const moves = moveFunction(moving_piece, gameState);
            const chosenMove = moves.find((result) =>
              result.destination.isEqual(cmd.destination)
            );
            if (chosenMove) return chosenMove;
          }
        }
        break;

      case "resign":
        break;

      default:
        break;
    }
    return null;
  };

  const applyMoveCommand = (
    newCommand: MoveCommand,
    gameState: GameState
  ): GameState => {
    const clonedGameState = CopyGameState(gameState);
    const updatedBoard = clonedGameState.board;
    const cmdResult: CommandResult = attemptCommand(
      newCommand,
      clonedGameState
    );

    if (cmdResult) {
      const { takenPiece, movingPiece } = cmdResult;

      // Remove taken piece
      if (takenPiece) {
        updatedBoard[takenPiece.position.row][takenPiece.position.col] = null;
      }

      // Update moving piece
      if (movingPiece) {
        movingPiece.position = cmdResult.destination;
        movingPiece.firstMove = false;
        updatedBoard[newCommand.source.row][newCommand.source.col] = null;
        updatedBoard[movingPiece.position.row][movingPiece.position.col] =
          movingPiece;
      }

      // Push Latest Command Result
      clonedGameState.commands.push(cmdResult);

      // Return New GameState
      return {
        board: updatedBoard,
        currentPlayer:
          clonedGameState.currentPlayer === Team.White
            ? Team.Black
            : Team.White,
        commands: clonedGameState.commands,
        counter: clonedGameState.counter,
        displayText: clonedGameState.displayText,
        winner: null,
      };
    }
    return clonedGameState;
  };

  const handleResignCommand = (newCommand: ResignCommand) => {
    console.log(`[Game] New Command: ${newCommand.command}`);
  };

  const isKingInCheck = (
    gameState: GameState,
    playerColor: Team,
    moveCommand: MoveCommand
  ): boolean => {
    // Make a copy of the current game state
    const clonedGameState = CopyGameState(gameState);

    // Apply the move command to the copied game state
    const updatedGameState = applyMoveCommand(moveCommand, clonedGameState);

    // Find the current player's king on the updated board
    const king = updatedGameState.board
      .flat()
      .find(
        (piece) => piece?.team === playerColor && piece?.rank === Rank.King
      ) as ChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = playerColor === Team.White ? Team.Black : Team.White;
    const opponentPieces = updatedGameState.board
      .flat()
      .filter((piece) => piece?.team === opponentColor)
      .map((piece) => piece as ChessPiece);

    for (const opponentPiece of opponentPieces) {
      const opponentMoves = moveFunctions[opponentPiece.rank](
        opponentPiece,
        updatedGameState
      );

      for (const moveResult of opponentMoves) {
        if (moveResult.destination.isEqual(king.position)) {
          // The king is in check after the move
          return true;
        }
      }
    }

    // The king is not in check after the move
    return false;
  };

  const isCheckmate = (
    gameState: GameState,
    opponentColor: Team,
    moveCommand: MoveCommand
  ): boolean => {
    // Check if the king is in check
    const inCheck = isKingInCheck(gameState, opponentColor, moveCommand);

    if (!inCheck) {
      // The king is not in check, so it's not checkmate
      return false;
    }

    // Check if there are any legal moves to get out of check
    const playerPieces = gameState.board
      .flat()
      .filter((piece) => piece?.team === opponentColor)
      .map((piece) => piece as ChessPiece);

    for (const piece of playerPieces) {
      const moves = moveFunctions[piece.rank](piece, gameState);

      for (const moveResult of moves) {
        const updatedGameState = applyMoveCommand(
          moveResult.toMoveCommand(),
          CopyGameState(gameState)
        );

        if (
          !isKingInCheck(
            updatedGameState,
            opponentColor,
            moveResult.toMoveCommand()
          )
        ) {
          // There is at least one legal move to get out of check
          return false;
        }
      }
    }

    // No legal moves available, it's checkmate
    return true;
  };

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        const clonedState = CopyGameState(gameState);
        const ownKingChecked = isKingInCheck(
          clonedState,
          clonedState.currentPlayer,
          newCommand
        );
        const updatedState = !ownKingChecked
          ? applyMoveCommand(newCommand, clonedState)
          : clonedState;

        setGameState({
          ...updatedState,
          counter: clonedState.counter + 1,
        });

        if (ownKingChecked) {
          console.warn("Invalid move: puts own king in check");
        } else {
          playAudio();
        }
        break;
      case "resign":
        handleResignCommand(newCommand);
        break;
      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };

  if (gameState) {
    console.log(gameState.board.flat());
    if (isTouchDevice()) {
      return (
        <div>
          <h1>Chess</h1>
          <DndProvider backend={TouchBackend}>
            <Board
              pieces={gameState.board.flat()}
              sendGameCommand={sendGameCommand}
            />
          </DndProvider>
          <TextComponent text={gameState.displayText} />
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      );
    } else {
      return (
        <div>
          <h1>Chess</h1>
          <DndProvider backend={HTML5Backend}>
            <Board
              pieces={gameState.board.flat()}
              sendGameCommand={sendGameCommand}
            />
          </DndProvider>
          <TextComponent text={gameState.displayText} />
          <AudioPlayer ref={audioPlayerRef} />
        </div>
      );
    }
  } else {
    return <></>;
  }
};
