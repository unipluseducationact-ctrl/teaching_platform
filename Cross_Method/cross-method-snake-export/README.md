# Cross Method Snake — Export Pack

Standalone export of the **Cross Method Snake** game from the KOC S3 Math Factorization dashboard.

## Contents

| File | Purpose |
|------|---------|
| `index.html` | Standalone game page (open in browser) |
| `factorization-game.js` | Game logic (Cross Method Snake + Factor Blaster code from dashboard) |
| `README.md` | This file |

## How to run

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
2. Click **Start Snake**.
3. Use **Arrow keys** or **WASD** to move; on mobile, use the on-screen direction pad.

## Game rules

- **Normal mode:** Eat the correct factorization for the trinomial shown above the board.
- **Advanced mode:** First eat the common factor, then eat both correct linear factors.
- 3 lives, 5 levels to win, no time limit.
- Hitting a wall or your own body costs 1 life.

## Requirements

- Internet connection for KaTeX and Google Fonts (CDN).
- No server required — works from local file or any static host.

## Source

Copied from `dashboard/topics/factorization/` in the KOC S3 Math dashboard project.
