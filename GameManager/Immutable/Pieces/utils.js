const PieceType = Object.freeze({
    PAWN: "pawn",
    ROOK: "rook",
    KNIGHT: "knight",
    BISHOP: "bishop",
    QUEEN: "queen",
    KING: "king",
});

const PieceColour = Object.freeze({
    WHITE: "white",
    BLACK: "black",

    getOpposite(colour) {
        return colour === PieceColour.WHITE
            ? PieceColour.BLACK
            : PieceColour.WHITE;
    },
});

export { PieceType, PieceColour };
