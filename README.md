# CueCraft

CueCraft is an independent browser/PWA for DJ practice and a local touchscreen controller. It works on phones, tablets, Surface devices, and desktop browsers. It is not part of **ZERO 2 HERO**, does not require an account, and does not contain MIDI mappings, audio routing, or DJ-software internals.

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
node --test test/protocol.test.mjs
node --check app.js
```

## Current limitation

CueCraft provides the browser client and documented protocol only. It cannot itself control RekordBridge, Rekordbox, a physical controller, or audio. Those responsibilities remain in a separately installed local bridge.
