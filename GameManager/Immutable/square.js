class Square {
    constructor(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) {
            throw new RangeError("bad square row or col");
        }
        this.row = row;
        this.col = col;
    }

    toString() {
        return `${this.row}${this.col}`;
    }

    equals(other) {
        return this.row === other?.row && this.col === other?.col;
    }

    static fromString(_string) {
        return new this(
            parseInt(_string.charAt(0)),
            parseInt(_string.charAt(1))
        );
    }
}

export default Square;
