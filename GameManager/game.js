import eventBus from "../Common/eventbus.js";
import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import { Move, MoveType } from "./Immutable/bbMove.js";
import Engine from "../Engine/engine.js";
import BBPosition from "./bbposition.js";
import { generateLegalForSquare } from "./bbmovegen.js";

const GameType = Object.freeze({
    HUMAN_VS_HUMAN: "human_vs_human",
    HUMAN_VS_AI: "human_vs_ai",
    AI_VS_HUMAN: "ai_vs_human",
    AI_VS_AI: "ai_vs_ai",
});

class Game {
    constructor() {
        this.position = null;
        this.history = [];
        this.currentLegalMoves = [];
    }

    start(gameType = GameType.HUMAN_VS_HUMAN) {
        if (this.engine) {
            this.engine.terminate();
        }
        if (
            gameType === GameType.HUMAN_VS_AI ||
            gameType === GameType.AI_VS_HUMAN ||
            gameType === GameType.AI_VS_AI
        ) {
            this.engine = new Engine(this);
        }

        this.gameType = gameType;
        this.position = new BBPosition();
        this.moveHistory = [];
        this.currentLegalMoves = generateLegalForSquare(this.position);

        eventBus.emit("state::updated");
        eventBus.emit("game::start");

        this.#emitNextPlayerMove();
    }

    getLegalSquares(fromSquare) {
        const legalMoves = this.currentLegalMoves.get(fromSquare);
        if (legalMoves) {
            return legalMoves.map((move) => move.toSquare);
        }
        return [];
    }

    getLastMove() {
        return this.history.at(-1) || null;
    }

    getCurrentPosition() {
        return this.position;
    }

    makeMove(fromSquare, toSquare, promotionType = null) {
        const move = this.#createMove(fromSquare, toSquare, promotionType);
        const availableMoves = this.currentLegalMoves.get(fromSquare);
        let moveIsValid = false;
        if (availableMoves) {
            moveIsValid = availableMoves.some((availableMove) => {
                return availableMove.equals(move);
            });
        }

        if (moveIsValid) {
            const moveIsValidDoubleCheck = this.position.makeMove(move);
            if (!moveIsValidDoubleCheck) {
                throw new Error("move invalid!");
            }

            this.moveHistory.push(move);

            this.currentLegalMoves = generateLegalForSquare(this.position);

            console.log(this.position.generateFEN());

            eventBus.emit("state::updated");

            const canMove = this.currentLegalMoves.size > 0;
            const inCheck = this.position.isKingInCheck();
            if (canMove) {
                if (inCheck) {
                    eventBus.emit("game::move::check");
                } else if (move.moveType === MoveType.CASTLE) {
                    eventBus.emit("game::move::castle");
                } else if (
                    move.moveType === MoveType.PROMOTION ||
                    move.moveType === MoveType.PROMOTION_CAPTURE
                ) {
                    eventBus.emit("game::move::promotion");
                } else if (
                    move.moveType === MoveType.CAPTURE ||
                    move.moveType === MoveType.CAPTURE_EP
                ) {
                    eventBus.emit("game::move::capture");
                } else {
                    eventBus.emit("game::move::self");
                }
                this.#emitNextPlayerMove();
            } else {
                eventBus.emit("game::end");
                if (inCheck) {
                    eventBus.emit(
                        "game::checkmate",
                        PieceColour.getOpposite(this.position.currentTurn)
                    );
                } else {
                    eventBus.emit("game::stalemate");
                }
            }
        } else {
            eventBus.emit("game::move::illegal");
        }
    }

    undoMove() {
        if (this.moveHistory.length > 0) {
            const originalTurn = this.position.currentTurn;
            let move = this.moveHistory.pop();
            this.position.undoMove(move);

            if (
                this.gameType === GameType.HUMAN_VS_AI ||
                this.gameType === GameType.AI_VS_HUMAN
            ) {
                this.engine.cancel();

                if (
                    this.moveHistory.length > 0 &&
                    ((this.gameType === GameType.HUMAN_VS_AI &&
                        originalTurn === PieceColour.WHITE) ||
                        (this.gameType === GameType.AI_VS_HUMAN &&
                            originalTurn === PieceColour.BLACK))
                ) {
                    move = this.moveHistory.pop();
                    this.position.undoMove(move);
                }
            }

            this.currentLegalMoves = generateLegalForSquare(this.position);

            eventBus.emit("state::updated");
            this.#emitNextPlayerMove();
        }
    }

    #createMove(fromSquare, toSquare, promotionType = null) {
        const piece = this.position.squares[fromSquare];
        const isCapture = this.position.squares[toSquare] !== null;

        if (promotionType) {
            const moveType = isCapture
                ? MoveType.PROMOTION_CAPTURE
                : MoveType.PROMOTION;
            return new Move(fromSquare, toSquare, moveType, promotionType);
        }

        if (
            piece.type === PieceType.KING &&
            Math.abs(fromSquare - toSquare) === 2
        ) {
            return new Move(fromSquare, toSquare, MoveType.CASTLE);
        }

        if (
            piece.type === PieceType.PAWN &&
            toSquare === this.position.enPassantSquare
        ) {
            return new Move(fromSquare, toSquare, MoveType.CAPTURE_EP);
        }
        const moveType = isCapture ? MoveType.CAPTURE : MoveType.QUIET;
        return new Move(fromSquare, toSquare, moveType);
    }

    #emitNextPlayerMove() {
        const currentTurn = this.position.currentTurn;
        switch (this.gameType) {
            case GameType.HUMAN_VS_HUMAN:
                eventBus.emit("game::humanMove", currentTurn);
                break;
            case GameType.AI_VS_AI:
                eventBus.emit("game::aiMove", this.position);
                break;
            case GameType.HUMAN_VS_AI:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::humanMove", currentTurn);
                } else {
                    eventBus.emit("game::aiMove", this.position);
                }
                break;
            case GameType.AI_VS_HUMAN:
                if (currentTurn === PieceColour.WHITE) {
                    eventBus.emit("game::aiMove", this.position);
                } else {
                    eventBus.emit("game::humanMove", currentTurn);
                }
                break;
        }
    }
}

export { Game, GameType };
