# CueCraft

CueCraft is an independent browser/PWA for DJ practice and a local touchscreen controller. It works on phones, tablets, Surface devices, and desktop browsers. ZERO 2 HERO is the main progression product; CueCraft is its DJ-focused spinoff. Local use requires no account.

## Set Planner + Transition Lab

Open **Set Planner + Transition Lab** from Home. Add local audio (supported MP3/WAV/etc.) or try two generated practice beats. Audio is stored in this browser's IndexedDB; plan metadata and recipes are stored locally. Browser storage can be cleared or evicted, so keep your source audio and use **Export plan** for a JSON backup of metadata (audio is not included). Only the two songs in the open transition are decoded in memory (about 80–100 MB for a pair of 4–5 minute songs); other songs stay as compressed files until you preview them, so the first preview of a new pair takes a second or two to load. **Import plan** restores it; on another device, add the same audio files again and CueCraft reconnects them to their songs by file name, keeping IN/OUT points.

Name your set, choose a target duration, enter BPM/key and optional sections, reorder songs, and move IN/OUT sliders anywhere within the audio. No minimum play percentage is enforced. Grids are estimates from manually entered BPM, anchored at 0:00; they are not detected beat grids.

Open the transition between adjacent songs. Select overlap bars, volume behavior, center/gradual bass swap, and an outgoing high-pass or low-pass filter. **Hear it** previews the actual selected audio with Web Audio gain/EQ/filter automation; Stop interrupts playback. Optional tempo matching changes incoming playback rate and pitch; it does not perform analysis, phase alignment, or pitch-preserving time stretch. Set duration is an estimate from selected sections minus overlap, without tempo adjustment.

Save recipes with IN/OUT snapshots, settings, explanations, and practice status. **What just happened?** explains the chosen automation, and the manual steps describe how to attempt it on DJ gear. Instructions are generic, not a tested controller-specific walkthrough.

**Mystery Transition** uses generated practice beats for fade, bass swap, filter, and hard-cut questions. You can replay and receive teaching feedback after guessing. Multi-technique questions, Rebuild It scoring, cue/loop planning, and device-specific walkthroughs are future extensions.

The lab previews audio locally; controller mode still only sends commands. Offline use requires visiting once over HTTPS or localhost so the service worker can download the app. Audio saved to this browser can then be used offline. LAN HTTP is suitable for local controls but does not enable service-worker installation on most mobile browsers.

## What works now

- Downloadable/offline lesson cards and private device-local practice progress.
- Touchscreen controls for Deck 1/2 play, cue, tempo, jog, and crossfader.
- Local WebSocket session pairing by a temporary short code. A bridge can place the address and code in a QR URL, for example: `https://host/cuecraft/?bridge=ws%3A%2F%2F192.168.1.20%3A8765%2Fcuecraft&code=ABC123`.
- Updated RekordBridge Windows source renders a local QR and fallback link, serving only CueCraft app assets over LAN HTTP. This avoids an HTTPS-to-plain-WebSocket mismatch for local control, but does not enable phone PWA installation/offline caching. Actual phone scanning and firewall reachability still require device verification.
- Coalesced high-frequency tempo, jog, and crossfader updates, connection/latency feedback, automatic reconnect, and immediate visual hold-state clearing on disconnect.
- Controller screen lock, which prevents page scrolling, text selection, zoom gestures, and accidental navigation while retaining the controls. Unlock restores normal use.
- An optional `cuecraft:progress` browser event for a user-selected sync service. It is not connected to ZERO 2 HERO and is never required for local practice.

Channel 1/2 volume and Master cue are on-screen rehearsal controls only; they are not sent to the bridge.

## Bridge contract

CueCraft only talks to a local WebSocket bridge. The bridge owns pairing codes/QR creation, authorization, mappings, and the final MIDI or DJ-software action. CueCraft identifies itself as `CueCraft touchscreen controller`, so a bridge can distinguish it from physical hardware.

Client hello:

```json
{"v":1,"kind":"cuecraft.hello","client":{"id":"cuecraft-...","name":"CueCraft touchscreen controller","surface":"touchscreen"},"session":"ABC123","capabilities":["deck.play","deck.cue","deck.tempo","deck.jog","mixer.crossfader"]}
```

Command messages have `kind: "cuecraft.command"`, a monotonic `seq`, and one of these normalized commands:

- `deck1.play`, `deck2.play`, `deck1.cue`, `deck2.cue`, `deck1.headphoneCue`, `deck2.headphoneCue` with `phase: "press" | "release"` (one press and one release per touch; headphone cue is separate from transport CUE)
- `deck1.tempo`, `deck2.tempo`, `mixer.crossfader` with `value: -1..1`
- `deck1.jog`, `deck2.jog` with relative `value: -1..1`

CueCraft sends no commands until it receives `cuecraft.welcome`. When the user disconnects or the app is hidden, CueCraft sends `release` for any held button before closing the socket; after an unexpected drop it reconnects with backoff (up to 5 s). The bridge should send `cuecraft.welcome` after accepting a session, echo `cuecraft.ping` as `cuecraft.pong`, and send `cuecraft.error` for invalid sessions. The bridge must safely release any downstream held actions when a client disconnects.

## Run locally

Serve this directory from a web server; service workers/PWA installation do not work from `file://` URLs.

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080`. A real local bridge is still required to pair controls; CueCraft deliberately does not ship one.

## Validate

```powershell
node --test test/*.test.mjs
node --check app.js
```

## Current limitation

CueCraft provides the browser client; the adjacent RekordBridge development source now accepts its v1 messages and forwards approved commands to an existing DDJ-SX MIDI output. Real loopback WebSockets, the actual JavaScript protocol, captured MIDI messages, authorization, and disconnect releases are covered by automated tests. This is not proof of real Rekordbox response, physical jog feel, phone installation, or audible transition quality. Old packaged RekordBridge releases do not automatically contain these source changes.

After the first one-time code claim, the host supplies a random resume secret. CueCraft keeps it only in the current page session and uses it for reconnection; a second device cannot take over just by replaying the code or client ID. A full page reload requires a new pairing session. Pairing uses unencrypted local WebSockets: use only trusted Wi-Fi, do not expose its port to the internet, and do not reuse account credentials. Hosted HTTPS pages may block a `ws://` connection; localhost desktop testing avoids that mismatch, while secure mobile pairing remains to be validated.

Progress remains device-local. The optional progress hook does not award NIM or synchronize to ZERO 2 HERO. That needs the main product's authenticated integration and reward rules, not a simulated success.
