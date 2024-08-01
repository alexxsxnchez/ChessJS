class Timer {
    #startTime;
    #moveTime;
    constructor() {
        this.stop = false;
        this.#moveTime = null;
        this.#startTime = null;
    }

    start(moveTime) {
        this.stop = false;
        this.#moveTime = moveTime;
        this.#startTime = new Date();
    }

    elapsed() {
        return new Date() - this.#startTime;
    }

    check() {
        if (this.elapsed() >= this.#moveTime) {
            this.stop = true;
            return true;
        }
        return false;
    }
}

export default Timer;
