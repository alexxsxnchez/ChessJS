import eventBus from "../Common/eventbus.js";
import {
    PieceColour,
    PieceType,
} from "../GameManager/Immutable/Pieces/utils.js";

class AssetLoader {
    #pieces;
    #sounds;
    constructor() {
        this.#pieces = {};
        this.#sounds = {};
        this.#loadPieceImages();
        this.#loadSounds();
    }

    getPieceImage(pieceType, colour) {
        return this.#pieces[`${pieceType}-${colour}`];
    }

    getSound(name) {
        return this.#sounds[name];
    }

    #loadPieceImages() {
        let pieceCounter = 0;
        const pieceTypes = [
            PieceType.PAWN,
            PieceType.ROOK,
            PieceType.KNIGHT,
            PieceType.BISHOP,
            PieceType.QUEEN,
            PieceType.KING,
        ];
        const colours = [PieceColour.WHITE, PieceColour.BLACK];
        pieceTypes.forEach((pieceType) => {
            colours.forEach((colour) => {
                const img = new Image();
                img.onload = () => {
                    pieceCounter++;
                    if (pieceCounter === 12) {
                        eventBus.emit("assets::ready");
                    }
                };
                img.src = `../assets/pieces/${pieceType}-${colour}.svg`;
                this.#pieces[`${pieceType}-${colour}`] = img;
            });
        });
    }

    #loadSounds() {
        [
            "move-self",
            "move-opponent",
            "check",
            "castle",
            "promotion",
            "capture",
            "game-start",
            "game-end",
            "illegal",
        ].forEach((name) => {
            const audio = new Audio(`../assets/sounds/${name}.mp3`);
            audio.addEventListener("ended", () => {
                audio.load(); // reset to beginning for next playback
            });
            this.#sounds[name] = audio;
        });
    }
}

export default AssetLoader;
