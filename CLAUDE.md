# Standing rules from Jay (read before every change)

1. **Screens must be locked.** No page may move sideways, rubber-band or shake. Every release: run `node test/hmlock.js` (Halo Music) and check Halo chat views for horizontal overflow. Nothing ships if it fails. Jay has had to report this several times.
2. **Keep it small and slim.** Small buttons, no extra borders, no chunky pills, no big full-screen takeovers (the player is a half sheet).
3. **Halo must look and feel like Halo, not like WhatsApp/Spotify/Snapchat.** The halo ring and purple are the signature. Calls must be recognisable as Halo calls.
4. **Search is a button, not a page tab.** Search opens from the top bar button.
5. **Wrapped lives under listening stats (My Halo)** and pops up weekly with an animation.
6. **No emoji in UI chrome** (reactions excepted). No popups with long text.
7. Version bump every release: public/app.js `CODE` and lib/app.js `code`; Halo Music `VER` in music.js plus version.txt (the app auto-updates when they differ), and the SW cache name.
8. Both Halo Music copies must stay in sync (standalone repo and halo/public/music with path transforms).
9. Halo chat scale: type 12/14/16, radius 12/16, spacing 8/12/16. Accent is Halo purple (#7b5cff). Run `node test/chatlock.js` too.
10. **Vercel deploy limit.** The free plan refuses builds after too many pushes in a day ("Deployment rate limited, retry in 24 hours"). Batch work into few commits, push once per round, then check `gh api repos/jrberchie002-hub/<repo>/commits/HEAD/status` to confirm "Deployment has completed" before telling Jay it is live. Never claim live without that check.

11. **Credit Jay.** Every commit and PR message that carries a "Co-Authored-By" line for Claude must also carry "Authored-By: BERCHY" right beside it. Jay is acknowledged every time Claude is.
