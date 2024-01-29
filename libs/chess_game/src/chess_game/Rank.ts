import { None, Some, Option } from "../rust_types/Option";

export enum Rank {
  Rook = "rook",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn"
}

// function that takes an algebraic rank and returns the corresponding Rank enum
export function rankFromAlgebraic(rank: string): Option<Rank> {
  switch (rank.toLowerCase()) {
    case "r":
      return Some(Rank.Rook);
    case "n":
      return Some(Rank.Knight);
    case "b":
      return Some(Rank.Bishop);
    case "q":
      return Some(Rank.Queen);
    case "k":
      return Some(Rank.King);
    case "p":
      return Some(Rank.Pawn);
    default:
      return None;
  }
}

// function that takes a Rank enum and returns the corresponding algebraic rank
export function algebraicFromRank(rank: Rank): string {
  switch (rank) {
    case Rank.Rook:
      return "R";
    case Rank.Knight:
      return "N";
    case Rank.Bishop:
      return "B";
    case Rank.Queen:
      return "Q";
    case Rank.King:
      return "K";
    case Rank.Pawn:
      return "P";
  }
}

export function rankValue(rank: Rank): number {
  switch (rank) {
    case Rank.Pawn:
      return 1;
    case Rank.Knight:
    case Rank.Bishop:
      return 3;
    case Rank.Rook:
      return 5;
    case Rank.Queen:
      return 9;
    case Rank.King:
      return 100;
  }
}
