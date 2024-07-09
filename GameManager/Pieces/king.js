import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class King extends Piece {
    constructor(color) {
        super(PieceType.KING, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default King;
