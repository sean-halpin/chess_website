// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState } from "react";
import Board from "./Board";
import { Rank, ChessPiece, IChessPiece } from "./Piece";
import {
  GameCommand,
  BoardLocation,
  MoveCommand,
  ResignCommand,
} from "./GameCommand";
import "./Game.css";
import isTouchDevice from "is-touch-device";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";

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
      column === 3
        ? "queen"
        : column === 4
        ? "king"
        : createPiecesOrder()[column],
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
interface IMoveResult {
  destination: BoardLocation;
  movingPiece: IChessPiece;
  takenPiece: ChessPiece;
  enPassantPossible?: Boolean;
}

class MoveResult implements IMoveResult {
  constructor(
    public destination: BoardLocation,
    public movingPiece: IChessPiece,
    public takenPiece: ChessPiece,
    public enPassantPossible: Boolean
  ) {}
  toMoveCommand(): MoveCommand {
    return {
      command: "move",
      pieceId: this.movingPiece.id,
      source: this.movingPiece.position,
      destination: this.destination,
    };
  }
}

type CommandResult = MoveResult | null;

export interface GameState {
  board: ChessBoard;
  currentPlayer: "white" | "black";
  winner?: "white" | "black" | "draw";
  commands: CommandResult[];
}

const CopyGameState = (state: GameState): GameState => {
  return JSON.parse(JSON.stringify(state));
};

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
  useEffect(() => {
    if (gameState.currentPlayer === "black") {
      randomMove(gameState, "black");
    }
  });

  const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
  const isSquareEmpty = (r: number, c: number, b: ChessBoard) =>
    !isOOB(r, c) && b[r][c] == null;
  const squareEntry = (
    r: number,
    c: number,
    b: ChessBoard,
    mP: IChessPiece
  ): ChessPiece => {
    if (!isOOB(r, c) && b[r][c] !== null) {
      return b[r][c];
    } else {
      return null;
    }
  };

  const findLegalPawnMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    const currentBoard = gameState.board;
    const teamDirection = movingPiece.color === "white" ? 1 : -1;
    const { row: movingPieceCurrentRow, col: movingPieceCurrentCol } =
      movingPiece.position;

    // Pawn advance 1
    const nextRow = movingPieceCurrentRow + 1 * teamDirection;
    if (isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(nextRow, movingPieceCurrentCol),
          movingPiece,
          null,
          false
        )
      );
    }

    // Pawn sideways attack
    const attackableCol = (column_offset: number) =>
      movingPieceCurrentCol + column_offset;
    const attackableRow = nextRow;
    const possiblePieceRight = squareEntry(
      attackableRow,
      attackableCol(1),
      currentBoard,
      movingPiece
    );
    if (
      possiblePieceRight !== null &&
      possiblePieceRight?.color !== movingPiece.color
    ) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(attackableRow, attackableCol(1)),
          movingPiece,
          currentBoard[attackableRow][attackableCol(1)],
          false
        )
      );
    }
    const possiblePieceLeft = squareEntry(
      attackableRow,
      attackableCol(-1),
      currentBoard,
      movingPiece
    );
    if (
      possiblePieceLeft !== null &&
      possiblePieceLeft?.color !== movingPiece.color
    ) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(attackableRow, attackableCol(-1)),
          movingPiece,
          currentBoard[attackableRow][attackableCol(-1)],
          false
        )
      );
    }

    // Pawn advance 2 on first move
    const doubleMoveRow = nextRow + 1 * teamDirection;
    if (
      movingPiece.firstMove &&
      isSquareEmpty(doubleMoveRow, movingPieceCurrentCol, currentBoard) &&
      isSquareEmpty(nextRow, movingPieceCurrentCol, currentBoard)
    ) {
      moveResults.push(
        new MoveResult(
          new BoardLocation(doubleMoveRow, movingPieceCurrentCol),
          movingPiece,
          null,
          true
        )
      );
    }

    // En Passant
    const lastCommand = gameState.commands[gameState.commands.length - 1];
    if (gameState.commands.length > 0 && lastCommand?.enPassantPossible) {
      const enPassantAttackable = (column_offset: number) => {
        const possiblePiece = squareEntry(
          movingPieceCurrentRow,
          movingPieceCurrentCol + column_offset,
          currentBoard,
          movingPiece
        );
        return (
          possiblePiece?.rank === "pawn" &&
          possiblePiece?.color !== movingPiece.color
        );
      };
      if (enPassantAttackable(-1)) {
        moveResults.push(
          new MoveResult(
            new BoardLocation(attackableRow, attackableCol(-1)),
            movingPiece,
            currentBoard[movingPieceCurrentRow][movingPieceCurrentCol - 1],
            false
          )
        );
      }
      if (enPassantAttackable(1)) {
        moveResults.push(
          new MoveResult(
            new BoardLocation(attackableRow, attackableCol(1)),
            movingPiece,
            currentBoard[movingPieceCurrentRow][movingPieceCurrentCol + 1],
            false
          )
        );
      }
    }
    return moveResults;
  };

  const findMovesInDirection = (
    movingPiece: IChessPiece,
    gameState: GameState,
    rowOffset: number,
    colOffset: number,
    maximumDistance: number = 8
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    const currentBoard = gameState.board;
    const { row, col } = movingPiece.position;

    let newRow = row + rowOffset;
    let newCol = col + colOffset;

    let count = 0;
    let shouldExit = false;
    while (!isOOB(newRow, newCol) && count < maximumDistance && !shouldExit) {
      count += 1;
      if (isSquareEmpty(newRow, newCol, currentBoard)) {
        moveResults.push(
          new MoveResult(
            new BoardLocation(newRow, newCol),
            movingPiece,
            null,
            false
          )
        );
      }

      const possiblePiece = squareEntry(
        newRow,
        newCol,
        currentBoard,
        movingPiece
      );

      if (possiblePiece) {
        if (possiblePiece?.color !== movingPiece.color) {
          moveResults.push(
            new MoveResult(
              new BoardLocation(newRow, newCol),
              movingPiece,
              possiblePiece,
              false
            )
          );
        }
        shouldExit = true;
      }
      newRow += rowOffset;
      newCol += colOffset;
    }
    return moveResults;
  };

  const findHorVerMoves = (
    movingPiece: IChessPiece,
    gameState: GameState,
    maximumDistance: number = 8
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];

    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, 0, 1, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, 0, -1, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, 1, 0, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -1, 0, maximumDistance)
    );

    return moveResults;
  };

  const findDiagonalMoves = (
    movingPiece: IChessPiece,
    gameState: GameState,
    maximumDistance: number = 8
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];

    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, 1, 1, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, 1, -1, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -1, 1, maximumDistance)
    );
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -1, -1, maximumDistance)
    );

    return moveResults;
  };

  const findLegalCastleMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return findHorVerMoves(movingPiece, gameState);
  };

  const findLegalBishopMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return findDiagonalMoves(movingPiece, gameState);
  };

  const isKingChecked = (gameState: GameState, color: string): Boolean => {
    return (
      gameState.board
        .flat()
        .filter((piece) => piece != null && piece.color !== color)
        .map((enemyPiece) => {
          if (enemyPiece) {
            return moveFunctions[enemyPiece?.rank](enemyPiece, gameState);
          } else {
            return [];
          }
        })
        .flat()
        .filter((moveResult) => moveResult.takenPiece?.rank === "king").length >
      0
    );
  };

  const doesMoveCheckKing = (
    move: MoveResult,
    gs: GameState,
    color: string
  ) => {
    const updatedGameState = applyMoveCommand(move.toMoveCommand(), gs);
    return isKingChecked(updatedGameState, color);
  };

  const findLegalQueenMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return [
      ...findHorVerMoves(movingPiece, gameState),
      ...findDiagonalMoves(movingPiece, gameState),
    ];
  };

  const findLegalKingMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    return [
      ...findHorVerMoves(movingPiece, gameState, 1),
      ...findDiagonalMoves(movingPiece, gameState, 1),
    ];
  };

  const findLegalKnightMoves = (
    movingPiece: IChessPiece,
    gameState: GameState
  ): MoveResult[] => {
    const moveResults: MoveResult[] = [];
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, 2, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 1, -2, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, -1, 2, 1));
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -1, -2, 1)
    );
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, 1, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, 2, -1, 1));
    moveResults.push(...findMovesInDirection(movingPiece, gameState, -2, 1, 1));
    moveResults.push(
      ...findMovesInDirection(movingPiece, gameState, -2, -1, 1)
    );

    return moveResults;
  };

  const moveFunctions = {
    pawn: findLegalPawnMoves,
    castle: findLegalCastleMoves,
    knight: findLegalKnightMoves,
    bishop: findLegalBishopMoves,
    queen: findLegalQueenMoves,
    king: findLegalKingMoves,
  };

  const randomMove = (gameState: GameState, color: string) => {
    console.log(`[random move]`);
    let possibleMoves = [];
    const pieces = gameState.board
      .flat()
      .filter((p) => p !== null && p.color === color);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    if (randomPiece) {
      console.log(`[random move]: ${randomPiece.id}`);
      possibleMoves = moveFunctions[randomPiece?.rank](
        randomPiece,
        gameState
      ).filter(
        (move) =>
          !doesMoveCheckKing(move, CopyGameState(gameState), randomPiece.color)
      );
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
        console.log(
          `[random move]: ${moveCommand.destination.row}-${moveCommand.destination.col}`
        );
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
          if (
            gameState.currentPlayer !== moving_piece?.color ||
            !moving_piece
          ) {
            console.log("Team not in play");
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
    console.log(`[Game] New Command: ${newCommand.command}`);

    const clonedGameState = CopyGameState(gameState);
    const updatedBoard = clonedGameState.board;
    const cmdResult: CommandResult = attemptCommand(newCommand, gameState);

    if (cmdResult) {
      console.log(
        `[cmdResult move]: ${cmdResult.destination.row}-${cmdResult.destination.col}`
      );

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
      gameState.commands.push(cmdResult);

      // Update GameState
      gameState = {
        board: updatedBoard,
        currentPlayer: gameState.currentPlayer === "white" ? "black" : "white",
        commands: gameState.commands,
      };
    }
    return gameState;
  };

  const handleResignCommand = (newCommand: ResignCommand) => {
    console.log(`[Game] New Command: ${newCommand.command}`);
  };

  const sendGameCommand = (newCommand: GameCommand) => {
    switch (newCommand.command) {
      case "move":
        setGameState(applyMoveCommand(newCommand, gameState));
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
          <h1>Chess Game</h1>
          <DndProvider backend={TouchBackend}>
            <Board
              pieces={gameState.board.flat()}
              sendGameCommand={sendGameCommand}
            />
          </DndProvider>
        </div>
      );
    } else {
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
    }
  } else {
    return <></>;
  }
};
