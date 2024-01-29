// MoveCommand.tsx

import { Loc } from "./Loc";
import { Rank } from "./Rank";
import { None, Option } from "../rust_types/Option";

export class MoveCommand {
  source: Loc;
  destination: Loc;
  promotionRank: Option<Rank>;

  constructor(
    source: Loc,
    destination: Loc,
    promotionRank: Option<Rank> = None
  ) {
    this.source = source;
    this.destination = destination;
    this.promotionRank = promotionRank;
  }
}

export function moveCommandToString(command: MoveCommand): string {
  return `${command.source.toNotation}-${command.destination.toNotation}}-${
    command.promotionRank.isSome() ? command.promotionRank.toString() : ""
  }`;
}
