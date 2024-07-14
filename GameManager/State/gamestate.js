import { Position } from "./position.js";

class GameState {
    constructor() {
        const startingPosition = new Position();
        this.positions = [startingPosition];
    }

    getCurrentPosition() {
        return this.positions.at(-1);
    }

    makeMove(move) {
        const currentPosition = this.getCurrentPosition();
        if (currentPosition.isMoveLegal(move)) {
            const newPosition = new Position(currentPosition, move);
            this.positions.push(newPosition);
            return true;
        }
        return false;
    }

    undoMove() {
        // always leave the starting position
        if (this.positions >= 2) {
            this.positions.pop();
        }
    }

    checkGameStatus() {
        const currentPosition = this.getCurrentPosition();
        const canMove = currentPosition.doLegalMovesExist();
        const inCheck = currentPosition.isKingInCheck();
        if (canMove) {
            if (inCheck) {
                console.log("in check!");
            }
        } else {
            if (inCheck) {
                console.log("checkmate!");
            } else {
                console.log("stalemate!");
            }
        }
    }
}

export default GameState;
