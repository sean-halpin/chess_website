// Sample PGN

// [Event "Rated Bullet game"]
// [Site "https://lichess.org/LDMb6LzZ"]
// [Date "2021.10.15"]
// [White "ajedrez_87"]
// [Black "daedluapsi"]
// [Result "1-0"]
// [WhiteElo "922"]
// [BlackElo "880"]
// [TimeControl "60+0"]
// [Termination "Time forfeit"]
// [UTCDate "2024.01.22"]
// [UTCTime "16:45:21"]
// [Variant "Standard"]
// [ECO "B01"]
// [Opening "Scandinavian Defense: Mieses-Kotroc Variation"]
// [Annotator "https://lichess.org/@/ajedrez_87"]

// 1. e4 { [%clk 0:01:00] } 1... d5 { [%clk 0:01:00] } 2. exd5 { [%clk 0:00:58] } 2... Qxd5 { [%clk 0:00:59] } 3. Nc3 { [%clk 0:00:56] } 3... Qe5+ { [%clk 0:00:49] } 4. Qe2 { [%clk 0:00:48] } 4... Qxe2+ { [%clk 0:00:46] } 5. Bxe2 { [%clk 0:00:48] } 5... e6 { [%clk 0:00:45] } 6. Nf3 { [%clk 0:00:47] } 6... Bc5 { [%clk 0:00:44] } 7. d4 { [%clk 0:00:46] } 7... Bb4 { [%clk 0:00:41] } 8. Bb5+ { [%clk 0:00:44] } 8... c6 { [%clk 0:00:38] } 9. Ba4 { [%clk 0:00:40] } 9... b5 { [%clk 0:00:36] } 10. Bxb5 { [%clk 0:00:38] } 10... cxb5 { [%clk 0:00:34] } 11. O-O { [%clk 0:00:35] } 11... Bxc3 { [%clk 0:00:31] } 12. bxc3 { [%clk 0:00:33] } 12... Nf6 { [%clk 0:00:30] } 13. Bg5 { [%clk 0:00:31] } 13... O-O { [%clk 0:00:27] } 14. Rfe1 { [%clk 0:00:26] } 14... Ng4 { [%clk 0:00:24] } 15. h3 { [%clk 0:00:23] } 15... Nh6 { [%clk 0:00:17] } 16. Be7 { [%clk 0:00:20] } 16... Re8 { [%clk 0:00:13] } 17. Bd6 { [%clk 0:00:15] } 17... Nd7 { [%clk 0:00:09] } 18. Ne5 { [%clk 0:00:12] } 18... Nxe5 { [%clk 0:00:08] } 19. dxe5 { [%clk 0:00:12] } 19... Nf5 { [%clk 0:00:06] } 20. Rad1 { [%clk 0:00:09] } 20... Bb7 { [%clk 0:00:03] } 21. Be7 { [%clk 0:00:09] } 21... Rxe7 { [%clk 0:00:01] } 22. Rd8+ { 1-0 White wins on time. } { [%clk 0:00:09] } 1-0

export class PGNParser {
  // #region Properties (1)

  public pgn: string;

  // #endregion Properties (1)

  // #region Constructors (1)

  constructor(pgn: string) {
    this.pgn = pgn;
  }

  // #endregion Constructors (1)

  // #region Public Methods (1)

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

  // #endregion Public Methods (1)
}
