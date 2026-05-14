# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Phone-first browser prototype of a Streets-&-Alleys-style word solitaire. TypeScript + React (Vite), plain DOM/CSS rendering, pointer-events drag layer. Sibling of `../web/` (word-mahjong prototype); shares card visuals and the category/word data model but is otherwise independent. See `DESIGN.md` for the full game design — it is the source of truth for rules and should be re-read before changing mechanics.

## Commands

- `npm run dev` — start Vite dev server (port 5174).
- `npm run build` — type-check (`tsc`) then build (`vite build`). Use this to validate TypeScript; there is no separate lint or test script.
- `npm run preview` — preview the production build.

No tests exist. There is no linter. Verify changes by running the dev server on a phone-sized viewport (or with browser devtools mobile emulation) and exercising the affected mechanic.

**Always run `npm run build` and `npm run dev` yourself** — do not ask the user to run them. Run `npm run build` to validate TypeScript after code changes; run `npm run dev` (in the background) to exercise UI changes before reporting a task done.

## Architecture

### State model (single reducer)

The whole game runs through one reducer in `src/game/reducer.ts`. The top-level shape is `AppState = { state: GameState, history: GameState[], outcome, lastError }`. Every successful move pushes the prior `GameState` onto `history`; `ROLLBACK` pops it. `RESET` rebuilds via `buildInitialState` in `src/game/init.ts`. Outcome (`playing` | `won` | `lost`) is recomputed after each move and gates further actions in the reducer; the `App` also shows a blocking `Overlay` when not `playing`.

Move semantics live in `src/game/moves.ts` (`applyAction` dispatches over the `Action` union, throwing on invalid moves; the reducer catches and stores the message in `lastError`). All move-cost accounting is centralized there. Both `CYCLE_STACK` and `DROP_TO_FOUNDATION` cost 1 move.

Types are in `src/types.ts`. `Action` is the set of in-game moves; `AppAction` adds meta actions (`ROLLBACK`, `RESET`).

### Rows and stacks

A `Row` is `{ left: Stack, right: Stack, foundation: CategorySlot }`. A `Stack` is `{ cards: Card[] }` with **index 0 = top** (the exposed, interactive card) and the last index = the deepest buried card.

`CYCLE_STACK` shifts the top card to the end (`[a, b, c]` → `[b, c, a]`). Requires at least 2 cards. The next-down card becomes the new top.

### Foundations (category slots)

`CategorySlot { lockedCategory, displayedCard, cardsConsumed }`. Empty foundation accepts only a category card (locks the slot to that category). Locked foundation accepts only simple cards of its locked category (consumes them, increments `cardsConsumed`).

Auto-clear is **global** by category: when `consumedSimple` filtered by the locked category reaches that category's `wordsData.length`, every foundation locked to that category resets to empty in the same step. This mirrors the rule in `../web/`. The check fires inside `placeCardInFoundation` in `moves.ts`.

### Win/loss

`isWon`: `consumedSimple.length >= totalSimpleInLevel`. `isLost`: `movesUsed >= movesLimit && !won`. `movesLimit < 0` means unlimited.

### Pointer-events drag layer

`src/components/dragLayer.tsx` exposes `DragProvider`, `useDrag()`. There is no HTML5 drag-and-drop (broken on mobile). Flow:

1. A draggable element calls `startDrag(e, payload, ghost, onTap, sourceKey)` from `onPointerDown`. The session lives in a ref; nothing visual happens yet.
2. On `pointermove`, once movement exceeds `DRAG_THRESHOLD_PX` (6px), the session becomes active: a ghost element (passed in by the caller) is rendered at the pointer position, and `document.elementFromPoint` finds the topmost element with `data-drop-id`, exposed as `activeHoverId`.
3. On `pointerup`:
   - If active and over a drop target: look up the target's handler and call it with `payload`.
   - If never active: call `onTap` (the unified-gesture path — a click).
4. Drop targets register via `registerDropTarget(id, handler)` from a `useEffect`; the returned cleanup removes the handler.

`draggingFromKey` is exposed so the source element can render its top as dimmed while its ghost is in flight.

### UI layout (phone-first)

`App.tsx` composes: `<Header>` (level picker, moves counter, undo) + a centered `.rows` list, each rendered by `Row` as `<Stack side="left">` `<Foundation>` `<Stack side="right">`. Card size is 56×80px; the buried-cards fan offset is 14px per layer. Both stacks place their top card adjacent to the foundation (left stack's top on the right of its box, right stack's top on the left of its box) so the player can reach both with a thumb.

`Overlay` shows on win/loss and blocks further input.

### Levels

Levels are JSON in `src/levels/`, picked up by `src/levels/index.ts` via `import.meta.glob('./*.json', { eager: true })` and sorted by filename (numeric-aware). Adding a level: drop a new `*.json` file in the folder — no code edit needed. Format documented in `DESIGN.md`. A `cardId` resolves first against `categoryId` (becomes a category card) then against any `wordId` (becomes a simple card of that category) — see `createCardFromId` in `src/game/cards.ts`. Card UIDs are reset per level load via `resetUidForLevel`.

Words can optionally render as images (`icon: true` + `imageId` referencing `/public/images/<imageId>.png`).

## TODO

- Level editor (skipped for prototype; current authoring is by hand-editing JSON).
- Validate against a 4-stacks-per-row layout (current: 2 stacks per row, constrained by phone-vertical layout).
