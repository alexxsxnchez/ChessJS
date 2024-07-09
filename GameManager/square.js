class Square {
    constructor(row, col, piece = null) {
        this.row = row;
        this.col = col;
        this.piece = piece;
    }

    setPiece(piece) {
        this.piece = piece;
    }

    removePiece() {
        this.piece = null;
    }

    getPiece() {
        return this.piece;
    }
}

export default Square;
