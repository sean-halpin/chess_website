import { Err, Ok, Result } from "../rust_types/Result";
import { ChessGame } from "./ChessGame";
import { Loc } from "./Loc";

export class PGNParser {
  // #region Properties (1)

  public pgn: string;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(pgn: string) {
    this.pgn = pgn;
  }

  // #endregion Constructors (1)

  // #region Public Methods (3)

  public SANMovesToChessGame(moves: string[]): Result<ChessGame, string> {
    const game = new ChessGame();
    moves.forEach((move) => {
      const legalMoves = ChessGame.findLegalMoves(
        game.gameState,
        game.gameState.currentPlayer
      );
      const moveCmd = Loc.fromSAN(move);
      if (moveCmd.isSome()) {
        const moveCommand = legalMoves.find((m) =>
          m.destination.isEqual(moveCmd.unwrap())
        );
        if (moveCommand === undefined || moveCommand === null) {
          return Err("Invalid move");
        }
        game.executeCommand(moveCommand);
      } else {
        return Err("Invalid move");
      }
    });
    return Ok(game);
  }

  // parse pgn and return a map of key value pairs, move list should be keyed with 'moves'
  public parse(): Record<string, string> {
    const lines = this.pgn.split("\n");
    const result: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("[")) {
        const key = trimmed.substring(1, trimmed.indexOf(" "));
        const value = trimmed.substring(
          trimmed.indexOf('"') + 1,
          trimmed.lastIndexOf('"')
        );
        result[key] = value;
      } else if (trimmed.length > 0) {
        if (result["Moves"] === undefined) {
          result["Moves"] = trimmed;
        } else {
          result["Moves"] += ` ${trimmed}`;
        }
      }
    }
    return result;
  }

  public parseMoveText(moveText: string): string[] {
    // (\d+)(\.+)\s([RNBQKa-h0-8x+=#?!\-O]+)\s(?:([RNBQKa-h0-8x+=#?!\-O]+)\s)*  // Regex for move number and SAN
    // (?![^(]*\))(?![^{]*\})(?![^(]*\)) // Regex for ignoring comments in parentheses or curly braces
    const movesRegex =
      /(\d+)(\.+)\s([RNBQKa-h0-8x+=#?!\-O]+)\s(?:([RNBQKa-h0-8x+=#?!\-O]+)\s)*(?![^(]*\))(?![^{]*\})(?![^(]*\))/g;

    let match;
    const moves: string[] = [];

    while ((match = movesRegex.exec(moveText)) !== null) {
      if (match[2] === ".") {
        const white = match[3];
        const black = match[4];
        if (white !== undefined) moves.push(white);
        if (black !== undefined) moves.push(black);
      } else if (match[2] === "...") {
        const black = match[3];
        moves.push(black);
      }
    }
    // remove special characters from moves, like !, ?, +, #.
    return moves.map((m) =>
      m
        .replace(/[?!#+]/g, "")
        .trim()
    );
  }

  // #endregion Public Methods (3)
}
