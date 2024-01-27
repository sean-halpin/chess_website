import { None, Some, Option } from "../../rust_types/Option";
import { Loc } from "../Loc";
import { StandardAlgebraicNotationMove } from "../StandardAlgebraicNotationMove";
import { Rank } from "../Rank";

describe("Loc", () => {
  const testValidMove = (
    move: string,
    expected: Option<StandardAlgebraicNotationMove>
  ) => {
    expect(Loc.fromSAN(move).unwrap().location.unwrap().toNotation()).toEqual(
      expected.unwrap().location.unwrap().toNotation()
    );
  };
  const testInvalidMove = (move: string) => {
    expect(Loc.fromSAN(move)).toEqual(None);
  };

  describe("fromSAN", () => {
    // prettier-ignore
    it("should return Some(StandardAlgebraicNotationMove) for valid moves of length 2", () => {
            testValidMove("a1", Some(StandardAlgebraicNotationMove.withLoc(Loc.fromNotation("a1"))));
            testValidMove("a3", Some(StandardAlgebraicNotationMove.withLoc(Loc.fromNotation("a3"))));
            testValidMove("e4", Some(StandardAlgebraicNotationMove.withLoc(Loc.fromNotation("e4"))));
            testValidMove("g7", Some(StandardAlgebraicNotationMove.withLoc(Loc.fromNotation("g7"))));
            testValidMove("g8", Some(StandardAlgebraicNotationMove.withLoc(Loc.fromNotation("g8"))));
            expect(Loc.fromSAN("O-O")).toEqual(Some(StandardAlgebraicNotationMove.withKingSideCastle()));
            expect(Loc.fromSAN("O-O-O")).toEqual(Some(StandardAlgebraicNotationMove.withQueenSideCastle()));
    });

    // prettier-ignore
    it("should return Some(StandardAlgebraicNotationMove) for valid moves of length 3", () => {
            testValidMove("Nf3", Some(StandardAlgebraicNotationMove.withLocRank(Loc.fromNotation("f3"), Some(Rank.Knight))));
        });
    // prettier-ignore
    it("should return None for invalid moves", () => {
            testInvalidMove("a0");
            testInvalidMove("a9");
            testInvalidMove("e");
            testInvalidMove("Nf");
            testInvalidMove("e55");
            testInvalidMove("g9");
    });
  });
});
