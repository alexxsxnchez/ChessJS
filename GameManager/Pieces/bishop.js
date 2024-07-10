import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Bishop extends Piece {
    constructor(color) {
        super(PieceType.BISHOP, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        moves.push(...this.findDistanceMoves(board, row, col, 1, 1));
        moves.push(...this.findDistanceMoves(board, row, col, 1, -1));
        moves.push(...this.findDistanceMoves(board, row, col, -1, 1));
        moves.push(...this.findDistanceMoves(board, row, col, -1, -1));
        return moves;
    }
}

export default Bishop;
