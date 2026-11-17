# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/ilyiyam1/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/ilyiyam1/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Bountyline — a fast, read-only frontend for make.fun, built from static files on make.fun's public API. It shows the live bounty board (each bounty's live pot, entry fee, time left and entries), a bounty's page (rewards with live fee shares, dates, rules), that bounty's leaderboard (paginated, performance/overall views), and any account's public profile — each reachable by a link and by its own hash route. API answers are cached for a minute and revalidated with ETags; long lists are paginated; the first load is a handful of small files, no framework, no build step.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

To build the submission output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
