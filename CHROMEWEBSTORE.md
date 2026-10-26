# Chrome Web Store Listing — Tennis Ranking Points Breakdown

> Last Updated: 2026-10-26
> Package: `dist/tennis-ranking-points-breakdown-v1.0.0.zip` (built by `./build.sh`)

This file is the source of truth for the store submission. It is **not** shipped
in the package. Copy each field into the Developer Dashboard at submission time.

---

## Store Listing

**Extension Name** [REQUIRED]

Tennis Ranking Points Breakdown

**Short Description** [REQUIRED] *(126 / 132 characters)*

Adds a link from every player name on live-tennis.eu straight to that player's ranking points breakdown on tennistonic.com.

**Detailed Description** [REQUIRED]

```
See where any tennis player's ranking points actually come from, in one click.

The live ranking tables at live-tennis.eu show you a player's points total, but not
which tournaments those points came from or when each one expires. This extension
turns every player name on those tables into a link, so one click takes you straight
to that player's full points breakdown on tennistonic.com — the right player, the
right page, no searching.

It works on the WTA and ATP live ranking pages, and handles names with accents and
players listed under a surname alone. If a name genuinely matches more than one
player, you're asked which one you meant.

How to use it: open a live ranking page at live-tennis.eu and click any player's
name. That's the whole thing. There are no settings, no popup, and no account.

Privacy: this extension collects nothing about you. It has no analytics and no
server. The only thing it stores is a local note of which player page matches which
name, so repeat clicks skip the lookup, and that expires after 30 days. The only
request it makes is looking up the player you clicked.

This extension is an independent project. It is not affiliated with, endorsed by, or
operated by live-tennis.eu or tennistonic.com, and all ranking data belongs to those
sites. Source code: https://github.com/VBaratham/tennis-ranking-points-breakdown
```

**Category** [REQUIRED]

Sports

**Single Purpose** [REQUIRED]

Adds a link from each player name on live-tennis.eu to that player's ranking
points breakdown page on tennistonic.com.

**Primary Language** [REQUIRED]

English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `store-assets/store-icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Ready | `store-assets/screenshot-1-ranking-links.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ✅ Ready | `store-assets/screenshot-2-linked-names-zoom.png` |
| Screenshot 3 (optional — see note) | 1280×800 | 🟡 Your call | `store-assets/screenshot-3-destination-optional.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ✅ Ready | `store-assets/promo-tile-440x280.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | — |

### Screenshot Notes

1. **`screenshot-1-ranking-links.png`** — the WTA live ranking table with every
   player name turned into a link. Shows the feature in its real context.
2. **`screenshot-2-linked-names-zoom.png`** — the same table magnified so the
   underlined, clickable names are unmistakable. This is the clearest
   demonstration of what the extension adds.
3. **`screenshot-3-destination-optional.png`** — the tennistonic.com page a
   click lands on. **Decide before uploading:** it shows another company's
   branding and page design. Including it is informative and arguably fair, but
   omitting it removes any trademark question. The listing text already explains
   where clicks go, so the submission is complete without it.

All screenshots are real captures of the published build, not mockups.

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves which tennistonic.com player page matches which player name, so clicking the same player again skips the lookup. Stores only name-to-id pairs and a timestamp, expiring after 30 days. No user data is stored. |
| `https://tennistonic.com/*` | host_permissions | live-tennis.eu lists players by name only, while tennistonic.com addresses players by numeric id. The extension sends the clicked player's name to tennistonic.com's own public player-lookup address to find the matching page, then opens it. This is the only network request the extension makes. |
| `https://live-tennis.eu/*` | content_scripts | The extension's entire function is to turn each player name on live-tennis.eu's ranking tables into a link. It reads the player names already displayed on the page and adds a link to each; it changes nothing else. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** **No**

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No | No | — | No |

**Note for the disclosure form:** the extension transmits the *name of the tennis
player you clicked* to tennistonic.com in order to find that player's page. This
is not user data — it is the subject of the request, equivalent to typing that
player's name into a site's search box. No information about the user is sent.

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL** [REQUIRED]

https://github.com/VBaratham/tennis-ranking-points-breakdown/blob/main/PRIVACY.md

---

## Distribution

**Visibility**: *Decide at submission* — Public or Unlisted
**Regions**: All regions

---

## Developer Info

**Publisher Name** [REQUIRED]
VBaratham

**Contact Email** [REQUIRED]
*TBD — a dedicated address for this project.*

> Fill this in at submission time; don't commit it here. Whatever address you
> use is displayed publicly on the store listing, and this file lives in a
> public repository, so a project-specific alias is worth the two minutes.

**Support URL** [RECOMMENDED]
https://github.com/VBaratham/tennis-ranking-points-breakdown/issues

**Homepage URL** [RECOMMENDED]
https://github.com/VBaratham/tennis-ranking-points-breakdown

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-10-26 | First submission. Links player names on live-tennis.eu to their points breakdown on tennistonic.com. | Draft |

---

## Review Notes

### Known Issues / Limitations

- **Depends on two third-party sites.** If live-tennis.eu changes how its ranking
  tables are built, the links stop appearing; if tennistonic.com changes its
  lookup address, the links stop resolving. Neither breaks the browser or leaves
  anything behind — the extension simply does nothing.
- **Players missing from tennistonic.com** cannot be resolved. The extension says
  so plainly and offers their rankings page instead.
- **One-time account setup**: publishing requires a Chrome Web Store developer
  account and its one-off registration fee.

### Third-party content position

The published build copies no content from tennistonic.com. It reads the player
names already on screen at live-tennis.eu, performs a single lookup, and sends
the user to tennistonic.com's own page — their layout, their session, their ads,
untouched. Traffic flows to them, not away from them.

Checked before submission: tennistonic.com publishes no terms of use (only a
privacy and cookie policy), and their `robots.txt` does not restrict the player
pages for ordinary browsers. Their bot protection is never circumvented; every
request happens in the user's own browser, as a normal visit.

The extension name, icon, and listing avoid both sites' trademarks, and the
listing credits them explicitly.

### Pre-Publish Checklist

- [x] `manifest_version` is 3
- [x] Version 1.0.0, not previously published
- [x] Manifest `name` matches this document exactly
- [x] Manifest description is 122 chars (≤132)
- [x] Package excludes `.git/`, docs, build tooling, store assets, and the full build
- [x] All icon files referenced in the manifest exist at the correct dimensions
- [x] Minimum permissions; no `<all_urls>`, no `tabs`, no unused permissions
- [x] Every permission justified above
- [x] No remote code — all JavaScript ships in the package
- [x] No obfuscated code
- [x] Data disclosure matches both the code and PRIVACY.md
- [x] Tested in Chrome: a click on live-tennis.eu lands on the correct player page
- [x] Privacy policy URL loads publicly *(verified 2026-10-26, HTTP 200)*
- [ ] Contact email confirmed and monitored
- [ ] Screenshot 3 included or dropped (see Screenshot Notes)

### Rejection History

None yet.
