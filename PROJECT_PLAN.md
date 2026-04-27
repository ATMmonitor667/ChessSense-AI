# ChessSense AI — Project Plan (MVP → V1)

## Goal

Build a style-based chess training app where a user:

- picks a **style mode**
- solves a **FEN-based position** by making a move on a board
- gets **legal-move validation**
- receives a **score + grade** by comparing to best play
- reads a **short AI explanation** that teaches ideas (not just eval)
- sees **session results** and weak areas

Non-goal for MVP: accounts, PGN upload, full analytics, leaderboards.

## Success criteria (MVP)

- A user can complete a 10-puzzle session without errors.
- Illegal moves are rejected immediately.
- After submission, the app always shows:
  - user move (highlighted)
  - best move (highlighted)
  - grade + score
  - best continuation (2–6 ply)
  - AI feedback (≤120 words)
- Puzzle selection respects the chosen style category.

## Product requirements (MVP)

### Style modes

- Tactical
- Aggressive
- Defensive
- Positional
- Endgame
- Engine (objective best move)

### Pages (MVP)

- **Landing**: explains the app + “Start training”
- **Style selection**: pick a style + session length (default 10)
- **Puzzle**: board + prompt + submit + feedback + next
- **Results**: session summary + weak style areas + “Train again”

## Key implementation decisions (lock these early)

### Move representation: SAN vs UCI

- **Recommendation**: store puzzle answers as **UCI** (`bestMoveUci`) and also keep **SAN** (`bestMove`) for display.
- **Why**: UCI is unambiguous for comparison; SAN is nicer for UI and explanations.
- **Rule**: when user plays a move, convert it to **UCI** for grading, but show SAN in UI.

### Engine evaluation strategy (MVP)

You need engine-backed grading, but you can phase it:

- **Phase A (fast MVP)**: grade by comparing to puzzle’s `bestMoveUci` plus a small set of “also good” alternatives (manually curated per puzzle).
- **Phase B (stronger MVP)**: run Stockfish to evaluate the user move vs best move and compute score buckets.

> If Phase B takes time, ship Phase A first. The user experience is still solid if puzzles are curated.

### AI feedback strategy

- Generate feedback **after** grading, using the prompt template in `README.md`.
- Cache feedback per (puzzleId, style, userMoveUci) when possible to reduce cost.

## Proposed repository structure (Next.js App Router)

This is a recommended target layout once you scaffold the app:

- `app/`
  - `page.tsx` (landing)
  - `train/page.tsx` (style selection)
  - `session/page.tsx` (puzzle experience)
  - `results/page.tsx` (session results)
  - `api/feedback/route.ts` (AI explanation)
  - `api/grade/route.ts` (optional: engine-backed grading)
- `components/`
  - `ChessBoard.tsx` (wrap `react-chessboard`)
  - `StylePicker.tsx`
  - `MoveFeedbackCard.tsx`
  - `ResultsSummary.tsx`
- `lib/`
  - `puzzles/`
    - `puzzles.json`
    - `index.ts` (load/filter helpers)
  - `chess/`
    - `move.ts` (SAN/UCI conversion helpers)
    - `grade.ts` (grading logic)
    - `stockfish.ts` (engine wrapper; Phase B)
  - `ai/`
    - `prompt.ts` (prompt builder)
    - `client.ts` (provider abstraction: OpenAI/Gemini/Claude)
- `types/`
  - `puzzle.ts`
  - `attempt.ts`

## Milestones

### Milestone 0 — Scaffold & UI baseline (½–1 day)

- Initialize Next.js + TypeScript + Tailwind
- Add `react-chessboard` + `chess.js`
- Create a clean layout + routing skeleton

**Acceptance criteria**

- Landing page renders.
- Style selection page renders and navigates to session.
- Session page renders a placeholder board + prompt.

### Milestone 1 — Puzzle bank + style filtering (½ day)

- Create `puzzles.json` with at least:
  - 5 puzzles per style (30 total) OR start with 10–15 mixed and expand
- Implement `getPuzzleByStyle(style)` and “next puzzle” selection
  - avoid repeats in a session

**Acceptance criteria**

- Choosing a style yields only puzzles from that style.
- “Next puzzle” advances until session is complete.

### Milestone 2 — Chessboard interaction + legal move validation (1 day)

- Load puzzle FEN into `chess.js`
- Connect `react-chessboard` onDrop handler:
  - attempt move
  - reject illegal moves (snapback)
  - track the user’s selected move as UCI

**Acceptance criteria**

- Illegal moves cannot be made.
- Legal moves update board state and are stored as the pending guess.
- “Reset” returns to the original FEN.

### Milestone 3 — Grading + reveal best line (1–2 days)

- Implement grading buckets:
  - Excellent (exact best)
  - Good / Inaccuracy / Mistake / Blunder (Phase A heuristic or Phase B engine)
- After submit:
  - freeze board interaction
  - highlight user move and best move
  - show grade + score
  - show `bestLine`

**Acceptance criteria**

- Submitting always yields a deterministic grade/score.
- Best move is always displayed and highlighted.
- Best continuation is shown as SAN moves list.

### Milestone 4 — AI explanation API (½–1 day)

- Add `/api/feedback` route:
  - input: `fen`, `style`, `prompt`, `userMove`, `bestMove`, `bestLine`, `score`
  - output: `feedback` string (≤120 words)
- Add UI state for loading/error/retry

**Acceptance criteria**

- Feedback appears within a few seconds.
- If the AI call fails, the app shows a friendly error and a retry button.

### Milestone 5 — Results page + weak areas (½ day)

- Track attempts in session state (client-side for MVP)
- Compute:
  - puzzles attempted
  - correct count
  - average score
  - score by style (for MVP, the chosen style will dominate; still compute basics)
- Suggest practice:
  - for MVP, suggest “repeat this style” or “try Defensive” if average score < threshold

**Acceptance criteria**

- Completing a session navigates to Results.
- Results show summary metrics and a “Train again” CTA.

## Grading logic (suggested MVP)

### Phase A (no engine)

- **Excellent**: `userMoveUci === bestMoveUci` → score 100
- **Good**: user move is legal and in `alsoGoodMovesUci[]` (optional per puzzle) → 85–95
- **Inaccuracy**: legal but not best / not also-good → 60–79
- **Mistake**: legal but fails a basic tactic described by puzzle tags (optional) → 30–59
- **Blunder**: legal but clearly loses material or allows immediate mate (hard to detect without engine; keep rare) → 0–29

### Phase B (engine-backed)

Use Stockfish to evaluate:

- \( \Delta = \text{eval(best)} - \text{eval(user)} \) from side-to-move perspective
- Map \( \Delta \) to buckets (tune later):
  - Excellent: \( \Delta \le 0.15 \)
  - Good: \( 0.15 < \Delta \le 0.50 \)
  - Inaccuracy: \( 0.50 < \Delta \le 1.25 \)
  - Mistake: \( 1.25 < \Delta \le 3.00 \)
  - Blunder: \( \Delta > 3.00 \)

Score mapping example:

- score = clamp(100 - (Δ * 25), 0, 100) then snap to grade band min/max

## Puzzle authoring guidelines

For each puzzle, ensure:

- FEN is valid and includes correct side-to-move
- `bestMoveUci` is legal in that FEN
- `bestMove` matches the SAN returned by `chess.js` for the same move
- `bestLine` is short (3–7 SAN plies) and legal/consistent
- Style prompt matches the best move idea (don’t label a quiet move as “tactical”)

## Stretch features (post-MVP)

- **Accounts + persistence**: Supabase Auth + DB for attempts
- **Dashboard**: historical sessions, trend lines, openings tags
- **PGN upload**: convert user games to candidate training positions
- **Weakness detection**: per-theme breakdown (forks, pins, defense, endgame)
- **Famous player styles**: curated style prompt sets and puzzle collections


