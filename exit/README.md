# Jimmy Mac's Kathy Kennedy Report Card

A live-fill scorecard web app for video podcast use. Rate Kathy Kennedy's Lucasfilm tenure across 8 categories, then reveal the final grade on-air.

## Quick Start

1. Open `index.html` in any modern browser — no server required.
2. Adjust scores using sliders or number inputs (1–10, half-point steps).
3. Add "receipt" evidence notes and quick verdicts per category.

## Weighted Mode

Toggle **Weighted** in the totals bar to switch between equal weighting and editorial weights (Fan Trust 20%, Stewardship 15%, etc.). Expand **Weighted Breakdown** in the sidebar to inspect per-category contributions.

## Reveal Mode

Click **Reveal Final Grade** to show a full-screen overlay with the letter grade, top/bottom categories, and a one-sentence summary. When weighted mode is active, you can toggle "Rank by weighted contribution" inside the reveal panel. Click **Hide Reveal** or press **Escape** to return.

## Persistence

All scores, notes, and checklist state auto-save to `localStorage`. Use the sidebar buttons to:

- **Export JSON** — download the current scorecard as a `.json` file.
- **Import JSON** — restore a previously exported scorecard.
- **Reset All** — clear everything back to defaults (with confirmation).

## Segment Checklist

Use the built-in checklist to track segment flow: Opening thesis, Shared wins/misses, Scorecard pass, Root-cause debate, Successor brief, Lightning close.
