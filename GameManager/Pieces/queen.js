import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Queen extends Piece {
    constructor(color) {
        super(PieceType.QUEEN, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        moves.push(...this.findDistanceMoves(board, row, col, 0, 1));
        moves.push(...this.findDistanceMoves(board, row, col, 0, -1));
        moves.push(...this.findDistanceMoves(board, row, col, 1, 0));
        moves.push(...this.findDistanceMoves(board, row, col, -1, 0));
        moves.push(...this.findDistanceMoves(board, row, col, 1, 1));
        moves.push(...this.findDistanceMoves(board, row, col, 1, -1));
        moves.push(...this.findDistanceMoves(board, row, col, -1, 1));
        moves.push(...this.findDistanceMoves(board, row, col, -1, -1));
        return moves;
    }
}

export default Queen;
