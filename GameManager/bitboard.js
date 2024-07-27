/*
 * Bitwise Operations:
 * & and
 * | or
 * ^ xor
 * ~ not
 * << left shift
 * >> right shift (signed) -> not really used with bitboards
 * >>> right shift (unsigned)
 * The resulting binary number is the same with >> and >>>, but just changes whether or not JS treats the value as signed or not.
 * With bitboards we only want unsigned so you'll see a lot of ">>> 0" (zero change to the actual binary value, but JS will treat as unsigned value if MSB is a 1).
 */
class Bitboard {
    constructor(lo = 0, hi = 0) {
        this.lo = lo >>> 0;
        this.hi = hi >>> 0;
    }

    string() {
        const bitstring = `${this.hi.toString(2).padStart(32, "0")}${this.lo
            .toString(2)
            .padStart(32, "0")}`;
        let formatted = bitstring + "\n";
        formatted += "+  -  -  -  -  -  -  -  -  +\n";
        for (let i = 0, j = 7; i < 64; i++, j--) {
            // formatted += bitstring[j];
            if (j % 8 === 7) {
                formatted += " |  ";
            }
            if (bitstring[j] === "1") {
                formatted += "1  ";
            } else if (bitstring[j] === "0") {
                formatted += "*  ";
            }
            if (j % 8 === 0) {
                j += 16;
                formatted += "|\n";
            }
        }
        formatted += "+  -  -  -  -  -  -  -  -  +";
        return formatted;
    }

    copy() {
        return new Bitboard(this.lo, this.hi);
    }

    setBit(index) {
        index >>>= 0;
        if (index < 32) {
            this.lo = (this.lo | (1 << index)) >>> 0;
        } else {
            this.hi = (this.hi | (1 << (index - 32))) >>> 0;
        }
        return this;
    }

    clearBit(index) {
        index >>>= 0;
        if (index < 32) {
            this.lo = (this.lo & ~(1 << index)) >>> 0;
        } else {
            this.hi = (this.hi & ~(1 << (index - 32))) >>> 0;
        }
        return this;
    }

    shiftL(places) {
        if (places > 63 || places < -63) {
            this.lo = 0 >>> 0;
            this.hi = 0 >>> 0;
        } else if (places > 0) {
            this.#shL(places);
        } else if (places < 0) {
            this.#shR(-places);
        }
        return this;
    }

    shiftR(places) {
        if (places > 63 || places < -63) {
            this.lo = 0 >>> 0;
            this.hi = 0 >>> 0;
        } else if (places > 0) {
            this.#shR(places);
        } else if (places < 0) {
            this.#shL(-places);
        }
        return this;
    }

    #shL(places) {
        places >>>= 0;
        if (places < 32) {
            this.hi = ((this.hi << places) | (this.lo >>> (32 - places))) >>> 0;
            this.lo = (this.lo << places) >>> 0;
        } else {
            this.hi = (this.lo << (places - 32)) >>> 0;
            this.lo = 0 >>> 0;
        }
        return this;
    }

    #shR(places) {
        places >>>= 0;
        if (places < 32) {
            this.lo = ((this.lo >>> places) | (this.hi << (32 - places))) >>> 0;
            this.hi >>>= places;
        } else {
            this.lo = this.hi >>> (places - 32);
            this.hi = 0 >>> 0;
        }
        return this;
    }

    not() {
        this.lo = ~this.lo >>> 0;
        this.hi = ~this.hi >>> 0;
        return this;
    }

    or(other) {
        this.lo = (this.lo | other.lo) >>> 0;
        this.hi = (this.hi | other.hi) >>> 0;
        return this;
    }

    and(other) {
        this.lo = (this.lo & other.lo) >>> 0;
        this.hi = (this.hi & other.hi) >>> 0;
        return this;
    }

    andNot(other) {
        this.lo = (this.lo & ~other.lo) >>> 0;
        this.hi = (this.hi & ~other.hi) >>> 0;
        return this;
    }

    isEmpty() {
        return !this.lo && !this.hi;
    }

    isSet(index) {
        index >>>= 0;
        if (index < 32) {
            return this.lo & (1 << index);
        }
        return this.hi & (1 << (index - 32));
    }

    isClear(index) {
        return !this.isSet(index);
    }

    isEqual(other) {
        return this.lo === other.lo && this.hi === other.hi;
    }

    getLowestBitPosition() {
        if (this.isEmpty()) {
            return null;
        }
        if (this.lo) {
            return Bitboard.#getLowestBitPosition32(this.lo);
        }
        return Bitboard.#getLowestBitPosition32(this.hi) + 32;
    }

    static #getLowestBitPosition32(v) {
        v >>>= 0;
        return Bitboard.#countBitsSet32((v & -v) - 1);
    }

    popLowestBit() {
        if (!this.isEmpty()) {
            if (this.lo) {
                this.lo = Bitboard.#popLowestBit32(this.lo);
            } else {
                this.hi = Bitboard.#popLowestBit32(this.hi);
            }
        }
        return this;
    }

    static #popLowestBit32(v) {
        v >>>= 0;
        return (v & (v - 1)) >>> 0;
    }

    countBitsSet() {
        return (
            Bitboard.#countBitsSet32(this.lo) +
            Bitboard.#countBitsSet32(this.hi)
        );
    }

    // see https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
    static #countBitsSet32(v) {
        v >>>= 0;
        v -= (v >>> 1) & 0x55555555;
        v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
        return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
    }
}

export default Bitboard;
