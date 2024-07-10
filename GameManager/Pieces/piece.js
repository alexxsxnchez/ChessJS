import { PieceType, PieceColour } from "./utils.js";

class Piece {
    constructor(type, colour) {
        if (new.target === Piece) {
            throw new Error(
                "Cannot instantiate abstract class Piece directly."
            );
        }
        if (!Object.values(PieceType).includes(type)) {
            throw new Error(`Invalid piece type: ${type}`);
        }
        if (!Object.values(PieceColour).includes(colour)) {
            throw new Error(`Invalid piece colour: ${colour}`);
        }
        this.type = type;
        this.colour = colour;
    }

    getType() {
        return this.type;
    }

    getColour() {
        return this.colour;
    }

    // Abstract method
    getLegalMoves(board, row, col) {
        throw new Error("Method 'getLegalMoves()' must be implemented.");
    }

    // Used by BISHOP, ROOK, QUEEN
    findDistanceMoves(board, row, col, rowDir, colDir) {
        if (
            (rowDir === 0 && colDir === 0) ||
            Math.abs(rowDir) > 1 ||
            Math.abs(colDir) > 1
        ) {
            throw new Error("invalid direction values");
        }

        const moves = [];
        row += rowDir;
        col += colDir;
        while (board.isValidPosition(row, col)) {
            const squarePiece = board.getPiece(row, col);
            if (squarePiece) {
                if (squarePiece.getColour() !== this.colour) {
                    moves.push(board.getSquare(row, col));
                }
                break;
            }
            moves.push(board.getSquare(row, col));
            row += rowDir;
            col += colDir;
        }
        return moves;
    }

    toString() {
        return `${this.type}-${this.colour}`;
    }
}

export default Piece;
