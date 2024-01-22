// MoveCommand.tsx

import { Loc } from "./Loc";

export class MoveCommand {
  source: Loc;
  destination: Loc;

  constructor(source: Loc, destination: Loc) {
    this.source = source;
    this.destination = destination;
  }
}

export function moveCommandToString(command: MoveCommand): string {
  return `${command.source.toNotation}-${command.destination.toNotation}}`;
}
