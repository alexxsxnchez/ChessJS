import eventBus from "../Common/eventbus.js";
import {
    PieceColour,
    PieceType,
} from "../GameManager/Immutable/Pieces/utils.js";

class AssetLoader {
    constructor() {
        this.assetCounter = 0;
        this.pieces = {};

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
                    this.assetCounter++;
                    if (this.assetCounter === 12) {
                        eventBus.emit("assets::ready");
                    }
                };
                img.src = `../assets/${pieceType}-${colour}.svg`;
                this.pieces[`${pieceType}-${colour}`] = img;
            });
        });
    }
}

export default AssetLoader;
