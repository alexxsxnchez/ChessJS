import eventBus from "../Common/eventbus.js";
import Square from "./square.js";
import { PieceType, PieceColour } from "./Pieces/utils.js";
import Bishop from "./Pieces/bishop.js";
import King from "./Pieces/king.js";
import Knight from "./Pieces/knight.js";
import Pawn from "./Pieces/pawn.js";
import Queen from "./Pieces/queen.js";
import Rook from "./Pieces/rook.js";

const BOARD_SIZE = 8;
const INITIAL_PIECES = [
    [
        [PieceType.ROOK, PieceColour.WHITE],
        [PieceType.KNIGHT, PieceColour.WHITE],
        [PieceType.BISHOP, PieceColour.WHITE],
        [PieceType.QUEEN, PieceColour.WHITE],
        [PieceType.KING, PieceColour.WHITE],
        [PieceType.BISHOP, PieceColour.WHITE],
        [PieceType.KNIGHT, PieceColour.WHITE],
        [PieceType.ROOK, PieceColour.WHITE],
    ],
    Array(BOARD_SIZE).fill([PieceType.PAWN, PieceColour.WHITE]),
    ...Array(4).fill(Array(BOARD_SIZE).fill(null)),
    Array(BOARD_SIZE).fill([PieceType.PAWN, PieceColour.BLACK]),
    [
        [PieceType.ROOK, PieceColour.BLACK],
        [PieceType.KNIGHT, PieceColour.BLACK],
        [PieceType.BISHOP, PieceColour.BLACK],
        [PieceType.QUEEN, PieceColour.BLACK],
        [PieceType.KING, PieceColour.BLACK],
        [PieceType.BISHOP, PieceColour.BLACK],
        [PieceType.KNIGHT, PieceColour.BLACK],
        [PieceType.ROOK, PieceColour.BLACK],
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

    #createPiece(type, colour) {
        switch (type) {
            case PieceType.BISHOP:
                return new Bishop(colour);
            case PieceType.KING:
                return new King(colour);
            case PieceType.KNIGHT:
                return new Knight(colour);
            case PieceType.PAWN:
                return new Pawn(colour);
            case PieceType.QUEEN:
                return new Queen(colour);
            case PieceType.ROOK:
                return new Rook(colour);
        }
        throw new Error("invalid type");
    }

    #initializeBoard() {
        const board = new Array(BOARD_SIZE);
        for (let row = 0; row < BOARD_SIZE; row++) {
            board[row] = new Array(BOARD_SIZE);
            for (let col = 0; col < BOARD_SIZE; col++) {
                const pieceConfig = INITIAL_PIECES[row][col];
                let piece = null;
                if (pieceConfig) {
                    piece = this.#createPiece(...pieceConfig);
                }
                board[row][col] = new Square(row, col, piece);
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
