import Piece from "./piece.js";
import { PieceType } from "./utils.js";

class King extends Piece {
    constructor(color) {
        super(PieceType.KING, color);
    }

    getLegalMoves(board, row, col) {
        const moves = [];
        for (const rowOffset of [-1, 0, 1]) {
            for (const colOffset of [-1, 0, 1]) {
                if (rowOffset === 0 && colOffset === 0) {
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

export default King;
