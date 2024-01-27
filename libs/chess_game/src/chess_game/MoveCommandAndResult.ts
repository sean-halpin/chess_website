import { MoveCommand } from "./MoveCommand";
import { MoveResult } from "./MoveResult";

// a class that contains a MoveCommand and MoveResult, each should be named
export class MoveCommandAndResult {
    constructor(
        readonly command: MoveCommand,
        readonly result: MoveResult
    ) { }
}
