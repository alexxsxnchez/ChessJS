import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Queen extends Piece {
    constructor(color) {
        super(PieceType.QUEEN, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default Queen;
