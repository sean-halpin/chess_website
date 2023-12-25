// MoveCommand.tsx

import { Loc } from "./ChessGameTypes";

export interface MoveCommand {
  command: "move";
  source: Loc;
  destination: Loc;
}

// movecommand to string
export function moveCommandToString(command: MoveCommand): string {
  return `${command.source.toNotation}-${command.destination.toNotation}}`;
}
