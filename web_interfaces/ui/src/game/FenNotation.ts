import { Rank, Team } from "./ChessGameLogic";

export function fenToRank(fenChar: string): Rank {
  switch (fenChar.toLowerCase()) {
    case "r":
      return Rank.Castle;
    case "n":
      return Rank.Knight;
    case "b":
      return Rank.Bishop;
    case "q":
      return Rank.Queen;
    case "k":
      return Rank.King;
    case "p":
      return Rank.Pawn;
    default:
      return Rank.Pawn;
  }
}

export function fenToTeam(fenChar: string): Team {
  switch (fenChar.toLowerCase()) {
    case "w":
      return Team.White;
    case "b":
      return Team.Black;
    default:
      return Team.White;
  }
}

export function fenPieceToTeam(str: string): Team {
  return (str === str.toLowerCase() && str !== str.toUpperCase()) ? Team.Black : Team.White;
}
