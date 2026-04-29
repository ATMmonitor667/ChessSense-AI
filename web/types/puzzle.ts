export type Style =
  | "tactical"
  | "aggressive"
  | "defensive"
  | "positional"
  | "endgame"
  | "engine";

export type Puzzle = {
  id: string;
  fen: string;
  sideToMove: "white" | "black";
  style: Style;
  prompt: string;
  bestMove: string;
  bestMoveUci: string;
  bestLine: string[];
  difficulty: number;
  explanation?: string;
  /** Phase A grading: alternate strong moves scored as Good */
  alsoGoodMovesUci?: string[];
};
