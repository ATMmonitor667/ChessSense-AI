"use client";

import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { useCallback, useMemo, useRef, useState } from "react";

import { moveToUci } from "@/lib/chess/move";

const USER_RGB = "rgba(59, 130, 246, 0.45)";
const BEST_RGB = "rgba(34, 197, 94, 0.42)";

function promotionForPiece(
  piece: ReturnType<Chess["get"]>,
  toSq: Square,
): "q" | undefined {
  if (!piece || piece.type !== "p") return undefined;
  const rank = toSq[1];
  if (!rank) return undefined;
  if (piece.color === "w" && rank === "8") return "q";
  if (piece.color === "b" && rank === "1") return "q";
  return undefined;
}

export type PuzzleBoardProps = {
  fen: string;
  orientation: "white" | "black";
  interactive: boolean;
  highlights?: {
    userFrom: string | null;
    userTo: string | null;
    bestFrom: string | null;
    bestTo: string | null;
  };
  onMovePlayed: (san: string, uci: string) => void;
};

/**
 * Outer wrapper remounts when `fen` changes so piece state/game ref stay aligned
 * without syncing `useState` in an effect.
 */
export default function PuzzleBoard(props: PuzzleBoardProps) {
  return <PuzzleBoardInner key={props.fen} {...props} />;
}

function PuzzleBoardInner({
  fen,
  orientation,
  interactive,
  highlights,
  onMovePlayed,
}: PuzzleBoardProps) {
  const gameRef = useRef<Chess>(new Chess(fen));
  /** Position after dragged moves — initial `fen` comes from keyed remount. */
  const [fenState, setFenState] = useState(fen);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    const add = (sq: string | null, color: string) => {
      if (!sq) return;
      styles[sq] = { backgroundColor: color };
    };
    if (!highlights) return styles;
    add(highlights.userFrom, USER_RGB);
    add(highlights.userTo, USER_RGB);
    add(highlights.bestFrom, BEST_RGB);
    add(highlights.bestTo, BEST_RGB);
    return styles;
  }, [highlights]);

  const handleDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!interactive || !targetSquare) return false;
      const chess = gameRef.current;
      const from = sourceSquare as Square;
      const to = targetSquare as Square;
      const piece = chess.get(from);
      const promotion = promotionForPiece(piece, to);
      const move = chess.move({
        from,
        to,
        ...(promotion ? { promotion } : {}),
      });
      if (!move) return false;
      setFenState(chess.fen());
      onMovePlayed(move.san, moveToUci(move));
      return true;
    },
    [interactive, onMovePlayed],
  );

  return (
    <div className="mx-auto w-full max-w-[min(100%,560px)]">
      <Chessboard
        options={{
          position: fenState,
          boardOrientation: orientation,
          allowDragging: interactive,
          onPieceDrop: handleDrop,
          squareStyles,
        }}
      />
    </div>
  );
}
