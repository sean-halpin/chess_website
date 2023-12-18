// MoveCommand.tsx

import { BoardLocation } from "./ChessGameTypes";

export interface MoveCommand {
  command: "move";
  source: BoardLocation;
  destination: BoardLocation;
}
