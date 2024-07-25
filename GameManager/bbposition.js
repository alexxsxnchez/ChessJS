import { PieceColour, PieceType } from "./Immutable/Pieces/utils";
import Bitboard from "./bitboard.js";
import { Move, MoveType } from "./Immutable/bbMove.js";
import { sqIsAttacked } from "./bbmovegen.js";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

class Piece {
    constructor(type, colour) {
        this.type = type;
        this.colour = colour;
    }
}

// IrreversableState -> info that cannot be determined from undoing a move along
class IrreversableState {
    constructor({
        hash,
        whiteKingsideRights,
        whiteQueensideRights,
        blackKingsideRights,
        blackQueensideRights,
        capturedPiece,
        promotionType,
        enPassantSquare,
        rule50,
    }) {
        this.hash = hash;
        this.whiteKingsideRights = whiteKingsideRights;
        this.whiteQueensideRights = whiteQueensideRights;
        this.blackKingsideRights = blackKingsideRights;
        this.blackQueensideRights = blackQueensideRights;
        this.capturedPiece = capturedPiece;
        this.promotionType = promotionType;
        this.enPassantSquare = enPassantSquare;
        this.rule50 = rule50;
    }
}

class BBPosition {
    // pieces;
    // sides;
    // squares;
    // currentTurn;
    // enPassantSquare;
    // whiteKingsideRights;
    // whiteQueensideRights;
    // blackKingsideRights;
    // blackQueensideRights;
    // rule50;
    // ply;
    // hash;

    // states

    constructor(fen = STARTING_FEN) {
        this.pieces = new Array(2).fill(new Array(6).fill(new Bitboard()));
        this.sides = [new Bitboard(), new Bitboard()];
        this.squares = new Array(64).fill(null);
        this.prevStates = [];
        this.#createFromFEN(fen);
        // this.#hash =
    }

    #createFromFEN(fen) {
        // this.lastMove = null;

        const components = fen.split(" ");
        const pieces = components[0];
        for (let i, sq = 0; i <= pieces.length; i++, sq++) {
            const ch = pieces[i];
            switch (ch) {
                case "p":
                    this.#putPiece(PieceType.PAWN, PieceColour.BLACK, sq);
                    break;
                case "n":
                    this.#putPiece(PieceType.KNIGHT, PieceColour.BLACK, sq);
                    break;
                case "b":
                    this.#putPiece(PieceType.BISHOP, PieceColour.BLACK, sq);
                    break;
                case "r":
                    this.#putPiece(PieceType.ROOK, PieceColour.BLACK, sq);
                    break;
                case "q":
                    this.#putPiece(PieceType.QUEEN, PieceColour.BLACK, sq);
                    break;
                case "k":
                    this.#putPiece(PieceType.KING, PieceColour.BLACK, sq);
                    break;
                case "P":
                    this.#putPiece(PieceType.PAWN, PieceColour.WHITE, sq);
                    break;
                case "N":
                    this.#putPiece(PieceType.KNIGHT, PieceColour.WHITE, sq);
                    break;
                case "B":
                    this.#putPiece(PieceType.BISHOP, PieceColour.WHITE, sq);
                    break;
                case "R":
                    this.#putPiece(PieceType.ROOK, PieceColour.WHITE, sq);
                    break;
                case "Q":
                    this.#putPiece(PieceType.QUEEN, PieceColour.WHITE, sq);
                    break;
                case "K":
                    this.#putPiece(PieceType.KING, PieceColour.WHITE, sq);
                    break;
                case "/":
                    sq--;
                    break;
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                    sq += parseInt(ch);
                    //row += Math.floor((col + parseInt(ch)) / 8);
                    break;
            }
        }

        this.currentTurn = PieceColour.WHITE;
        if (components[1] === "b") {
            this.currentTurn = PieceColour.BLACK;
        }

        this.whiteKingsideRights = false;
        this.whiteQueensideRights = false;
        this.blackKingsideRights = false;
        this.blackQueensideRights = false;
        for (let ch of components[2]) {
            if (ch === "K") {
                this.whiteKingsideRights = true;
            } else if (ch === "Q") {
                this.whiteQueensideRights = true;
            } else if (ch === "k") {
                this.blackKingsideRights = true;
            } else if (ch === "q") {
                this.blackQueensideRights = true;
            }
        }

        if (components[3] === "-") {
            this.enPassantSquare = null;
        } else {
            const col = components[3].charCodeAt(0) - 97;
            const row = components[3][1] - 1;
            const sq = row * 8 + col;
            this.enPassantSquare = sq;
        }

        // half-move clock (reset every pawn move)
        this.rule50 = parseInt(components[4]);

        // full-move counter (doesn't reset)
        this.ply = parseInt(components[5]) * 2;
        if (this.currentTurn === PieceColour.BLACK) {
            this.ply--;
        }
    }

    generateFEN() {
        return "";
    }

    makeMove(move) {
        const fromSquare = move.fromSquare;
        const toSquare = move.toSquare;
        const moveType = move.type;
        const movedPiece = this.squares[fromSquare];

        this.prevStates.push(
            new IrreversableState({
                hash: this.hash,
                whiteKingsideRights: this.whiteKingsideRights,
                whiteQueensideRights: this.whiteQueensideRights,
                blackKingsideRights: this.blackKingsideRights,
                blackQueensideRights: this.blackQueensideRights,
                enPassantSquare: this.enPassantSquare,
                rule50: this.rule50,
                movedPiece: movedPiece,
                capturedPiece: this.squares[toSquare],
            })
        );

        this.ply++;
        this.rule50++;

        this.enPassantSquare = null;

        this.#clearPiece(fromSquare);

        switch (moveType) {
            case MoveType.QUIET:
                this.#putPiece(movedPiece.type, movedPiece.colour, toSquare);
                break;

            case MoveType.CAPTURE:
                this.#clearPiece(toSquare);
                this.#putPiece(movedPiece.type, movedPiece.colour, toSquare);
                this.rule50 = 0;
                break;

            case MoveType.CAPTURE_EP:
                const delta = movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                const capturedSquare = toSquare - delta;
                this.#clearPiece(capturedSquare);
                this.#putPiece(PieceType.PAWN, movedPiece.colour, toSquare);
                this.rule50 = 0;
                break;

            case MoveType.CASTLE:
                this.#putPiece(PieceType.KING, movedPiece.colour, toSquare);
                const [rookFromSquare, rookToSquare] =
                    this.#getCastleRookSquares(toSquare);
                this.#clearPiece(rookFromSquare);
                this.#putPiece(PieceType.ROOK, movedPiece.colour, rookToSquare);

            case MoveType.PROMOTION:
                this.#putPiece(move.promotionType, movedPiece.colour, toSquare);
                break;

            case MoveType.PROMOTION_CAPTURE:
                this.#clearPiece(toSquare);
                this.#putPiece(move.promotionType, movedPiece.colour, toSquare);
                break;
        }

        if (movedPiece.type === PieceType.PAWN) {
            this.rule50 = 0;

            // check for enpassant square
            if (Math.abs(fromSquare - toSquare) === 16) {
                // double push pawn
                const delta = movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                this.enPassantSquare = toSquare - delta;
            }
        }

        // update castling rights
        if (fromSquare === 4) {
            // move white king
            this.whiteKingsideRights = false;
            this.whiteQueensideRights = false;
        } else if (fromSquare === 60) {
            // move black king
            this.blackKingsideRights = false;
            this.blackQueensideRights = false;
        }
        if (fromSquare === 0 || toSquare === 0) {
            // white queenside rook
            this.whiteQueensideRights = false;
        } else if (fromSquare === 7 || toSquare === 7) {
            // white kingside rook
            this.whiteKingsideRights = false;
        } else if (fromSquare === 56 || toSquare === 56) {
            // black queenside rook
            this.blackQueensideRights = false;
        } else if (fromSquare === 63 || toSquare === 63) {
            // black kingside rook
            this.blackKingsideRights = false;
        }

        const kingSquare =
            this.pieces[this.currentTurn][
                PieceType.KING
            ].getLowestBitPosition();
        const opponent = PieceColour.getOpposite(this.currentTurn);
        const isValidMove = !sqIsAttacked(this, kingSquare, opponent);

        this.currentTurn = opponent;

        return isValidMove;

        // TODO: return whether move is valid
        return true;
    }

    // assumes past in move is the most recent move applied
    undoMove(move) {
        const state = this.prevStates.pop();
        this.hash = state.hash;
        this.whiteKingsideRights = state.whiteKingsideRights;
        this.whiteQueensideRights = state.whiteQueensideRights;
        this.blackKingsideRights = state.blackKingsideRights;
        this.blackQueensideRights = state.blackQueensideRights;
        this.enPassantSquare = state.enPassantSquare;
        this.rule50 = state.rule50;

        this.ply--;
        this.currentTurn = PieceColour.getOpposite(this.currentTurn);

        const fromSquare = move.fromSquare;
        const toSquare = move.toSquare;
        const moveType = move.type;

        this.#putPiece(
            state.movedPiece.type,
            state.movedPiece.colour,
            fromSquare
        );
        this.#clearPiece(toSquare);

        switch (moveType) {
            case MoveType.QUIET:
            case MoveType.PROMOTION:
                break;

            case MoveType.CAPTURE:
            case MoveType.PROMOTION_CAPTURE:
                this.#putPiece(
                    state.capturedPiece.type,
                    state.capturedPiece.colour,
                    toSquare
                );
                break;

            case MoveType.CAPTURE_EP:
                const delta =
                    state.movedPiece.colour === PieceColour.WHITE ? 8 : -8;
                const capturedSquare = toSquare - delta;
                this.#putPiece(
                    PieceType.PAWN,
                    state.capturedPiece.colour,
                    capturedSquare
                );
                break;

            case MoveType.CASTLE:
                const [rookFromSquare, rookToSquare] =
                    this.#getCastleRookSquares(toSquare);
                this.#clearPiece(rookToSquare);
                this.#putPiece(
                    PieceType.ROOK,
                    movedPiece.colour,
                    rookFromSquare
                );
                break;
        }
    }

    #putPiece(type, colour, sq) {
        this.pieces[colour][type].setBit(sq);
        this.sides[colour].setBit(sq);
        this.squares[sq] = new Piece(type, colour);
    }

    #clearPiece(sq) {
        const piece = this.squares[sq];
        this.pieces[piece.colour][piece.type].clearBit(sq);
        this.sides[piece.colour].clearBit(sq);
        this.squares[sq] = null;
    }

    #getCastleRookSquares(kingToSquare) {
        if (kingToSquare === 2) {
            return [0, 3]; // white queenside
        } else if (kingToSquare === 6) {
            return [7, 5]; // white kingside
        } else if (kingToSquare === 58) {
            return [56, 59]; // black queenside
        } else if (kingToSquare === 62) {
            return [63, 61]; // black kingside
        }
        throw new Error("invalid castling square");
    }
}

export default BBPosition;
