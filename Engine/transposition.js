const TTFlag = Object.freeze({
    EXACT: 0,
    ALPHA: 1,
    BETA: 2,
});

class TranspositionEntry {
    constructor(loHash, hiHash, value, move, depth, flag) {
        this.loHash = loHash;
        this.hiHash = hiHash;
        this.value = value;
        this.move = move;
        this.depth = depth;
        this.flag = flag;
    }
}

class PVEntry {
    constructor(loHash, hiHash, moves, ply) {
        this.loHash = loHash;
        this.hiHash = hiHash;
        this.moves = moves;
        this.ply = ply;
    }
}

class TranspositionTable {
    ENABLED = false;

    constructor(maxSize = 1e6) {
        this.sqrtSize = Math.floor(Math.sqrt(maxSize));
        this.table = new Array(this.sqrtSize);
        this.maxSize = maxSize;
        this.currentSize = 0;
    }

    //store(loHash, hiHash, value, move, depth, flag) {
    store(entry) {
        if (!this.ENABLED) {
            return;
        }
        const loIndex = entry.loHash % this.table.length;
        if (this.table[loIndex] === undefined) {
            this.table[loIndex] = new Array(this.sqrtSize);
        }
        const hiIndex = entry.hiHash % this.table[loIndex].length;
        const oldEntry = this.table[loIndex][hiIndex];
        if (
            oldEntry === undefined ||
            (oldEntry.depth && entry.depth && oldEntry.depth <= entry.depth) ||
            (oldEntry.ply && entry.ply && oldEntry.ply <= entry.ply)
        ) {
            this.table[loIndex][hiIndex] = entry;
        }
    }

    get(loHash, hiHash) {
        if (!this.ENABLED) {
            return null;
        }
        const loIndex = loHash % this.table.length;
        if (this.table[loIndex] !== undefined) {
            const hiIndex = hiHash % this.table[loIndex].length;
            const entry = this.table[loIndex][hiIndex];
            if (
                entry !== undefined &&
                loHash === entry.loHash &&
                hiHash === entry.hiHash
            ) {
                return entry;
            }
        }
        return null;
    }
}

export { TranspositionTable, TranspositionEntry, PVEntry, TTFlag };
