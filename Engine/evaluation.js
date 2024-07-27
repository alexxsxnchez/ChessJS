import {
    PieceColour,
    PieceType,
} from "../GameManager/Immutable/Pieces/utils.js";

const PAWN_VALUE = 100;
const KNIGHT_VALUE = 320;
const BISHOP_VALUE = 330;
const ROOK_VALUE = 500;
const QUEEN_VALUE = 900;
const KING_VALUE = 20000;

const PIECE_SQUARE_TABLES_PAWN = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -15, -5, 5],
    [5, 10, 10, -20, -20, 15, 10, 5], // more emphasis for f file pawn stay put
    [0, 0, 0, 0, 0, 0, 0, 0],
];

const PIECE_SQUARE_TABLES_KNIGHT = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
];

const PIECE_SQUARE_TABLES_BISHOP = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
];

const PIECE_SQUARE_TABLES_ROOK = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
];

const PIECE_SQUARE_TABLES_QUEEN = [
    [-10, -5, -5, 0, 0, -5, -5, -10],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, 0],
    [0, 0, 5, 5, 5, 5, 0, 0],
    [-5, 5, 5, 5, 5, 5, 0, -5],
    [-5, 0, 5, 0, 0, 0, 0, -5],
    [-10, -5, -5, 0, 0, -5, -5, -10],
];

// Two piece square tables for king, interpolate between them based on game phase
const PIECE_SQUARE_TABLES_KING_EARLY = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, -10, -10, -10, -10, 20, 20],
    [20, 30, 20, -10, 0, 10, 30, 20],
];

const PIECE_SQUARE_TABLES_KING_LATE = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30], //6, 5
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
];

function evaluate(position) {
    const currentTurn = position.currentTurn;
    let materialScore = 0;
    let pieceTableScore = 0;
    let kingPieceTableScoreEarly = 0;
    let kingPieceTableScoreLate = 0;
    let phaseValue = 0;

    const allBB = position.sides[PieceColour.WHITE]
        .copy()
        .or(position.sides[PieceColour.BLACK]);

    while (!allBB.isEmpty()) {
        const pieceSquare = allBB.getLowestBitPosition();
        allBB.popLowestBit();
        const piece = position.getPiece(pieceSquare);

        const who2move = piece.colour === currentTurn ? 1 : -1;
        const row = Math.floor(pieceSquare / 8);
        const col = pieceSquare % 8;

        const adjustedRow = piece.colour === PieceColour.WHITE ? 7 - row : row;

        switch (piece.type) {
            case PieceType.PAWN:
                materialScore += PAWN_VALUE * who2move;
                pieceTableScore +=
                    PIECE_SQUARE_TABLES_PAWN[adjustedRow][col] * who2move;
                break;
            case PieceType.KNIGHT:
                materialScore += KNIGHT_VALUE * who2move;
                pieceTableScore +=
                    PIECE_SQUARE_TABLES_KNIGHT[adjustedRow][col] * who2move;
                phaseValue += 1;
                break;
            case PieceType.BISHOP:
                materialScore += BISHOP_VALUE * who2move;
                pieceTableScore +=
                    PIECE_SQUARE_TABLES_BISHOP[adjustedRow][col] * who2move;
                phaseValue += 1;
                break;
            case PieceType.ROOK:
                materialScore += ROOK_VALUE * who2move;
                pieceTableScore +=
                    PIECE_SQUARE_TABLES_ROOK[adjustedRow][col] * who2move;
                phaseValue += 2;
                break;
            case PieceType.QUEEN:
                materialScore += QUEEN_VALUE * who2move;
                pieceTableScore +=
                    PIECE_SQUARE_TABLES_QUEEN[adjustedRow][col] * who2move;
                phaseValue += 4;
                break;
            case PieceType.KING:
                materialScore += KING_VALUE * who2move;
                kingPieceTableScoreEarly +=
                    PIECE_SQUARE_TABLES_KING_EARLY[adjustedRow][col] * who2move;
                kingPieceTableScoreLate +=
                    PIECE_SQUARE_TABLES_KING_LATE[adjustedRow][col] * who2move;
                break;
        }
    }
    const earlyPhase = phaseValue / 24.0;
    pieceTableScore += kingPieceTableScoreEarly * earlyPhase;
    pieceTableScore += kingPieceTableScoreLate * (1.0 - earlyPhase);

    return materialScore + pieceTableScore;
}

export default evaluate;
