import { Team, Rank } from "./ChessGameTypes";
import { Loc } from "./Loc";


export class ChessPiece {
    // #region Constructors (1)
    constructor(
        public readonly id: string,
        public readonly team: Team,
        public rank: Rank,
        public position: Loc,
        public firstMove: boolean = true
    ) { }

}
