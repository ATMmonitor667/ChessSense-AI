# ChessSense AI

Style-based, AI-powered chess training: guess the best move from real positions **based on a chosen style** (tactical/aggressive/defensive/positional/endgame/engine) and get **engine-backed grading** plus a **short coach-style explanation**.

## Why

Most chess apps show engine evals but don’t teach *how to think*. ChessSense AI focuses on:

- **Guess-the-move** training from curated positions
- **Style prompts** (e.g., “best defensive resource”)
- **Move validation** and **grading**
- **AI feedback** that explains ideas in simple language

## MVP scope

- Landing page
- Style selection page
- Puzzle page with interactive chessboard (FEN-based)
- Preset puzzle bank (JSON)
- Legal move validation (reject illegal moves)
- Submit move → compare vs best move → score + grade
- Reveal best move + short best continuation line
- AI-generated explanation (≤120 words)
- Results page (session summary + weak areas)

## Recommended MVP stack

- **Frontend**: Next.js + TypeScript
- **UI**: Tailwind CSS
- **Chessboard**: `react-chessboard`
- **Rules/validation**: `chess.js`
- **Engine**: Stockfish (local/wasm for MVP)
- **Puzzle storage**: local JSON file first
- **AI feedback**: OpenAI / Gemini / Claude (API)

> Not in MVP: Supabase, login, PGN upload, user dashboards. Add those after the core loop is solid.

## Data model (MVP)

### Puzzle

```ts
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
  bestMove: string; // SAN (e.g., "Bxf7+")
  bestMoveUci: string; // UCI (e.g., "c4f7")
  bestLine: string[]; // short PV in SAN (["Bxf7+", "Kxf7", "Ng5+"])
  difficulty: number; // 1-5 (MVP)
  explanation: string; // optional human seed explanation
};
```

### Attempt (session-local for MVP)

```ts
export type Grade = "Excellent" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";

export type Attempt = {
  id: string;
  puzzleId: string;
  userMove: string; // SAN or UCI (choose one consistently)
  bestMove: string; // SAN
  score: number; // 0-100
  grade: Grade;
  feedback: string; // AI-generated
  createdAt: string; // ISO
};
```

## AI feedback prompt template

```text
You are a friendly chess coach.

The user is solving a chess puzzle.

Position FEN:
{fen}

Style mode:
{style}

Puzzle prompt:
{prompt}

User move:
{userMove}

Best move:
{bestMove}

Best continuation:
{bestLine}

User score:
{score}

Explain:
1. Whether the user's move was good or bad.
2. Why the best move works.
3. How the best move matches the selected style.
4. What chess concept the user should learn.
5. Keep the explanation under 120 words.
6. Use simple and encouraging language.
```

## Project docs

- `PROJECT_PLAN.md` — milestones, architecture, acceptance criteria, and build order

## License

MIT — see `LICENSE`.

