import { Option } from "../types/Option";
import { Loc } from "./Loc";
import { ChessPiece } from "./ChessPiece";

export class ChessBoard {
    // #region Properties (1)
    private _pieces: Option<ChessPiece>[][] = [];

    // #endregion Properties (1)
    // #region Constructors (1)
    constructor(pieces: Option<ChessPiece>[][]) {
        this._pieces = pieces;
    }

    // #endregion Constructors (1)
    // #region Public Accessors (2)
    public get pieces(): Option<ChessPiece>[][] {
        return this._pieces;
    }

    public set pieces(value: Option<ChessPiece>[][]) {
        this._pieces = value;
    }

    // #endregion Public Accessors (2)
    // #region Public Methods (4)
    public pieceFromLoc(location: Loc): Option<ChessPiece> {
        return this.pieces[location.row][location.col];
    }

    public pieceFromRowCol(row: number, col: number): Option<ChessPiece> {
        return this.pieces[row][col];
    }

    public updatePieceFromLoc(location: Loc, newPiece: Option<ChessPiece>) {
        if (newPiece.isSome()) {
            newPiece.unwrap().position = location;
        }
        this.pieces[location.row][location.col] = newPiece;
    }

    public updatePieceFromRowCol(
        row: number,
        col: number,
        newPiece: Option<ChessPiece>
    ) {
        if (newPiece.isSome()) {
            newPiece.unwrap().position = new Loc(row, col);
        }
        this.pieces[row][col] = newPiece;
    }

}
