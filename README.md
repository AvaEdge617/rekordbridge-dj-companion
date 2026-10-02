# CueCraft

CueCraft is an independent browser/PWA for DJ practice and a local touchscreen controller. It works on phones, tablets, Surface devices, and desktop browsers. ZERO 2 HERO is the main progression product; CueCraft is its DJ-focused spinoff. Local use requires no account.

## Set Planner + Transition Lab

Open **Set Planner + Transition Lab** from Home. Add local audio (supported MP3/WAV/etc.) or try two generated practice beats. Audio is stored in this browser's IndexedDB; plan metadata and recipes are stored locally. Browser storage can be cleared or evicted, so keep your source audio and use **Export plan** for a JSON backup of metadata (audio is not included).

Name your set, choose a target duration, enter BPM/key and optional sections, reorder songs, and move IN/OUT sliders anywhere within the audio. No minimum play percentage is enforced. Grids are estimates from manually entered BPM, anchored at 0:00; they are not detected beat grids.

Open the transition between adjacent songs. Select overlap bars, volume behavior, center/gradual bass swap, and an outgoing high-pass or low-pass filter. **Hear it** previews the actual selected audio with Web Audio gain/EQ/filter automation; Stop interrupts playback. Optional tempo matching changes incoming playback rate and pitch; it does not perform analysis, phase alignment, or pitch-preserving time stretch. Set duration is an estimate from selected sections minus overlap, without tempo adjustment.

Save recipes with IN/OUT snapshots, settings, explanations, and practice status. **What just happened?** explains the chosen automation, and the manual steps describe how to attempt it on DJ gear. Instructions are generic, not a tested controller-specific walkthrough.

**Mystery Transition** uses generated practice beats for fade, bass swap, filter, and hard-cut questions. You can replay and receive teaching feedback after guessing. Multi-technique questions, Rebuild It scoring, cue/loop planning, and device-specific walkthroughs are future extensions.

The lab previews audio locally; controller mode still only sends commands. Offline use requires visiting once over HTTPS or localhost so the service worker can download the app. Audio saved to this browser can then be used offline. LAN HTTP is suitable for local controls but does not enable service-worker installation on most mobile browsers.

## What works now

- Downloadable/offline lesson cards and private device-local practice progress.
- Touchscreen controls for Deck 1/2 play, cue, tempo, jog, and crossfader.
- Local WebSocket session pairing by a temporary short code. A bridge can place the address and code in a QR URL, for example: `https://host/cuecraft/?bridge=ws%3A%2F%2F192.168.1.20%3A8765%2Fcuecraft&code=ABC123`.
- Coalesced high-frequency tempo, jog, and crossfader updates, connection/latency feedback, automatic reconnect, and immediate visual hold-state clearing on disconnect.
- Controller screen lock, which prevents page scrolling, text selection, zoom gestures, and accidental navigation while retaining the controls. Unlock restores normal use.
- An optional `cuecraft:progress` browser event for a user-selected sync service. It is not connected to ZERO 2 HERO and is never required for local practice.

## Bridge contract

CueCraft only talks to a local WebSocket bridge. The bridge owns pairing codes/QR creation, authorization, mappings, and the final MIDI or DJ-software action. CueCraft identifies itself as `CueCraft touchscreen controller`, so a bridge can distinguish it from physical hardware.

Client hello:

```json
{"v":1,"kind":"cuecraft.hello","client":{"id":"cuecraft-...","name":"CueCraft touchscreen controller","surface":"touchscreen"},"session":"ABC123","capabilities":["deck.play","deck.cue","deck.tempo","deck.jog","mixer.crossfader"]}
```

Command messages have `kind: "cuecraft.command"`, a monotonic `seq`, and one of these normalized commands:

- `deck1.play`, `deck2.play`, `deck1.cue`, `deck2.cue` with `phase: "press" | "release"`
- `deck1.tempo`, `deck2.tempo`, `mixer.crossfader` with `value: -1..1`
- `deck1.jog`, `deck2.jog` with relative `value: -1..1`

The bridge should send `cuecraft.welcome` after accepting a session, echo `cuecraft.ping` as `cuecraft.pong`, and send `cuecraft.error` for invalid sessions. The bridge must safely release any downstream held actions when a client disconnects.

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

CueCraft provides the browser client and documented protocol only. It cannot itself control RekordBridge, Rekordbox, a physical controller, or audio. Those responsibilities remain in a separately installed local bridge.
