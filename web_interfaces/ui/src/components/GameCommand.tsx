// GameCommand.tsx

export type CommandType = "move" | "resign";

export interface ILocation {
  readonly row: number;
  readonly col: number;
}

export class BoardLocation implements ILocation {
  constructor(public readonly row: number, public readonly col: number) {}

  isEqual(otherLocation: ILocation): boolean {
    return this.row === otherLocation.row && this.col === otherLocation.col;
  }
}

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
