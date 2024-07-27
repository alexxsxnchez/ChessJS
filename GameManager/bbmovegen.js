import { PieceColour, PieceType } from "./Immutable/Pieces/utils.js";
import Bitboard from "./bitboard.js";
import PRECOMPUTED from "./precomputed.js";
import { Move, MoveType } from "./Immutable/bbMove.js";

function sqIsAttacked(position, sq, attackingColour) {
    const queenBB = position.pieces[attackingColour][PieceType.QUEEN];
    const bishopBB = position.pieces[attackingColour][PieceType.BISHOP];
    const rookBB = position.pieces[attackingColour][PieceType.ROOK];
    const occupiedBB = position.sides[PieceColour.WHITE]
        .copy()
        .or(position.sides[PieceColour.BLACK]);

    const bishopOrQueen = bishopBB.copy().or(queenBB);
    if (makeBishopAttackMask(bishopOrQueen, occupiedBB).isSet(sq)) {
        return true;
    }

    const rookOrQueen = rookBB.copy().or(queenBB);
    if (makeRookAttackMask(rookOrQueen, occupiedBB).isSet(sq)) {
        return true;
    }

    const knightBB = position.pieces[attackingColour][PieceType.KNIGHT];
    if (!PRECOMPUTED.KNIGHT_MOVEMENTS[sq]) {
        console.log(sq);
        console.log(knightBB.string());
        console.log(PRECOMPUTED.KNIGHT_MOVEMENTS);
    }
    if (!PRECOMPUTED.KNIGHT_MOVEMENTS[sq].copy().and(knightBB).isEmpty()) {
        return true;
    }

    const kingBB = position.pieces[attackingColour][PieceType.KING];
    if (!PRECOMPUTED.KING_MOVEMENTS[sq].copy().and(kingBB).isEmpty()) {
        return true;
    }

    const pawnsBB = position.pieces[attackingColour][PieceType.PAWN];
    // need opposite coloured attack mask
    const defendingColour = PieceColour.getOpposite(attackingColour);
    if (
        !PRECOMPUTED.PAWN_ATTACKS[defendingColour][sq]
            .copy()
            .and(pawnsBB)
            .isEmpty()
    ) {
        return true;
    }
    return false;
}

function generateLegalForSquare(position) {
    const movesMap = new Map();
    const moves = generatePseudoLegal(position);
    moves.forEach((move) => {
        const isValid = position.makeMove(move);
        position.undoMove(move);
        if (isValid) {
            let moveArr = movesMap.get(move.fromSquare);
            if (moveArr === undefined) {
                moveArr = [move];
            } else {
                moveArr.push(move);
            }
            movesMap.set(move.fromSquare, moveArr);
        }
    });
    return movesMap;
}

function generatePseudoLegal(position) {
    const moves = [];
    moves.push(...generatePawnMoves(position));
    moves.push(...generateNormalPieceMoves(position));
    moves.push(...generateCastlingMoves(position));
    return moves;
}

// used for qSearch
function generateCapturesAndPromotions(position) {
    const moves = [];
    // get pawn captures and promotions
    moves.push(...generatePawnMoves(position, true));
    // get piece captures
    moves.push(...generateNormalPieceMoves(position, true));
    return moves;
}

function generatePawnMoves(position, captureAndPromotionOnly = false) {
    const moves = [];
    const whiteToPlay = position.currentTurn === PieceColour.WHITE;
    const rankDir = whiteToPlay ? 8 : -8;
    const lastRow = PRECOMPUTED.RANKS[whiteToPlay ? 7 : 0];
    const occupiedBB = position.sides[PieceColour.WHITE]
        .copy()
        .or(position.sides[PieceColour.BLACK]);
    const pawnsBB = position.pieces[position.currentTurn][PieceType.PAWN];

    function addPawnMoves(toBB, direction, moveType, promotionType = null) {
        while (!toBB.isEmpty()) {
            const toSq = toBB.getLowestBitPosition();
            toBB.popLowestBit();
            const fromSq = toSq - direction;
            moves.push(new Move(fromSq, toSq, moveType, promotionType));
        }
    }

    function addPromotionMoves(toBB, direction, capture) {
        addPawnMoves(
            toBB.copy(),
            direction,
            capture ? MoveType.PROMOTION_CAPTURE : MoveType.PROMOTION,
            PieceType.QUEEN
        );
        addPawnMoves(
            toBB.copy(),
            direction,
            capture ? MoveType.PROMOTION_CAPTURE : MoveType.PROMOTION,
            PieceType.KNIGHT
        );
        addPawnMoves(
            toBB.copy(),
            direction,
            capture ? MoveType.PROMOTION_CAPTURE : MoveType.PROMOTION,
            PieceType.ROOK
        );
        addPawnMoves(
            toBB.copy(),
            direction,
            capture ? MoveType.PROMOTION_CAPTURE : MoveType.PROMOTION,
            PieceType.BISHOP
        );
    }

    const singlePawnPushToBB = pawnsBB
        .copy()
        .shiftL(rankDir)
        .andNot(occupiedBB);

    if (!captureAndPromotionOnly) {
        addPawnMoves(
            singlePawnPushToBB.copy().andNot(lastRow),
            rankDir,
            MoveType.QUIET
        );
        const startingRankBB = PRECOMPUTED.RANKS[whiteToPlay ? 1 : 6];
        const doublePawnPushToBB = pawnsBB
            .copy()
            .and(startingRankBB)
            .shiftL(rankDir)
            .andNot(occupiedBB)
            .shiftL(rankDir)
            .andNot(occupiedBB);
        addPawnMoves(doublePawnPushToBB, 2 * rankDir, MoveType.QUIET);
    }

    // non-capture promotion moves
    addPromotionMoves(singlePawnPushToBB.copy().and(lastRow), rankDir, false);

    const leftDir = whiteToPlay ? -1 : 1;
    const leftFile = PRECOMPUTED.FILES[whiteToPlay ? 0 : 7];
    const rightFile = PRECOMPUTED.FILES[whiteToPlay ? 7 : 0];
    const leftCaptureDirection = rankDir + leftDir;
    const rightCaptureDirection = rankDir - leftDir;
    const opponentBB =
        position.sides[PieceColour.getOpposite(position.currentTurn)];

    // capture moves
    const pawnLeftCapturedBB = pawnsBB
        .copy()
        .andNot(leftFile)
        .shiftL(leftCaptureDirection)
        .and(opponentBB);
    addPawnMoves(
        pawnLeftCapturedBB.copy().andNot(lastRow),
        leftCaptureDirection,
        MoveType.CAPTURE
    );
    addPromotionMoves(
        pawnLeftCapturedBB.copy().and(lastRow),
        leftCaptureDirection,
        true
    );

    const pawnRightCapturedBB = pawnsBB
        .copy()
        .andNot(rightFile)
        .shiftL(rightCaptureDirection)
        .and(opponentBB);
    addPawnMoves(
        pawnRightCapturedBB.copy().andNot(lastRow),
        rightCaptureDirection,
        MoveType.CAPTURE
    );
    addPromotionMoves(
        pawnRightCapturedBB.copy().and(lastRow),
        rightCaptureDirection,
        true
    );

    // en passant
    if (position.enPassantSquare !== null) {
        const pawnEnPassantBB = new Bitboard().setBit(position.enPassantSquare);

        const pawnLeftEPBB = pawnsBB
            .copy()
            .andNot(leftFile)
            .shiftL(leftCaptureDirection)
            .and(pawnEnPassantBB);
        addPawnMoves(pawnLeftEPBB, leftCaptureDirection, MoveType.CAPTURE_EP);
        const pawnRightEPBB = pawnsBB
            .copy()
            .andNot(rightFile)
            .shiftL(rightCaptureDirection)
            .and(pawnEnPassantBB);
        addPawnMoves(pawnRightEPBB, rightCaptureDirection, MoveType.CAPTURE_EP);
    }

    return moves;
}

function generateNormalPieceMoves(position, captureOnly = false) {
    const moves = [];
    const opponentBB =
        position.sides[PieceColour.getOpposite(position.currentTurn)];
    const occupiedBB = position.sides[PieceColour.WHITE]
        .copy()
        .or(position.sides[PieceColour.BLACK]);

    const mask = position.sides[position.currentTurn].copy().not();

    if (captureOnly) {
        mask.and(opponentBB);
    }

    function addNormalMoves(fromSq, toBB) {
        while (!toBB.isEmpty()) {
            const toSq = toBB.getLowestBitPosition();
            toBB.popLowestBit();
            const moveType = opponentBB.isSet(toSq)
                ? MoveType.CAPTURE
                : MoveType.QUIET;
            moves.push(new Move(fromSq, toSq, moveType));
        }
    }

    // Knight
    const knightBB =
        position.pieces[position.currentTurn][PieceType.KNIGHT].copy();
    while (!knightBB.isEmpty()) {
        const fromSq = knightBB.getLowestBitPosition();
        knightBB.popLowestBit();
        const toBB = PRECOMPUTED.KNIGHT_MOVEMENTS[fromSq].copy().and(mask);
        addNormalMoves(fromSq, toBB);
    }

    // Bishop
    const bishopBB =
        position.pieces[position.currentTurn][PieceType.BISHOP].copy();
    while (!bishopBB.isEmpty()) {
        const fromSq = bishopBB.getLowestBitPosition();
        bishopBB.popLowestBit();
        const fromBB = new Bitboard().setBit(fromSq);
        const toBB = makeBishopAttackMask(fromBB, occupiedBB).and(mask);
        addNormalMoves(fromSq, toBB);
    }

    // Rook
    const rookBB = position.pieces[position.currentTurn][PieceType.ROOK].copy();
    while (!rookBB.isEmpty()) {
        const fromSq = rookBB.getLowestBitPosition();
        rookBB.popLowestBit();
        const fromBB = new Bitboard().setBit(fromSq);
        const toBB = makeRookAttackMask(fromBB, occupiedBB).and(mask);
        addNormalMoves(fromSq, toBB);
    }

    // Queen
    const queenBB =
        position.pieces[position.currentTurn][PieceType.QUEEN].copy();
    while (!queenBB.isEmpty()) {
        const fromSq = queenBB.getLowestBitPosition();
        queenBB.popLowestBit();
        const fromBB = new Bitboard().setBit(fromSq);
        const toBB = makeRookAttackMask(fromBB, occupiedBB)
            .or(makeBishopAttackMask(fromBB, occupiedBB))
            .and(mask);
        addNormalMoves(fromSq, toBB);
    }

    // King
    const kingBB = position.pieces[position.currentTurn][PieceType.KING].copy();
    while (!kingBB.isEmpty()) {
        const fromSq = kingBB.getLowestBitPosition();
        kingBB.popLowestBit();
        const toBB = PRECOMPUTED.KING_MOVEMENTS[fromSq].copy().and(mask);
        addNormalMoves(fromSq, toBB);
    }

    return moves;
}

function generateCastlingMoves(position) {
    const moves = [];

    let kingsideRights;
    let queensideRights;
    let kingPosition;
    if (position.currentTurn === PieceColour.WHITE) {
        kingsideRights = position.whiteKingsideRights;
        queensideRights = position.whiteQueensideRights;
        kingPosition = 4;
    } else {
        kingsideRights = position.blackKingsideRights;
        queensideRights = position.blackQueensideRights;
        kingPosition = 60;
    }

    if (kingsideRights) {
        if (
            isCastlingLegal(position, kingPosition, true, position.currentTurn)
        ) {
            moves.push(
                new Move(kingPosition, kingPosition + 2, MoveType.CASTLE)
            );
        }
    }
    if (queensideRights) {
        if (
            isCastlingLegal(position, kingPosition, false, position.currentTurn)
        ) {
            moves.push(
                new Move(kingPosition, kingPosition - 2, MoveType.CASTLE)
            );
        }
    }
    return moves;
}

function isCastlingLegal(position, kingPosition, kingside, colour) {
    const occupiedBB = position.sides[PieceColour.WHITE]
        .copy()
        .or(position.sides[PieceColour.BLACK]);
    const direction = kingside ? 1 : -1;
    if (
        occupiedBB.isSet(kingPosition + direction) ||
        occupiedBB.isSet(kingPosition + 2 * direction)
    ) {
        return false;
    }
    if (!kingside && occupiedBB.isSet(kingPosition - 3)) {
        return false;
    }

    const attackingColour = PieceColour.getOpposite(colour);
    return (
        !sqIsAttacked(position, kingPosition, attackingColour) &&
        !sqIsAttacked(position, kingPosition + direction, attackingColour) &&
        !sqIsAttacked(position, kingPosition + 2 * direction, attackingColour)
    );
}

function makeBishopAttackMask(fromBB, occupiedBB) {
    return makeSlidingAttackMask(fromBB.copy(), occupiedBB, -1, -1)
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, -1, 1))
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, 1, -1))
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, 1, 1));
}

function makeRookAttackMask(fromBB, occupiedBB) {
    return makeSlidingAttackMask(fromBB.copy(), occupiedBB, 0, -1)
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, 0, 1))
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, -1, 0))
        .or(makeSlidingAttackMask(fromBB.copy(), occupiedBB, 1, 0));
}

function makeSlidingAttackMask(fromBB, occupiedBB, rankDir, fileDir) {
    const bb = new Bitboard();
    const direction = 8 * rankDir + fileDir;

    while (!fromBB.isEmpty()) {
        fromBB.shiftL(direction);
        if (fileDir === -1) {
            fromBB.andNot(PRECOMPUTED.FILES[7]);
        } else if (fileDir === 1) {
            fromBB.andNot(PRECOMPUTED.FILES[0]);
        }
        bb.or(fromBB);

        fromBB.andNot(occupiedBB);
    }
    return bb;
}

export {
    generateLegalForSquare,
    generatePseudoLegal,
    generateCapturesAndPromotions,
    sqIsAttacked,
};
