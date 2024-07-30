const MoveType = Object.freeze({
    QUIET: 0,
    CAPTURE: 1,
    CAPTURE_EP: 2,
    CASTLE: 3,
    PROMOTION: 4,
    PROMOTION_CAPTURE: 5,
});

// TODO: can encode moves in a 16 bit value
// even possible in JS? is there a 16bit int type?
class Move {
    constructor(fromSquare, toSquare, moveType, promotionType = null) {
        this.fromSquare = fromSquare;
        this.toSquare = toSquare;
        this.moveType = moveType;
        this.promotionType = promotionType;
    }

    equals(other) {
        return (
            this.fromSquare === other.fromSquare &&
            this.toSquare === other.toSquare &&
            this.moveType === other.moveType &&
            this.promotionType === other.promotionType
        );
    }

    // TODO
    encoded() {
        return 0;
    }

    // TODO
    static fromEncoded(encoded) {
        return new Move(0, 0, MoveType.QUIET);
    }
}

export { Move, MoveType };
