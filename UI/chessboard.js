import { PieceColour, PieceType } from "../GameLogic/piece.js";
import eventBus from "../Common/eventbus.js";
import { MoveType } from "../GameLogic/move.js";

const BOARD_SIZE = 8;
const BORDER_WIDTH = 3;

class Chessboard {
    constructor(assetLoader, game) {
        this.assetLoader = assetLoader;
        this.game = game;

        this.canvas = document.getElementById("canvas");
        const boardContainerHeight =
            document.getElementById("boardContainer").clientHeight;
        this.canvas.width = boardContainerHeight;
        this.canvas.height = boardContainerHeight;
        this.ctx = this.canvas.getContext("2d");

        this.whiteInputEnabled = false;
        this.blackInputEnabled = false;

        this.selectedPieceSquare = null;
        this.isDragging = false;
        this.highlightSquares = null;
        this.promotionSquare = null;
        this.showHighlight = true;

        this.#setupListeners();
    }

    #setupListeners() {
        eventBus.on("state::updated", () => {
            this.draw();
        });

        eventBus.on("game::unsuccessfulMove", () => {
            console.log("move was unsuccessful");
        });

        eventBus.on("game::humanMove", (currentTurn) => {
            if (currentTurn === PieceColour.WHITE) {
                console.log("human - white move");
                this.whiteInputEnabled = true;
                this.blackInputEnabled = false;
            } else {
                console.log("human - black move");
                this.whiteInputEnabled = false;
                this.blackInputEnabled = true;
            }
        });

        eventBus.on("game::aiMove", () => {
            this.whiteInputEnabled = false;
            this.blackInputEnabled = false;
        });

        eventBus.on("game::checkmate", (winColour) => {
            console.log("checkmate");
            console.log(`${winColour} won`);
            this.whiteInputEnabled = false;
            this.blackInputEnabled = false;
        });

        eventBus.on("game::draw", (reason) => {
            console.log(reason);
            this.whiteInputEnabled = false;
            this.blackInputEnabled = false;
        });

        eventBus.on("sidepanel::highlightChecked", (showHighlight) => {
            this.showHighlight = showHighlight;
            this.draw();
        });

        this.canvas.addEventListener("mousedown", (e) => {
            if (this.promotionSquare !== null) {
                this.#handlePromotionClick(e);
                return;
            }
            const pieceSquare = this.#getEventPieceSquare(e);
            if (pieceSquare !== null) {
                this.selectedPieceSquare = pieceSquare;
                this.isDragging = true;

                this.highlightSquares = this.game.getLegalSquares(pieceSquare);
                this.draw(e);
            }
        });

        this.canvas.addEventListener("mouseup", (e) => {
            this.isDragging = false;
            if (this.selectedPieceSquare === null) {
                return;
            }
            const toSquare = this.#getEventSquare(e);
            if (toSquare !== this.selectedPieceSquare) {
                if (this.#isPromotionSquare(toSquare)) {
                    this.promotionSquare = toSquare;
                    this.draw();
                    return;
                }
                this.game.makeMove(this.selectedPieceSquare, toSquare);
                this.selectedPieceSquare = null;
                this.highlightSquares = null;
            }
            this.draw();
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (this.isDragging) {
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
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            return row * 8 + col;
        }
        return null;
    }

    #getEventPieceSquare(event) {
        const square = this.#getEventSquare(event);
        if (square === null) {
            return null;
        }
        const piece = this.game.getCurrentPosition().getPiece(square);
        if (piece) {
            if (
                (piece.colour === PieceColour.WHITE &&
                    this.whiteInputEnabled) ||
                (piece.colour === PieceColour.BLACK && this.blackInputEnabled)
            ) {
                return square;
            }
        }
        return null;
    }

    #isPromotionSquare(toSquare) {
        const currentPosition = this.game.getCurrentPosition();
        const piece = currentPosition.getPiece(this.selectedPieceSquare);
        if (
            piece.type === PieceType.PAWN &&
            ((toSquare >= 0 && toSquare < 8) ||
                (toSquare >= 56 && toSquare < 64))
        ) {
            const legalMoves = this.game.currentLegalMoves.get(
                this.selectedPieceSquare
            );
            if (legalMoves) {
                return legalMoves.some(
                    (move) =>
                        move.moveType === MoveType.PROMOTION ||
                        move.moveType === MoveType.PROMOTION_CAPTURE
                );
            }
            return false;
        }
    }

    #getSquareSize() {
        return (this.canvas.width - BORDER_WIDTH * 2) / BOARD_SIZE;
    }

    #handlePromotionClick(e) {
        const square = this.#getEventSquare(e);
        let promotionType = null;

        const promotionSquareCol = this.promotionSquare % 8;
        const col = square % 8;
        const row = Math.floor(square / 8);

        if (col === promotionSquareCol) {
            if (this.whiteInputEnabled) {
                switch (row) {
                    case 7:
                        promotionType = PieceType.QUEEN;
                        break;
                    case 6:
                        promotionType = PieceType.KNIGHT;
                        break;
                    case 5:
                        promotionType = PieceType.ROOK;
                        break;
                    case 4:
                        promotionType = PieceType.BISHOP;
                        break;
                }
            } else {
                switch (row) {
                    case 0:
                        promotionType = PieceType.QUEEN;
                        break;
                    case 1:
                        promotionType = PieceType.KNIGHT;
                        break;
                    case 2:
                        promotionType = PieceType.ROOK;
                        break;
                    case 3:
                        promotionType = PieceType.BISHOP;
                        break;
                }
            }
        }
        if (promotionType) {
            this.game.makeMove(
                this.selectedPieceSquare,
                this.promotionSquare,
                promotionType
            );
        }
        this.promotionSquare = null;
        this.selectedPieceSquare = null;
        this.highlightSquares = null;
        this.draw();
    }

    // === DRAWING ===

    #drawBoard() {
        this.ctx.save();
        // draw outer border
        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const squareSize = this.#getSquareSize();
        // draw squares
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

        // draw selected piece square
        if (this.selectedPieceSquare) {
            const selectedRow = Math.floor(this.selectedPieceSquare / 8);
            const selectedCol = this.selectedPieceSquare % 8;

            this.ctx.fillStyle = "rgba(230, 230, 250, 0.7)";
            this.ctx.fillRect(
                BORDER_WIDTH + selectedCol * squareSize,
                BORDER_WIDTH + (BOARD_SIZE - 1 - selectedRow) * squareSize,
                squareSize,
                squareSize
            );
        }

        // draw last move
        const lastMove = this.game.getLastMove();
        if (lastMove) {
            const fromRow = Math.floor(lastMove.fromSquare / 8);
            const fromCol = lastMove.fromSquare % 8;
            const toRow = Math.floor(lastMove.toSquare / 8);
            const toCol = lastMove.toSquare % 8;
            this.ctx.fillStyle = "rgba(245, 204, 42, 0.5)";
            this.ctx.fillRect(
                BORDER_WIDTH + fromCol * squareSize,
                BORDER_WIDTH + (BOARD_SIZE - 1 - fromRow) * squareSize,
                squareSize,
                squareSize
            );
            this.ctx.fillRect(
                BORDER_WIDTH + toCol * squareSize,
                BORDER_WIDTH + (BOARD_SIZE - 1 - toRow) * squareSize,
                squareSize,
                squareSize
            );
            this.ctx.strokeStyle = "rgba(245, 204, 42, 1)";
            const lineWidth = 2;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeRect(
                BORDER_WIDTH + fromCol * squareSize + lineWidth / 2,
                BORDER_WIDTH +
                    (BOARD_SIZE - 1 - fromRow) * squareSize +
                    lineWidth / 2,
                squareSize - lineWidth,
                squareSize - lineWidth
            );
            this.ctx.strokeRect(
                BORDER_WIDTH + toCol * squareSize + lineWidth / 2,
                BORDER_WIDTH +
                    (BOARD_SIZE - 1 - toRow) * squareSize +
                    lineWidth / 2,
                squareSize - lineWidth,
                squareSize - lineWidth
            );
        }

        // Draw highlighted squares
        if (this.showHighlight && this.highlightSquares) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
            this.ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
            this.ctx.lineWidth = 8;
            for (let highlightSquare of this.highlightSquares) {
                const highlightRow = Math.floor(highlightSquare / 8);
                const highlightCol = highlightSquare % 8;

                const piece = this.game
                    .getCurrentPosition()
                    .getPiece(highlightSquare);
                const circleSize = piece ? squareSize / 2.4 : squareSize / 6;

                this.ctx.beginPath();
                this.ctx.arc(
                    BORDER_WIDTH + (highlightCol + 0.5) * squareSize,
                    BORDER_WIDTH +
                        (BOARD_SIZE - 1 - highlightRow + 0.5) * squareSize,
                    circleSize,
                    0,
                    2 * Math.PI
                );
                if (piece) {
                    this.ctx.stroke();
                } else {
                    this.ctx.fill();
                }
            }
        }

        // draw files and ranks
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
        this.ctx.restore();
    }

    #drawPieces(event) {
        this.ctx.save();
        const squareSize = this.#getSquareSize();
        const sizeMultiplier = 0.93;
        const offset = (1 - sizeMultiplier) / 2;
        const position = this.game.getCurrentPosition();

        for (let sq = 0; sq < 64; sq++) {
            const piece = position.getPiece(sq);
            if (!piece) {
                continue;
            }
            const isSelectedPiece =
                event && this.selectedPieceSquare === sq && this.isDragging;

            if (!isSelectedPiece) {
                const pieceRow = Math.floor(sq / 8);
                const pieceCol = sq % 8;
                this.ctx.drawImage(
                    this.assetLoader.getPieceImage(piece.type, piece.colour),
                    BORDER_WIDTH + (pieceCol + offset) * squareSize,
                    BORDER_WIDTH +
                        (BOARD_SIZE - 1 - pieceRow + offset) * squareSize,
                    squareSize * sizeMultiplier,
                    squareSize * sizeMultiplier
                );
            }
        }

        // draw selected piece as hovering
        if (event && this.selectedPieceSquare !== null && this.isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const borderSquare = this.#getEventSquare(event);
            const borderRow = Math.floor(borderSquare / 8);
            const borderCol = borderSquare % 8;
            const lineWidth = 4;
            this.ctx.lineWidth = lineWidth;
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
            this.ctx.strokeRect(
                BORDER_WIDTH + borderCol * squareSize + lineWidth / 2,
                BORDER_WIDTH +
                    (BOARD_SIZE - 1 - borderRow) * squareSize +
                    lineWidth / 2,
                squareSize - lineWidth,
                squareSize - lineWidth
            );

            const piece = position.getPiece(this.selectedPieceSquare);
            const pieceSize = squareSize * sizeMultiplier;
            this.ctx.drawImage(
                this.assetLoader.getPieceImage(piece.type, piece.colour),
                x - pieceSize / 2,
                y - pieceSize / 2,
                pieceSize,
                pieceSize
            );
        }
        this.ctx.restore();
    }

    #drawPromotionMenu() {
        this.ctx.save();
        const squareSize = this.#getSquareSize();
        const promotionRow = Math.floor(this.promotionSquare / 8);
        const promotionCol = this.promotionSquare % 8;

        const y = promotionRow === 0 ? 4 : 0;
        const lineWidth = 1;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = "white";
        this.ctx.shadowColor = "rgba(180,180,180, 0.5)";
        this.ctx.shadowBlur = 2;
        this.ctx.strokeRect(
            BORDER_WIDTH + promotionCol * squareSize + lineWidth / 2,
            BORDER_WIDTH + y * squareSize + lineWidth / 2,
            squareSize - lineWidth,
            squareSize * 4 - lineWidth
        );
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(
            BORDER_WIDTH + promotionCol * squareSize,
            BORDER_WIDTH + y * squareSize,
            squareSize,
            squareSize * 4
        );

        this.ctx.shadowBlur = 0;

        const sizeMultiplier = 0.93;
        const offset = (1 - sizeMultiplier) / 2;
        const colour = this.game.getCurrentPosition().currentTurn;

        [
            PieceType.QUEEN,
            PieceType.KNIGHT,
            PieceType.ROOK,
            PieceType.BISHOP,
        ].forEach((pieceType, i) => {
            const dir = colour === PieceColour.WHITE ? 1 : -1;
            const y = BOARD_SIZE - 1 - promotionRow + i * dir;
            this.ctx.drawImage(
                this.assetLoader.getPieceImage(pieceType, colour),
                BORDER_WIDTH + (promotionCol + offset) * squareSize,
                BORDER_WIDTH + y * squareSize,
                squareSize * sizeMultiplier,
                squareSize * sizeMultiplier
            );
        });

        this.ctx.restore();
    }

    draw(event = null) {
        this.#drawBoard();
        this.#drawPieces(event);
        if (this.promotionSquare !== null) {
            this.#drawPromotionMenu();
        }
    }
}

export default Chessboard;
