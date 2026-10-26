# Tennis Ranking Points Breakdown

A Chrome extension that turns every player name on
[live-tennis.eu](https://live-tennis.eu/en/wta-live-ranking)'s live ranking
tables into a link to where that player's ranking points actually come from —
and when each block of points expires.

The ranking tables give you a points total. They don't tell you that 1500 of
those points fall off in three weeks. This closes that gap.

## Two builds

The repository produces two builds from one source tree. Run `./build.sh`.

### `dist/public` — the published extension

Adds the link, and nothing else. Clicking a player name resolves that player and
opens **their page on tennistonic.com**, with that site's own layout, session and
advertising untouched. It copies no page content and modifies no site other than
adding a link on live-tennis.eu.

This is the build packaged for the Chrome Web Store.

### `dist/full` — the local build

Everything above, plus the part that made this worth building: **one flat table
containing every point a player holds, sortable by any column.**

It fixes the two things that make the breakdown hard to read at the source:
points are split into a separate table per category (Grand Slam, WTA 1000,
WTA 500, …) so they can't be ordered by expiry across categories, and the
sidebar list of upcoming drops stops at the end of the season. Here everything —
including the non-counting results — sits in one table sorted by expiry date,
reaching as far forward as the data does.

Load this one unpacked; it isn't published.

## Install

**The published build:** from the Chrome Web Store *(link once live)*.

**Either build from source:**

1. Run `./build.sh`.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select `dist/full` (or `dist/public`).

Developer mode is needed only because the build isn't coming from the store.
Loading is one-time — it survives restarts as long as the folder stays put.

## Use

Open a live ranking page and click any player's name. The ATP ranking pages work
too; the tour is taken from the URL.

### The table (full build)

| Column | Notes |
| --- | --- |
| Date | When the tournament was played |
| Tournament | Links to the tournament page |
| Level | Grand Slam / WTA 1000 / 500 / 250 / 125 / ITF — sorts by event size, not alphabetically |
| Round | Sorts by how far the player got (Q < 1st < … < QF < SF < F < W) |
| Points | |
| Expires | When these points drop off the ranking — the default sort |
| Days left | Days from today until that happens |
| Cumulative | Total counting points expiring on or before this row's date |
| Status | Counting, or outside the player's best-N results |

Click any header to sort, click again to reverse. Rows expiring within 30 days
are highlighted, non-counting results can be hidden, and **Download CSV** exports
whatever is on screen if you want to slice it some other way.

The summary strip shows total counting points, the next drop, and how much
expires within 30 and 90 days.

## How it works

| File | Role |
| --- | --- |
| `src/inject-livetennis.js` | Content script on live-tennis.eu. Wraps each player name in a link, and re-applies itself when the site re-sorts its table. |
| `src/go.js` + `go.html` | Public build. Resolves a name to a player id and hands the browser over to tennistonic.com. |
| `src/viewer.js` + `viewer.html` | Full build. Fetches the breakdown and renders the sortable table. |
| `src/enhance-tennistonic.js` | Full build. Rewrites tennistonic's own breakdown page into the same sortable table, in place. |
| `src/lib/parse.js` | Shared: breakdown parsing, dates, round and category ordering, name folding, URL vetting. |
| `src/lib/render.js` | Shared: the sortable table, summary strip, filters, CSV export. |
| `src/target-*.js` | One line per build, naming which page the injected link opens. |

### Name resolution

live-tennis.eu renders player names as plain text with no id, so the name has to
be matched against tennistonic.com's player index. The extension posts the name
to their own public player-lookup address and caches the resulting id locally.

Two details that matter: that lookup only matches ASCII, so names are
diacritic-folded first (`Karolína Muchová` → `Karolina Muchova`), and some
players are indexed under a surname alone, so the lookup falls back from full
name to surname to first name. Genuinely ambiguous names prompt you to choose.

### Notes for anyone reading the parsing code

Two things in the source data are easy to get wrong:

- **Expiry dates repeat inside nested spans**, so a cell reads
  `25-May-2625-May2026` and the two-digit year runs straight into the repeated
  day. A greedy year match silently yields the year **2625**. Dates are read
  from the descendant element holding exactly one date, with ordered fallbacks.
- **The source's own "Total Point" row is commented out** in their markup, so
  the total is computed from the counting rows. It matches the figure they'd
  have shown.

## Data, and where it comes from

All ranking data belongs to [live-tennis.eu](https://live-tennis.eu) and
[tennistonic.com](https://tennistonic.com). This project is independent and not
affiliated with or endorsed by either.

Nothing here circumvents any access control: every request happens in your own
browser, as a normal visit. The published build sends traffic *to* the source
site rather than reproducing it.

Privacy policy: [PRIVACY.md](PRIVACY.md) — short version, it collects nothing
about you.

## Limitations

- The data is only as good as the source. This presents it; it doesn't recompute
  points from match results.
- It depends on both sites' current page structure. If either changes, parsing
  or linking breaks — visibly, not silently.
- Players with no entry at the source can't be resolved.

## Development

```sh
./build.sh                  # assemble dist/public and dist/full, package the public zip
python3 tools/make-icons.py # regenerate icons and the store promo tile
```

Store listing copy, permission justifications and the submission checklist live
in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).
