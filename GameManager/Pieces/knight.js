import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class Knight extends Piece {
    constructor(color) {
        super(PieceType.KNIGHT, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        for (const rowOffset of [-2, -1, 1, 2]) {
            for (const colOffset of [-2, -1, 1, 2]) {
                if (Math.abs(rowOffset) === Math.abs(colOffset)) {
                    continue;
                }
                const newRow = row + rowOffset;
                const newCol = col + colOffset;
                if (board.isValidPosition(newRow, newCol)) {
                    const squarePiece = board.getPiece(newRow, newCol);
                    if (squarePiece) {
                        if (squarePiece.getColour() !== this.colour) {
                            moves.push(board.getSquare(newRow, newCol));
                        }
                    } else {
                        moves.push(board.getSquare(newRow, newCol));
                    }
                }
            }
        }
        return moves;
    }
}

export default Knight;
