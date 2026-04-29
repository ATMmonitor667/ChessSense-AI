export type Grade = "Excellent" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";

export type Attempt = {
  id: string;
  puzzleId: string;
  userMoveSan: string;
  userMoveUci: string;
  bestMove: string;
  score: number;
  grade: Grade;
  feedback: string;
  createdAt: string;
};
