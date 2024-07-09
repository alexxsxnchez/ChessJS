import AssetLoader from "./assetLoader.js";

const BOARD_SIZE = 8;
const BORDER_WIDTH = 3;

class Canvas {
    constructor() {
        this.assetLoader = new AssetLoader();
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        const boardContainer = document.getElementById("boardContainer");
        this.canvas.width = boardContainer.clientHeight;
        this.canvas.height = boardContainer.clientHeight;
    }

    #drawChessboard(squareSize) {
        // Draw outer border
        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw chessboard
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillStyle = "#F5DEB3";
                } else {
                    this.ctx.fillStyle = "#A0522D";
                }
                this.ctx.fillRect(
                    BORDER_WIDTH + i * squareSize,
                    BORDER_WIDTH + j * squareSize,
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

    #drawPieces(squareSize, gameState) {
        const sizeMultiplier = 0.93;
        const offset = (1 - sizeMultiplier) / 2;

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = gameState.getPiece(row, col);
                if (piece) {
                    this.ctx.drawImage(
                        this.assetLoader.pieces[piece],
                        BORDER_WIDTH + (col + offset) * squareSize,
                        BORDER_WIDTH + (row + offset) * squareSize,
                        squareSize * sizeMultiplier,
                        squareSize * sizeMultiplier
                    );
                }
            }
        }
    }

    draw(gameState) {
        const squareSize = (this.canvas.width - BORDER_WIDTH * 2) / BOARD_SIZE;
        this.#drawChessboard(squareSize);
        this.#drawPieces(squareSize, gameState);
    }
}

export default Canvas;
