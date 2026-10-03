# CueCraft + RekordBridge: remaining real-device checks

Use the development source, not an older ZIP. Do not upload songs, credentials, or pairing secrets in your report. Do not test on a live performance set.

## Start on the Windows PC

1. From the RekordBridge folder, run `python -m unittest discover -s . -v`.
2. From its `zero-to-hero` folder, run `pnpm test` and `pnpm run check`.
3. Serve CueCraft from that folder using `python -m http.server 8765 --bind 127.0.0.1` and open `http://127.0.0.1:8765`.
4. Run `python mapper_app.py` in the RekordBridge folder. Select the existing virtual MIDI output. Do not install drivers or alter existing mappings just for this test.
5. Choose **Start CueCraft pairing**. The updated Windows source opens a QR and fallback URL. Scan from a phone on trusted same-network Wi-Fi, or enter the WebSocket address and room code in desktop CueCraft. Expect **Controller paired**. The QR phone flow is implemented but still needs a physical scan test; old packaged builds lack it.
6. Use Rekordbox with practice tracks and the existing matching MIDI mapping. A physical controller is optional. Check its license permits MIDI control.

## Observe the actual result

- Left/right Play and Cue operate only their own deck.
- Headphone Cue changes monitoring, never jumps to transport Cue.
- Tempo center resets to 0%; endpoints and direction agree with the selected Rekordbox pitch range.
- Jog is a temporary rim-style nudge, not automatic BPM matching or scratch control.
- Crossfader moves in the expected direction.
- Hold Cue, then disconnect or stop the host: no held action remains.
- A second device or reused room code cannot take control. An interrupted connection resumes only with its page-session secret. After a page reload, start a new host pairing session.
- Stop leaves no host listener or stuck buttons. Physical and touch input together do not produce duplicate direct-controller mapping events.

## Listen to the Transition Lab

Use two songs from `C:\Users\onnah\Desktop\yout shot music`. Import locally; retain the originals. Try fade, center/gradual bass swap, high/low-pass filters, short/long overlap, tempo preview on/off, Stop, and replay. Report audible clicks, clipping, incorrect sections, or delays. Automated audio scheduling checks are not a substitute for listening.

Export the plan, restore it in a separate browser profile, then re-add the same audio files. Confirm song order, markers, settings, recipes, and filenames reconnect correctly. Never clear the original profile's storage before backing up.

## Phone/Surface and offline installation

Record the device, OS, browser, origin, and app/source version. A normal LAN `http://` origin does not provide mobile service-worker installation, and a hosted HTTPS app may reject the local `ws://` host as mixed content. Record that as a transport blocker, not a successful phone connection. Do not disable browser security or expose a port publicly.

For installation/offline lessons, use a verified HTTPS deployment or localhost on the Surface. Install if offered, visit lesson/Lab screens once, reload offline, and check retained progress and local audio. Verify icons, touch targets, portrait/landscape, screen lock, sleep/wake, and app switching. Treat phone pairing separately from lesson installation.

## Report

For each check: **Pass / Fail / Blocked**, exact steps, expected versus observed result, error text, and a screenshot if useful. Redact codes/secrets. Do not call the build performance-ready based only on automated tests.

Not implemented here: signed installer/updates, built-in virtual MIDI, encrypted mobile transport, authenticated ZERO 2 HERO sync or funded NIM rewards. QR generation and restricted local-page hosting now exist in the Windows development source.
