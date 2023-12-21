// MoveCommand.tsx

import { Loc } from "./ChessGameTypes";

export interface MoveCommand {
  command: "move";
  source: Loc;
  destination: Loc;
}
