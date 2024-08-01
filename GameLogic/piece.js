const PieceType = Object.freeze({
    PAWN: 0,
    ROOK: 1,
    KNIGHT: 2,
    BISHOP: 3,
    QUEEN: 4,
    KING: 5,
});

const PieceColour = Object.freeze({
    WHITE: 0,
    BLACK: 1,

    getOpposite(colour) {
        return colour === PieceColour.WHITE
            ? PieceColour.BLACK
            : PieceColour.WHITE;
    },
});

export { PieceType, PieceColour };
