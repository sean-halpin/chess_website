export enum Rank {
  Rook = "rook",
  Knight = "knight",
  Bishop = "bishop",
  Queen = "queen",
  King = "king",
  Pawn = "pawn",
}

// function that takes a rank and returns the value of the rank
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

export enum Team {
  White = "white",
  Black = "black",
}
