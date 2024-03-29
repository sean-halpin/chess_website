import { isNone, unwrap } from "../rust_types/Option";
import { Team } from "./Team";
import { Rank } from "./Rank";
import { GameState } from "./GameState";

// #region Functions (5)

export function fenPieceToTeam(str: string): Team {
  return str === str.toLowerCase() && str !== str.toUpperCase()
    ? Team.Black
    : Team.White;
}

export function fenToRank(fenChar: string): Rank {
  switch (fenChar.toLowerCase()) {
    case "r":
      return Rank.Rook;
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

export function rankToFEN(rank: Rank): string {
  switch (rank) {
    case Rank.Rook:
      return "r";
    case Rank.Knight:
      return "n";
    case Rank.Bishop:
      return "b";
    case Rank.Queen:
      return "q";
    case Rank.King:
      return "k";
    case Rank.Pawn:
      return "p";
    default:
      return "p";
  }
}

export function gameToFEN(game: GameState): string {
  let fen = "";

  for (let row = 7; row >= 0; row--) {
    let emptySquares = 0;
    for (let col = 0; col < 8; col++) {
      const piece = game.board.pieceFromRowCol(row, col);
      if (isNone(piece)) {
        emptySquares++;
      } else {
        const piece = unwrap(game.board.pieceFromRowCol(row, col));
        if (emptySquares > 0) {
          fen += emptySquares.toString();
          emptySquares = 0;
        }
        fen +=
          piece.team === Team.White
            ? rankToFEN(piece.rank).toUpperCase()
            : rankToFEN(piece.rank);
      }
    }
    if (emptySquares > 0) {
      fen += emptySquares.toString();
    }
    if (row > 0) {
      fen += "/";
    }
  }

  // Active color
  fen += ` ${game.currentPlayer === Team.White ? "w" : "b"} `;
  fen += "KQkq ";
  fen += "- ";
  fen += "0 1";

  return fen;
}

// #endregion Functions (5)
