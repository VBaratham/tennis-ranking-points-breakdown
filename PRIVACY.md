# Privacy Policy — Tennis Ranking Points Breakdown

Last updated: 26 October 2026

## Summary

This extension collects nothing about you. There is no account, no analytics, no
tracking, and no server operated by this extension. Nothing you do is reported
anywhere.

## What data is stored

One thing, and only on your own computer: a lookup table matching a player's
name to that player's numeric id on tennistonic.com, with the date it was saved.

For example: `Elena Rybakina → 36558`.

It exists so that clicking the same player twice doesn't repeat the same lookup.
Entries expire after 30 days. Nothing else is stored — no browsing history, no
page contents, no personal information.

This data is kept in your browser's local extension storage. It is not synced to
any other device and is never transmitted anywhere.

## What leaves your browser

When you click a player's name on live-tennis.eu, the extension sends that
player's name — for example `Elena Rybakina` — to tennistonic.com's public
player-lookup address, which is the same lookup their own site search uses. It
does this to find the right page for that player, and then your browser opens
that page.

That is the only request the extension makes. It sends the player's name and
nothing else. No information about you, your browsing, or the other pages you
visit is included.

Because the request goes to tennistonic.com, your browser attaches whatever
cookies it already has for tennistonic.com, exactly as it would if you typed
their address yourself. The extension does not read, store, or forward those
cookies.

## Third-party sites

The extension sends you to tennistonic.com, which is an independent website with
its own privacy and cookie policy: <https://tennistonic.com/about-us/>

Once you are on their site, their policies apply, not this one. This extension
is not affiliated with, endorsed by, or operated by tennistonic.com or
live-tennis.eu.

## Data sharing

No data is shared with anyone. No data is sold. No data is used for advertising,
profiling, credit assessment, or any purpose beyond opening the player page you
asked for.

## Deleting your data

Removing the extension deletes its stored lookup table. You can also clear it at
any time from `chrome://extensions` by removing and re-adding the extension.
Entries older than 30 days are discarded automatically.

## About the unpublished "full" build

The source repository also contains a second, unpublished build used privately
by the author. That build additionally downloads a player's public breakdown
page in order to display it as one sortable table. It is not distributed on the
Chrome Web Store, and this policy describes the published extension. The full
build likewise collects nothing about you and sends nothing to any third party
beyond the requests to tennistonic.com described above.

## Changes

If these practices ever change, this document will be updated and the version
published to the Chrome Web Store will be updated alongside it. The "last
updated" date above always reflects the current policy.

## Contact

Questions about this policy: open an issue at
<https://github.com/VBaratham/tennis-ranking-points-breakdown/issues>
