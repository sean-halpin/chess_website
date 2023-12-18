// MoveCommand.tsx

import { BoardLocation } from "./ChessGameTypes";

export interface MoveCommand {
  command: "move";
  pieceId: string;
  source: BoardLocation;
  destination: BoardLocation;
}
