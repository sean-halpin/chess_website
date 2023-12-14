// Game.tsx

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { useState } from "react";
import Board from "./Board";
import { Rank, ChessPiece, IChessPiece } from "./Piece";
import { GameCommand, BoardLocation } from "./GameCommand";
import "./Game.css";

type PieceColor = "white" | "black";

const createPiece = (
  color: PieceColor,
  position: BoardLocation,
  rank: Rank,
  i: number
): ChessPiece => ({
  id: `${color}-${rank}-${i}`,
  rank,
  color,
  position,
  firstMove: true,
});

const createPiecesOrder = (): Rank[] => [
  "castle",
  "knight",
  "bishop",
  "queen",
  "king",
  "bishop",
  "knight",
  "castle",
];

const createPieces = (color: PieceColor, row: number): ChessPiece[] =>
  Array.from({ length: 8 }, (_, column) =>
    createPiece(
      color,
      new BoardLocation(row, column),
      column === 3 ? "queen" : column === 4 ? "king" : createPiecesOrder()[column],
      column
    )
  );

const createPawns = (): ChessPiece[] =>
  Array.from({ length: 16 }, (_, column) =>
    createPiece(
      column < 8 ? "white" : "black",
      new BoardLocation(column < 8 ? 1 : 6, column % 8),
      "pawn",
      column % 8
    )
  );

const placeBackRow = (): ChessPiece[] => [
  ...createPieces("white", 0),
  ...createPieces("black", 7),
];

type ChessBoard = ChessPiece[][];
interface MoveResult {
  destination: BoardLocation;
  movingPiece: ChessPiece;
  takenPiece: ChessPiece;
  enPassantPossible?: Boolean;
}
type CommandResult = MoveResult | null;

export interface GameState {
  board: ChessBoard;
  currentPlayer: "white" | "black";
  winner?: "white" | "black" | "draw";
  commands: CommandResult[];
}

export const ChessGame: React.FC = () => {
  const pieces: ChessPiece[] = [...createPawns(), ...placeBackRow()];
  const initialBoard: ChessBoard = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );
  pieces.forEach((p) => {
    if (p) {
      initialBoard[p.position.row][p.position.col] = p;
    }
  });
  const [gameState, setGameState] = useState<GameState>({
    board: initialBoard,
    currentPlayer: "white",
    commands: [],
  });

  const findLegalPawnMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    const currentBoard = gameState.board;
    const teamDirection = movingPiece.color === "white" ? 1 : -1;
    const { row, col } = movingPiece.position;

    const isOOB = (r: number, c: number) => {
      return r < 0 || r > 7 || c < 0 || c > 7;
    };
    const isSquareEmpty = (r: number, c: number) => {
      return !isOOB(r, c) && currentBoard[r][c] == null;
    };
    const isSquareAttackable = (r: number, c: number): ChessPiece | null => {
      if (
        !isOOB(r, c) &&
        currentBoard[r][c] != null &&
        currentBoard[r][c]?.color !== movingPiece.color
      ) {
        return currentBoard[r][c];
      } else {
        return null;
      }
    };
    // Pawn advance 1
    if (isSquareEmpty(row + 1 * teamDirection, col)) {
      moveResults.push({
        destination: new BoardLocation(row + 1 * teamDirection, col),
        movingPiece: movingPiece,
        takenPiece: null,
      });
    }
    // Pawn sideways attack
    if (isSquareAttackable(row + 1 * teamDirection, col + 1)) {
      moveResults.push({
        destination: new BoardLocation(row + 1 * teamDirection, col + 1),
        takenPiece: currentBoard[row + 1 * teamDirection][col + 1],
        movingPiece: movingPiece,
      });
    }
    if (isSquareAttackable(row + 1 * teamDirection, col - 1)) {
      moveResults.push({
        destination: new BoardLocation(row + 1 * teamDirection, col - 1),
        takenPiece: currentBoard[row + 1 * teamDirection][col - 1],
        movingPiece: movingPiece,
      });
    }
    // Pawn advance 2 on first move
    if (
      movingPiece.firstMove &&
      isSquareEmpty(row + 2 * teamDirection, col) &&
      isSquareEmpty(row + 1 * teamDirection, col)
    ) {
      moveResults.push({
        destination: new BoardLocation(row + 2 * teamDirection, col),
        movingPiece: movingPiece,
        takenPiece: null,
        enPassantPossible: true,
      });
    }
    // En Passant
    if (
      gameState.commands.length > 0 &&
      gameState.commands[gameState.commands.length - 1]?.enPassantPossible
    ) {
      if (isSquareAttackable(row, col - 1)?.rank === "pawn") {
        moveResults.push({
          destination: new BoardLocation(row + 1 * teamDirection, col - 1),
          movingPiece: movingPiece,
          takenPiece: currentBoard[row][col - 1],
        });
      }
      if (isSquareAttackable(row, col + 1)?.rank === "pawn") {
        moveResults.push({
          destination: new BoardLocation(row + 1 * teamDirection, col + 1),
          movingPiece: movingPiece,
          takenPiece: currentBoard[row][col + 1],
        });
      }
    }

    return moveResults;
  };

  const executeCommand = (
    cmd: GameCommand,
    gameState: GameState
  ): CommandResult => {
    switch (cmd.command) {
      case "move":
        let moving_piece = gameState.board
          .flat()
          .filter((p) => p != null)
          .find((p) => p?.id === cmd.pieceId);
        if (gameState.currentPlayer !== moving_piece?.color) {
          return null;
        }
        if (moving_piece) {
          switch (moving_piece.rank) {
            case "pawn":
              return findLegalPawnMoves(moving_piece, gameState).filter(
                (result) => result.destination.isEqual(cmd.destination)
              )[0];
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

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        console.log(`[Game] New Command: ${newCommand.command}`);
        const updatedBoard = [...gameState.board.map((row) => [...row])]; // Create a copy of the board
        const cmdResult: CommandResult = executeCommand(newCommand, gameState);
        if (cmdResult) {
          // Remove taken piece
          let takenPiece = cmdResult.takenPiece;
          if (takenPiece) {
            updatedBoard[takenPiece.position.row][takenPiece.position.col] =
              null;
            takenPiece = null;
          }
          // Update moving piece
          const movingPiece = cmdResult.movingPiece;
          if (movingPiece) {
            movingPiece.position = cmdResult.destination;
            movingPiece.firstMove = false;
            updatedBoard[newCommand.source.row][newCommand.source.col] = null;
            updatedBoard[movingPiece.position.row][movingPiece.position.col] =
              movingPiece;
          }
          // Push Latest Command Result
          gameState.commands.push(cmdResult);
          // Update GameState
          const updatedGameState: GameState = {
            board: updatedBoard,
            currentPlayer:
              gameState.currentPlayer === "white" ? "black" : "white",
            commands: gameState.commands,
          };
          setGameState(updatedGameState);
        }
        break;
      case "resign":
        console.log(`[Game] New Command: ${newCommand.command}`);
        break;
      default:
        console.warn(`[Game] Unknown command`);
        break;
    }
  };

  if (gameState) {
    console.log(gameState.board.flat());
    return (
      <div>
        <h1>Chess Game</h1>
        <DndProvider backend={HTML5Backend}>
          <Board
            pieces={gameState.board.flat()}
            sendGameCommand={sendGameCommand}
          />
        </DndProvider>
      </div>
    );
  } else {
    return <></>;
  }
};
