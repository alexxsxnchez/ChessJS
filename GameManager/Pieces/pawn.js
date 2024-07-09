import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Pawn extends Piece {
    constructor(color) {
        super(PieceType.PAWN, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default Pawn;
