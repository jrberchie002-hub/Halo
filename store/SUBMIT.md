# Getting Halo into the stores

Do this once you own the domain. Replace YOURDOMAIN everywhere (grep -r YOURDOMAIN public store).

## 0. Domain
Point it at the Vercel project, set https://YOURDOMAIN as the main address. Set a real support@ mailbox.
Check https://YOURDOMAIN/privacy.html, /terms.html, /support.html and /manifest.webmanifest load.

## 1. Google Play (Android, $25 once)
1. Create a Play developer account. Personal accounts made after Nov 2023 need 12 testers for 14 days of closed testing before production.
2. On a computer with Node + Java: `npm i -g @bubblewrap/cli` then `cd store && bubblewrap init --manifest=https://YOURDOMAIN/manifest.webmanifest` (twa-manifest.json here is a ready template), then `bubblewrap build`. Or use https://pwabuilder.com with the domain.
3. Keep halo.keystore safe (losing it blocks updates). Copy the SHA-256 fingerprint (Play Console > App integrity if using Play signing) into public/.well-known/assetlinks.json, deploy, so the app opens without a browser bar.
4. Upload the .aab, fill the listing from LISTING.md (data safety answers included), add privacy URL, content rating, submit.

## 2. Apple App Store (iOS, $99/yr)
Apple needs a Mac with Xcode and rejects thin web wrappers (guideline 4.2). Plan:
1. `npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/push-notifications @capacitor/camera`, `npx cap init` (use store/capacitor.config.json), `npx cap add ios`.
2. Add native features so it is more than a website: push notifications, camera/mic via native permissions, share sheet.
3. Enrol in the Apple Developer Program (needs D-U-N-S for an organisation, can take weeks; individual is quicker).
4. Archive in Xcode, upload to App Store Connect, add listing, privacy labels, screenshots, review notes (LISTING.md), submit.

## Already done in the app
Block, Report, in-app account deletion, Privacy/Terms/Support pages linked from Settings and the welcome screen, richer manifest, assetlinks template.
