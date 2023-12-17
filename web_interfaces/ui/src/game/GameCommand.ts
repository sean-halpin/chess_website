// MoveCommand.tsx

import { BoardLocation } from "./ChessGameLogic";

export interface MoveCommand {
  command: "move";
  pieceId: string;
  source: BoardLocation;
  destination: BoardLocation;
}
