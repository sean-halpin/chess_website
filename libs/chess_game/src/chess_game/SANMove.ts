export class SANMove {
    // #region Properties (4)

    public clock: string;
    public moveColor: string;
    public moveNumber: number;
    public san: string;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(moveNumber: number, moveColor: string, san: string, clock: string) {
        this.moveNumber = moveNumber;
        this.moveColor = moveColor;
        this.san = san;
        this.clock = clock;
    }

    // #endregion Constructors (1)
}
