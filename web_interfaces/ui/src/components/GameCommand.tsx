// GameCommand.tsx

export type CommandType = "move" | "resign";

export interface ILocation {
    row: number; 
    col: number
}

export class Loc implements ILocation {
    constructor(public row: number, public col: number) {}
  
    isEqual(otherLocation: ILocation): boolean {
      return this.row === otherLocation.row && this.col === otherLocation.col;
    }
  }

export interface MoveCommand {
  command: "move";
  pieceId: string;
  source: Loc;
  destination: Loc;
}

export interface ResignCommand {
  command: "resign";
}

export type GameCommand = MoveCommand | ResignCommand;
