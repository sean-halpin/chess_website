import { SANMove } from "./SANMove";

export class PGNParser {
  // #region Properties (1)

  public pgn: string;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(pgn: string) {
    this.pgn = pgn;
  }

  // #endregion Constructors (1)

  // #region Public Methods (2)

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
    const movesRegex = /(\d+)[.]+\s([a-zA-Z0-9+]+)/g;

    let match;
    const moves: SANMove[] = [];

    while ((match = movesRegex.exec(moveText)) !== null) {
      const moveNumber = parseInt(match[1]);
      const moveColor = match[2];
      const san = match[4];
      const clock = match[5];

      moves.push(new SANMove(moveNumber, moveColor, san, clock));
    }

    return moves.map((move) => move.san);
  }

  // #endregion Public Methods (2)
}
