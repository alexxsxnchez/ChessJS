import { PieceType, PieceColour } from "./utils.js";
import { Move } from "../move.js";
import Square from "../square.js";

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

    equals(other) {
        return this.type === other.type && this.colour === other.colour;
    }

    getAvailableMoves(pieceSquare, position) {
        throw new Error("Method 'getAvailableMoves()' must be implemented.");
    }

    getAttackingMoves(pieceSquare, position) {
        throw new Error("Method 'getAttackingMoves()' must be implemented.");
    }

    // Used by BISHOP, ROOK, QUEEN
    findDistanceMoves(pieceSquare, position, rowDir, colDir) {
        if (
            (rowDir === 0 && colDir === 0) ||
            Math.abs(rowDir) > 1 ||
            Math.abs(colDir) > 1
        ) {
            throw new Error("invalid direction values");
        }

        const moves = [];
        let row = pieceSquare.row + rowDir;
        let col = pieceSquare.col + colDir;
        while (row >= 0 && row < 8 && col >= 0 && col < 8) {
            const toSquare = new Square(row, col);
            const otherPiece = position.getPiece(toSquare);
            if (otherPiece) {
                if (otherPiece.colour !== this.colour) {
                    moves.push(new Move(pieceSquare, toSquare, this));
                }
                break;
            }
            moves.push(new Move(pieceSquare, toSquare, this));
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
