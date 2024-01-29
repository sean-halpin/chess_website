import { None, Some, Option } from "../../rust_types/Option";
import { Loc } from "../Loc";
import { StandardAlgebraicNotationMove } from "../StandardAlgebraicNotationMove";
import { Rank } from "../Rank";

describe("Loc", () => {
  const testValidMove = (
    move: string,
    expected: Option<StandardAlgebraicNotationMove>
  ) => {
    expect(Loc.fromSAN(move)).toEqual(expected);
  };
  const testInvalidMove = (move: string) => {
    expect(Loc.fromSAN(move)).toEqual(None);
  };

  describe("fromSAN", () => {
    // prettier-ignore
    it("should return Some(StandardAlgebraicNotationMove) for valid moves of length 2", () => {
            testValidMove("a1", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("a1"), None, None, None, None, None, None)));
            testValidMove("a3", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("a3"), None, None, None, None, None, None)));
            testValidMove("e4", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("e4"), None, None, None, None, None, None)));
            testValidMove("g7", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("g7"), None, None, None, None, None, None)));
            testValidMove("g8", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("g8"), None, None, None, None, None, None)));
            expect(Loc.fromSAN("O-O")).toEqual(Some(StandardAlgebraicNotationMove.create(None, None, Some(true), None, None, None, None)));
            expect(Loc.fromSAN("O-O-O")).toEqual(Some(StandardAlgebraicNotationMove.create(None, None, None, Some(true), None, None, None)));
            testValidMove("dxe4", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("e4"), None, None, None, Some(true), Loc.columnFromNotation("d"), None)));
            testValidMove("Nxe4", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("e4"), Some(Rank.Knight), None, None, Some(true), None, None)));
            testValidMove("Rf3", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("f3"), Some(Rank.Rook), None, None, None, None, None)));
    });

    // prettier-ignore
    it("should return Some(StandardAlgebraicNotationMove) for valid moves of length 3", () => {
            testValidMove("Nf6", Some(StandardAlgebraicNotationMove.create(Loc.fromNotation("f6"), Some(Rank.Knight), None, None, None, None, None)));
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
