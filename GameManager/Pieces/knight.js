import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Knight extends Piece {
    constructor(color) {
        super(PieceType.KNIGHT, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default Knight;
