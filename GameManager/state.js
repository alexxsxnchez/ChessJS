import eventBus from "../Common/eventbus.js";
import Square from "./square.js";

const BOARD_SIZE = 8;
const INITIAL_PIECES = [
    [
        "rook-black",
        "knight-black",
        "bishop-black",
        "queen-black",
        "king-black",
        "bishop-black",
        "knight-black",
        "rook-black",
    ],
    Array(BOARD_SIZE).fill("pawn-black"),
    ...Array(4).fill(Array(BOARD_SIZE).fill(null)),
    Array(BOARD_SIZE).fill("pawn-white"),
    [
        "rook-white",
        "knight-white",
        "bishop-white",
        "queen-white",
        "king-white",
        "bishop-white",
        "knight-white",
        "rook-white",
    ],
];

class InvalidGameStateError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "InvalidGameStateError";
    }
}

class GameState {
    constructor() {
        this.board = this.#initializeBoard();
        eventBus.emit("state::initialized", this);
    }

    #initializeBoard() {
        const board = new Array(BOARD_SIZE);
        for (let row = 0; row < BOARD_SIZE; row++) {
            board[row] = new Array(BOARD_SIZE);
            for (let col = 0; col < BOARD_SIZE; col++) {
                board[row][col] = new Square(
                    row,
                    col,
                    INITIAL_PIECES[row][col]
                );
            }
        }
        return board;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    getSquare(row, col) {
        if (this.isValidPosition(row, col)) {
            return this.board[row][col];
        }
        throw new InvalidGameStateError("invalid square");
    }

    setPiece(row, col, piece) {
        if (this.isValidPosition(row, col)) {
            this.board[row][col].setPiece(piece);
        } else {
            throw new InvalidGameStateError("invalid square");
        }
    }

    removePiece(row, col) {
        if (this.isValidPosition(row, col)) {
            this.board[row][col].removePiece();
        } else {
            throw new InvalidGameStateError("invalid square");
        }
    }

    getPiece(row, col) {
        if (this.isValidPosition(row, col)) {
            return this.board[row][col].getPiece();
        }
        throw new InvalidGameStateError("invalid square");
    }
}

export { GameState, InvalidGameStateError };
