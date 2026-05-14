# Streets & Alleys — Word Solitaire (Prototype)

A turn on the Streets-and-Alleys solitaire layout, played with category/word association cards. Phone-first.

## Cards

Two kinds, same as `../web/`:

- **Category card** — represents a category (e.g. "Colors"). Visually distinct (gold gradient).
- **Simple card** — a member word of a category (e.g. "Red", "Blue"). Can optionally render an icon image instead of text via `icon: true` + `imageId`.

## Board

The board is a vertical list of **rows** (3 in level 1; future levels may have 4–5). Each row contains:

- One **left stack** of cards.
- A central **foundation slot** (empty at level start).
- One **right stack** of cards.

A stack shows only its **top** card face-up; the remaining cards are face-down behind it, visually fanned outward from the foundation.

## Player actions

Each action costs one move; the total budget is `movesLimit` (per-level).

### Tap a stack's top card → cycle

The top card moves to the bottom of its own stack. The card that was directly below it becomes the new top (face-up, interactable). A stack with fewer than 2 cards cannot be cycled.

### Drag a stack's top card → drop on a foundation

The card is removed from the stack and placed on the foundation, subject to acceptance rules:

- **Empty foundation** accepts only a **category card**. Placing one locks the foundation to that category.
- **Locked foundation** accepts only **simple cards of its locked category**. Each accepted simple card increments the foundation's progress counter.

A drop on an invalid foundation is rejected (no move consumed, error surfaced via `lastError`).

### Auto-clear

When every simple card belonging to a category has been consumed across the level (regardless of which foundation it was dropped onto), every foundation locked to that category resets to empty in the same step. The foundation is then free to accept a new category card.

This is a global counter, not per-slot. If two foundations happen to lock the same category, both auto-clear together when the category completes.

## Win / loss

- **Win** — all simple cards in the level have been consumed.
- **Loss** — moves used equals the moves limit and the level is not won.

A `movesLimit` of `-1` means unlimited moves (no loss condition).

## Undo

`Undo` reverts the last action — any action, including cycles and rejected/accepted drops. The history is unbounded for the current level. `Restart` (via the win/loss overlay) resets the level from scratch with a fresh history.

## Level data format

JSON in `src/levels/*.json`. Files are auto-discovered (sorted numeric-aware by filename). Skeleton:

```json
{
  "levelId": "level-1",
  "movesLimit": 50,
  "categories": [
    {
      "categoryId": "Colors",
      "wordsData": [
        { "wordId": "Red" },
        { "wordId": "Blue", "icon": true, "imageId": "colors__blue" }
      ]
    }
  ],
  "rows": [
    {
      "left":  ["Apple", "Tools", "Cherry"],
      "right": ["Cat",   "Saw",   "Banana"]
    }
  ]
}
```

### Field semantics

- `levelId` — display string, must be unique across files.
- `movesLimit` — integer; `-1` for unlimited.
- `categories[].categoryId` — category name (used as the locking key and as the category card's `cardId`).
- `categories[].wordsData[].wordId` — simple card's `cardId`.
- `categories[].wordsData[].icon` / `imageId` — optional; if set, the card renders the image at `/images/<imageId>.png`.
- `rows` — ordered top-to-bottom. Each entry has `left` and `right` string arrays.
- Each stack array is **top-first** (index 0 is the initially exposed card, last entry is the deepest buried card).
- Card IDs in stacks resolve first against any `categoryId` (yields a category card), then against any `wordId` (yields a simple card). A typo raises an error at level load.

### Authoring guidance

- The total number of simple cards across all categories is the target the player must consume.
- Category cards are optional surplus — only one matching category card needs to reach an empty foundation to start consumption.
- Verify the level is solvable inside `movesLimit` (factor in cycle moves; typical worst case is ≈ `cards / 2` cycles).
