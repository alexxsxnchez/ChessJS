import { PieceColour } from "../GameManager/Pieces/utils.js";
import eventBus from "../Common/eventbus.js";

const BOARD_SIZE = 8;
const BORDER_WIDTH = 3;

class Chessboard {
    constructor(assetLoader, game) {
        this.assetLoader = assetLoader;
        this.game = game;
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        const boardContainer = document.getElementById("boardContainer");
        this.canvas.width = boardContainer.clientHeight;
        this.canvas.height = boardContainer.clientHeight;

        this.whiteInputEnabled = false;
        this.blackInputEnabled = false;

        this.selectedPieceSquare = null;
        this.dragging = false;
        this.initialMouseDownCoords = null;
        this.highlightSquares = null;

        this.#setupListeners();

        this.draw();
    }

    #setupListeners() {
        eventBus.on("state::updated", () => {
            this.selectedPieceSquare = null;
            this.dragging = false;
            this.highlightSquares = null;
            this.initialMouseDownCoords = null;
            this.draw();
        });

        // eventBus.on("state::highlightSquares", (highlightSquares) => {
        //     this.highlightSquares = highlightSquares;
        // });

        eventBus.on("game::humanMove", () => {
            console.log("human move");
            if (this.game.gameState.currentTurn === PieceColour.WHITE) {
                console.log("white move");
                this.whiteInputEnabled = true;
                this.blackInputEnabled = false;
            } else {
                console.log("black move");
                this.whiteInputEnabled = false;
                this.blackInputEnabled = true;
            }
        });

        eventBus.on("game::aiMove", () => {
            this.whiteInputEnabled = false;
            this.blackInputEnabled = false;
        });

        this.canvas.addEventListener("mousedown", (e) => {
            if (this.selectedPieceSquare) {
                // dropping piece that is already selected
                const endSquare = this.#getEventSquare(e);
                if (endSquare) {
                    this.game.makeMove(this.selectedPieceSquare, endSquare);
                }
                this.selectedPieceSquare = null;
                this.highlightSquares = null;
            } else {
                const pieceSquare = this.#getEventPieceSquare(e);
                if (pieceSquare) {
                    this.selectedPieceSquare = pieceSquare;
                    this.initialMouseDownCoords = [e.clientX, e.clientY];
                    this.highlightSquares = this.game.gameState
                        .getPiece(pieceSquare.row, pieceSquare.col)
                        .getLegalMoves(
                            this.game.gameState,
                            pieceSquare.row,
                            pieceSquare.col
                        );
                }
            }
            // (un)draw highlighted moves
            this.draw();
        });

        this.canvas.addEventListener("mouseup", (e) => {
            this.initialMouseDownCoords = null;
            // ignore if we never selected a piece or just clicking a piece
            if (!this.selectedPieceSquare || !this.dragging) {
                return;
            }
            const endSquare = this.#getEventSquare(e);
            if (endSquare) {
                this.game.makeMove(this.selectedPieceSquare, endSquare);
            }
            this.selectedPieceSquare = null;
            this.highlightSquares = null;
            this.dragging = false;
            this.draw();
        });

        this.canvas.addEventListener("mousemove", (e) => {
            // check if we are dragging a piece a significant amount
            const epsilonPixels = 3;
            if (
                this.initialMouseDownCoords &&
                (Math.abs(e.clientX - this.initialMouseDownCoords[0]) >
                    epsilonPixels ||
                    Math.abs(e.clientY - this.initialMouseDownCoords[1]) >
                        epsilonPixels)
            ) {
                this.dragging = true;
                this.draw(e);
            }
        });
    }

    #getEventSquare(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const squareSize = this.#getSquareSize();
        const row =
            BOARD_SIZE - 1 - Math.trunc((y - BORDER_WIDTH) / squareSize);
        const col = Math.trunc((x - BORDER_WIDTH) / squareSize);
        if (this.game.gameState.isValidPosition(row, col)) {
            return this.game.gameState.getSquare(row, col);
        }
        return null;
    }

    #getEventPieceSquare(event) {
        const square = this.#getEventSquare(event);
        if (!square) {
            return null;
        }
        const piece = square.getPiece();
        if (piece) {
            if (
                (piece.getColour() === PieceColour.WHITE &&
                    this.whiteInputEnabled) ||
                (piece.getColour() === PieceColour.BLACK &&
                    this.blackInputEnabled)
            ) {
                return square;
            }
        }
        return null;
    }

    #drawBoard() {
        // Draw outer border
        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const squareSize = this.#getSquareSize();
        // Draw chessboard
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if ((i + j) % 2 === 0) {
                    // white squares
                    this.ctx.fillStyle = "#F5DEB3";
                } else {
                    // black squares
                    this.ctx.fillStyle = "#A0522D";
                }
                this.ctx.fillRect(
                    BORDER_WIDTH + j * squareSize,
                    BORDER_WIDTH + i * squareSize,
                    squareSize,
                    squareSize
                );
            }
        }

        // Draw highlighted squares
        if (this.highlightSquares) {
            this.ctx.fillStyle = "rgba(255, 255, 0, 0.25)";
            for (let highlightSquare of this.highlightSquares) {
                this.ctx.fillRect(
                    BORDER_WIDTH + highlightSquare.col * squareSize,
                    BORDER_WIDTH +
                        (BOARD_SIZE - 1 - highlightSquare.row) * squareSize,
                    squareSize,
                    squareSize
                );
            }
        }

        // Draw files and ranks
        this.ctx.fillStyle = "black";
        this.ctx.font = `${squareSize * 0.15}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        for (let i = 0; i < BOARD_SIZE; i++) {
            const fileValue = String.fromCharCode(97 + i); // a is 97 in ASCII
            const fileX = BORDER_WIDTH + squareSize * (i + 0.9);
            const fileY = this.canvas.height - BORDER_WIDTH - squareSize * 0.1;
            this.ctx.fillText(fileValue, fileX, fileY);
            const rankValue = BOARD_SIZE - i;
            const rankX = BORDER_WIDTH + squareSize * 0.1;
            const rankY = BORDER_WIDTH + squareSize * (i + 0.1);
            this.ctx.fillText(rankValue, rankX, rankY);
        }
    }

    #drawPieces(event) {
        const squareSize = this.#getSquareSize();
        const sizeMultiplier = 0.93;
        const offset = (1 - sizeMultiplier) / 2;

        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const row = BOARD_SIZE - 1 - i;
                const piece = this.game.gameState.getPiece(row, j);
                if (piece) {
                    const pieceX = BORDER_WIDTH + (j + offset) * squareSize;
                    const pieceY = BORDER_WIDTH + (i + offset) * squareSize;

                    if (
                        event &&
                        this.selectedPieceSquare &&
                        this.selectedPieceSquare.getPiece() === piece &&
                        this.initialMouseDownCoords
                    ) {
                        const rect = canvas.getBoundingClientRect();
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;

                        const initialOffsetX =
                            this.initialMouseDownCoords[0] - pieceX;
                        const initialOffsetY =
                            this.initialMouseDownCoords[1] - pieceY;
                        this.ctx.drawImage(
                            this.assetLoader.pieces[piece],
                            x - initialOffsetX,
                            y - initialOffsetY,
                            squareSize * sizeMultiplier,
                            squareSize * sizeMultiplier
                        );
                    } else {
                        this.ctx.drawImage(
                            this.assetLoader.pieces[piece],
                            pieceX,
                            pieceY,
                            squareSize * sizeMultiplier,
                            squareSize * sizeMultiplier
                        );
                    }
                }
            }
        }
    }

    draw(event = null) {
        this.#drawBoard();
        this.#drawPieces(event);
    }

    #getSquareSize() {
        return (this.canvas.width - BORDER_WIDTH * 2) / BOARD_SIZE;
    }
}

export default Chessboard;
