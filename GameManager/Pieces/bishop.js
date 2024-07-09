import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Bishop extends Piece {
    constructor(color) {
        super(PieceType.BISHOP, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default Bishop;
