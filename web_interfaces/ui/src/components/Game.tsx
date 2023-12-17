// Game.tsx

import { DndProvider } from "react-dnd";
import React, { useEffect, useState, useRef } from "react";
import Board from "./Board";
import { Rank, MaybeChessPiece, IChessPiece, Team } from "./Piece";
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
import AudioPlayer from "./AudioPlayer";
import { TextComponent } from "./TextComponent";

const createPiece = (
  team: Team,
  position: BoardLocation,
  rank: Rank,
  i: number
): MaybeChessPiece => ({
  id: `${team}-${rank}-${i}`,
  rank,
  team: team,
  position,
  firstMove: true,
});

const createPiecesOrder = (): Rank[] => [
  Rank.Castle,
  Rank.Knight,
  Rank.Bishop,
  Rank.Queen,
  Rank.King,
  Rank.Bishop,
  Rank.Knight,
  Rank.Castle,
];

const createPieces = (team: Team, row: number): MaybeChessPiece[] =>
  Array.from({ length: 8 }, (_, column) =>
    createPiece(
      team,
      new BoardLocation(row, column),
      column === 3
        ? Rank.Queen
        : column === 4
        ? Rank.King
        : createPiecesOrder()[column],
      column
    )
  );

const createPawns = (): MaybeChessPiece[] =>
  Array.from({ length: 16 }, (_, column) =>
    createPiece(
      column < 8 ? Team.White : Team.Black,
      new BoardLocation(column < 8 ? 1 : 6, column % 8),
      Rank.Pawn,
      column % 8
    )
  );

const placeBackRow = (): MaybeChessPiece[] => [
  ...createPieces(Team.White, 0),
  ...createPieces(Team.Black, 7),
];

type ChessBoard = MaybeChessPiece[][];
interface IMoveResult {
  destination: BoardLocation;
  movingPiece: IChessPiece;
  takenPiece: MaybeChessPiece;
  enPassantPossible?: Boolean;
}

class MoveResult implements IMoveResult {
  constructor(
    public destination: BoardLocation,
    public movingPiece: IChessPiece,
    public takenPiece: MaybeChessPiece,
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
  currentPlayer: Team.White | Team.Black;
  winner: Team.White | Team.Black | "draw" | null;
  commands: CommandResult[];
  counter: number;
  displayText: string;
}

const CopyGameState = (state: GameState): GameState => {
  return JSON.parse(JSON.stringify(state));
};

export const ChessGame: React.FC = () => {
  const audioPlayerRef = useRef<AudioPlayer>(null);

  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
    }
  };
  const pieces: MaybeChessPiece[] = [...createPawns(), ...placeBackRow()];
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
    currentPlayer: Team.White,
    commands: [],
    counter: 0,
    displayText: "",
    winner: null,
  });

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

  const isOOB = (r: number, c: number) => r < 0 || r > 7 || c < 0 || c > 7;
  const isSquareEmpty = (r: number, c: number, b: ChessBoard) =>
    !isOOB(r, c) && b[r][c] == null;
  const squareEntry = (
    r: number,
    c: number,
    b: ChessBoard
  ): MaybeChessPiece => {
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
    const teamDirection = movingPiece.team === Team.White ? 1 : -1;
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
      currentBoard
    );
    if (
      possiblePieceRight !== null &&
      possiblePieceRight?.team !== movingPiece.team
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
      currentBoard
    );
    if (
      possiblePieceLeft !== null &&
      possiblePieceLeft?.team !== movingPiece.team
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
          currentBoard
        );
        return (
          possiblePiece?.rank === Rank.Pawn &&
          possiblePiece?.team !== movingPiece.team
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

      const possiblePiece = squareEntry(newRow, newCol, currentBoard);

      if (possiblePiece) {
        if (possiblePiece?.team !== movingPiece.team) {
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
    // console.log(`[Game] New Command: ${newCommand.command}`);

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
      ) as IChessPiece;

    // Check if the king is under threat after the move
    const opponentColor = playerColor === Team.White ? Team.Black : Team.White;
    const opponentPieces = updatedGameState.board
      .flat()
      .filter((piece) => piece?.team === opponentColor)
      .map((piece) => piece as IChessPiece);

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
      .map((piece) => piece as IChessPiece);

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
    // console.log(${gameState.board.flat()});
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
