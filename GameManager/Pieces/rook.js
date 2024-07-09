import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Rook extends Piece {
    constructor(color) {
        super(PieceType.ROOK, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];

        return moves;
    }
}

export default Rook;
