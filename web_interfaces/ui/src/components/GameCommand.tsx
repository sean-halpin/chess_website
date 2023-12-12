export type CommandType = "move" | "resign";

export interface MoveCommand {
  command: "move";
  pieceId: string;
  source: { row: number; col: number };
  destination: { row: number; col: number };
}

export interface ResignCommand {
  command: "resign";
}

export type GameCommand = MoveCommand | ResignCommand;
