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

    toString() {
        return `${this.type}-${this.colour}`;
    }
}

export default Piece;
