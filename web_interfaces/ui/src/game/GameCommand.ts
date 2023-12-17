// GameCommand.tsx

import { BoardLocation } from "./ChessGameLogic";

export type CommandType = "move" | "resign";

export interface MoveCommand {
  command: "move";
  pieceId: string;
  source: BoardLocation;
  destination: BoardLocation;
}

export interface ResignCommand {
  command: "resign";
}

export type GameCommand = MoveCommand | ResignCommand;
