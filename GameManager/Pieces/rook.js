import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Rook extends Piece {
    constructor(color) {
        super(PieceType.ROOK, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        moves.push(...this.findDistanceMoves(board, row, col, 0, 1));
        moves.push(...this.findDistanceMoves(board, row, col, 0, -1));
        moves.push(...this.findDistanceMoves(board, row, col, 1, 0));
        moves.push(...this.findDistanceMoves(board, row, col, -1, 0));
        return moves;
    }
}

export default Rook;
