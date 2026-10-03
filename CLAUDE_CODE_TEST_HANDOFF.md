# CueCraft test handoff for Claude Code

## Workspace

`C:\Users\onnah\Documents\ChatGPT\RekordBridge\zero-to-hero`

## Music files

Use the existing files in:

`C:\Users\onnah\Desktop\yout shot music`

Do not copy the music into the repository. In CueCraft, use **Add your audio** and select the files from that folder. Imported audio remains on the current browser device by design.

## Run the app

From the CueCraft folder:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765` on the project PC. Port `8764` is already occupied by another local process, so do not use it for this CueCraft test run.

## Automated checks

```powershell
pnpm test
pnpm run check
```

Current result: 13 tests pass and all checked JavaScript files parse.

## Fixed since the previous Grok report

- Tempo and crossfader range inputs now emit normalized continuous commands.
- Headphone-cue buttons use `deck1.headphoneCue` / `deck2.headphoneCue`, not transport CUE.
- The Set Planner has validated JSON **Import plan** as well as Export plan.

## Test now

1. Add at least two music files from the folder above.
2. Enter BPM and choose IN/OUT sections in the Set Planner.
3. Export a plan, clear or reload the page, then import it. Confirm tracks, transitions, and recipes return. Re-add audio files only if preview audio is needed.
4. Use the touchscreen controller with a mock WebSocket bridge first. Verify Play, transport Cue, both headphone-cue buttons, both tempo sliders, jog movement, and crossfader.
5. Verify a continuous slider sends values in `-1..1` and does not send repeated stale values after the pointer stops.
6. Verify a button emits press and release.
7. Verify disconnect clears held visual state.

## Do not claim as complete yet

- Live CueCraft-to-RekordBridge compatibility is not verified. CueCraft uses the `cuecraft.*` protocol; the Windows host adapter must translate it to RekordBridge's normalized command gateway.
- Rekordbox virtual MIDI visibility and physical-controller behavior require a real Rekordbox and hardware session.
- Do not claim audio routing changes. CueCraft only supplies control commands and local audio previews.
