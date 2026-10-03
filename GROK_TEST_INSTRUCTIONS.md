# CueCraft — test instructions for Grok

Please independently test CueCraft’s Set Planner, Transition Lab, and Mystery Transition training. We want to know what actually works, what breaks, and what feels confusing to a beginner. Test the app before proposing fixes. Do not edit code, merge the PR, deploy, change browser permissions, or touch ZERO 2 HERO.

## Build to test

- Product: **CueCraft**, the DJ-focused spinoff of **ZERO 2 HERO**.
- Repository: https://github.com/AvaEdge617/rekordbridge-dj-companion
- Pull request: https://github.com/AvaEdge617/rekordbridge-dj-companion/pull/1
- Branch: `codex/cuecraft-local-controller`
- Feature commit: `4134c85cb453e0ac014c554c38b7cf319ed71440`
- The repository’s older name is intentional for now. The app should display **CueCraft**.
- This feature is on the review branch. Do not assume the deployed site or `main` contains it.

If you cannot open a browser, run the app, upload a local test file, or hear its output, say so. Report those cases as **BLOCKED** or **NOT TESTED**, not PASS. Source inspection and a “Playing” message do not prove the audio sounds correct.

## Start here

Use a separate test browser profile so existing user plans and audio are preserved. No account, wallet, API key, physical DJ controller, or RekordBridge installation is needed to test the training lab.

For a fresh copy:

```powershell
git clone --branch codex/cuecraft-local-controller https://github.com/AvaEdge617/rekordbridge-dj-companion.git cuecraft-grok-test
cd cuecraft-grok-test
git rev-parse HEAD
python -m http.server 8080 --bind 127.0.0.1
```

Open **http://127.0.0.1:8080/** and choose **Set Planner + Transition Lab**. Leave the server running while testing. If port 8080 is occupied, choose another port and record the URL. Opening `index.html` directly as a file is not the supported flow.

A developer preview may also be running at **http://127.0.0.1:8764/** on the developer’s computer. That address will not reach their machine from your computer. Run your own copy if needed.

Start at a comfortable speaker/headphone volume. Do not accept camera or microphone permissions; the lab does not need them.

## 1. Quick working flow

1. Click **Try practice tracks** once.
2. Confirm two generated tracks appear, both at 120 BPM, with a full duration of 32 seconds and selected IN `0:00`, OUT `0:24`.
3. Confirm their waveforms appear and the transition editor opens.
4. The default overlap is 4 bars. At 120 BPM this is 8 seconds, so the set estimate should be **0:40 / 25:00**: `24 + 24 − 8 = 40`.
5. Press **Hear it**. Listen for Song A fading down as Song B rises. Press **Stop** during playback. The audio should stop promptly.
6. Press **Hear it** again. Playback should restart cleanly, without layering an old preview underneath it.
7. Choose **Center bass swap**, then listen again. Compare with the same settings and no bass swap.
8. Save the recipe. Change its practice status to **Learning**.
9. Reload, reopen the lab, and open the saved recipe. Confirm the settings, markers, and practice status survived. Hear it again.

Report the first broken step, if any. Continue with independent checks that still work.

## 2. Set planning and unrestricted markers

- Rename the set and change its target to `1:00`. Confirm those values survive reload.
- Change the first practice track OUT to `0:04`. Type a genuinely new value, then Tab or click away to commit it. The app must accept a four-second excerpt without a “play half the song first” restriction.
- With Track A selected for 4 seconds, Track B for 24 seconds, and the default overlap, the actual overlap should shorten to 4 seconds. Expected set estimate: **0:24**, not a negative value or the result of subtracting the full requested 8 seconds.
- Choose 0 overlap bars. Expected estimate for that pair: **0:28**.
- Try an IN point near the end of a track, a tiny section, equal IN/OUT, OUT before IN, and points outside the file’s duration. Check that the UI stays usable and that invalid physical ranges do not crash playback. Preserving points within the file is acceptable; imposing an arbitrary minimum play duration is not.
- Try malformed time text such as `oops`. Expect a useful response and a usable field, not `NaN` in totals.
- Reorder tracks using **Move up / Move down**. Confirm the order, adjacent transition buttons, names, and totals all update. Reopen the transition and confirm it uses the new pair.
- Edit BPM, key, and section labels. Confirm values survive reload. Check whether section summaries update immediately; report stale or inconsistent totals.
- Click **Export plan**. Inspect the downloaded JSON for the set name, track order, markers, settings, and recipes. Audio is intentionally not included. Importing a JSON plan is not implemented yet.

## 3. Import actual audio — high priority

### Supplied music folder

On the user’s Windows computer, the source folder is `C:\Users\onnah\Desktop\yout shot music\`. Its inventory contains **39 MP3 files and one PNG**. Only import the MP3s as music; the PNG is not audio. Filenames and extensions were inspected, but audio decoding, duration, BPM, key, and musical compatibility have not been verified from this folder.

Start with these files, which match the transition discussed in the training brief:

1. `Mike WiLL Made-It, Miley Cyrus, Wiz Khalifa - 23 .mp3`
2. `Megan Thee Stallion, Beyoncé - Savage Remix (feat. Beyoncé) (SPOTISAVER) (1).mp3`
3. Optional third track for reordering: `jhonniedamnd - Murda Bend .mp3`

Use **23 → Savage Remix** as an experiment, not a claim that the pair is already beatmatched. Choose your own IN/OUT markers and record them. Compare fade, center bass swap, and high-pass with the same markers. Test a four-second selection separately.

The folder also has similarly named versions of **Peru - Remix** and **Party Nice**. Treat them as separate input files unless their contents are verified; matching names or file sizes alone do not establish that audio is identical.

If you are running Grok elsewhere, this Windows path is only a location reference. Use the actual song attachments provided with the handoff; do not claim you accessed this folder remotely.

The user will include song files with this handoff. Use those attached songs for the real-audio tests, preserving the original files. Record the filenames, formats, and measured durations. If fewer than two songs are accessible, complete the one-file import check and use generated practice beats for pair testing; mark the attached-song pair test BLOCKED.

This has not yet passed an independent browser import test. Import the supplied MP3/WAV files into the local CueCraft browser. CueCraft should not send the audio to an external service. Do not redistribute the supplied songs or include full audio in the public bug report.

If BPM/key or desired transition points are provided alongside the files, use them. Otherwise enter BPM manually if known and mark unknown values as unknown; do not invent accurate musical analysis. Test both a musical section and a four-second excerpt from the supplied songs. Compare at least a fade, center bass swap, and high-pass filter with all other settings held constant.

Optional test fixture:

```powershell
node test/create-audio-fixture.mjs
```

The command prints the path of an eight-second WAV file it creates in the system temp directory. It contains a simple tone and is useful for import/persistence testing, not musical transition quality.

1. Choose **Add your audio**, then select one file. Repeat with another, or test selecting multiple files at once.
2. Confirm each track appears with the correct duration and a waveform.
3. Enter BPM manually. Set IN/OUT within each file. Open the transition and listen.
4. Reload and try playback again. Audio and waveform data should remain available in the same browser profile and origin.
5. Test a corrupt/unsupported file. Expect a helpful error and continued use of valid tracks.
6. Cancel the file chooser. Expect no crash or false success.
7. If possible, import a long track and a filename containing quotes or `< >` characters. Report hangs, unreadable layouts, or text interpreted as markup.

If your automation environment blocks local files, record the exact blocker and ask for manual verification. Do not change extension or browser permissions on someone’s behalf.

## 4. Transition sound and explanations

Change one setting at a time so the comparison is meaningful. Use practice beats for consistency, then actual songs if import works.

| Setting | What to listen/look for |
|---|---|
| Fade | A’s volume falls as B’s rises. |
| Overlap | Both remain audible through the overlap; A leaves at the end. |
| Quick cut | The volumes switch abruptly at the middle of the preview region. Check whether the explanation and OUT timing describe this honestly. |
| Center bass swap | B’s bass starts reduced; at the midpoint A’s bass is reduced while B’s returns. |
| Gradual bass swap | The bass handoff happens gradually instead of at one instant. |
| High-pass | The outgoing song loses low-frequency energy and sounds thinner. |
| Low-pass | The outgoing song loses high-frequency detail and sounds darker. |
| Tempo match | Incoming playback speed follows the entered BPM ratio; pitch changes too. |

Check that **What just happened?**, the control-change graph, and **Try it on your controller** agree with the actual sound. Flag misleading explanations even if playback technically works.

Also test:

- Large BPM difference, for example 140 → 168. A difficulty warning should not block preview.
- Missing/zero BPM. There must be no crash or promise of accurate automatic beat analysis.
- Fractional overlap bars and an overlap longer than the selected audio.
- Change a setting while playing, Stop while audio is loading, press Hear it repeatedly, switch transition pairs, and leave the lab during playback. Look for overlapping audio, delayed unexpected playback, or sound continuing after Stop.

Tempo assistance is only for auditioning the recipe. Manual practice still teaches beatmatching by ear. Automatic BPM/key detection, accurate beat-grid detection, phase alignment, and pitch-preserving time stretching are outside this version.

## 5. Saved recipes

Save a recipe with distinctive markers, bass/filter settings, and overlap length. Change the current markers and settings, then choose **Open recipe**. Expect the saved snapshot to be restored.

Check all four practice statuses: **Not practiced**, **Learning**, **Can do**, **Performance ready**. Reload and confirm persistence.

Using only disposable test data, remove one recipe’s track and then open that recipe. Expect an understandable message rather than a crash. Delete a disposable recipe and confirm it stays deleted after reload.

## 6. Mystery Transition ear training

1. Choose **New mystery · Hear it**. Listen before selecting an answer; do not inspect code/state to discover it.
2. Confirm the recipe and reveal graph are hidden before the guess.
3. Choose Fade, Bass swap, Filter, or Hard cut.
4. Confirm the app reveals the answer, explains what to listen for, and shows a matching control-change graph.
5. Replay the same mystery. It should sound like the same example, not silently choose a new one.
6. Try a wrong answer. Expect teaching feedback and replay access.
7. Choose a new mystery. The previous reveal should disappear.
8. Repeat several times and report whether the techniques are distinguishable by ear. Do not require every technique to appear in a fixed number of random attempts.

Multi-technique questions, quiz progress levels, Rebuild It scoring, loops/effects, hot/memory cue planning, and controller-specific walkthroughs are future features. Do not report their absence as a broken implemented feature.

## 7. Offline, responsive layout, and accessibility

- First load the app over localhost or HTTPS and allow its service worker to finish installing. Then disconnect network access in the test environment or stop your own local server, reload, and try lessons, saved recipes, practice sounds, and previously imported audio.
- Confirm any offline claim with a real offline reload. LAN HTTP usually does not support service-worker installation on mobile browsers; do not confuse this with localhost/HTTPS behavior.
- Test desktop, a narrow phone viewport, and tablet/Surface if available. Look for offscreen controls, cramped fields, graphs that cannot be understood, and text that becomes too small.
- Navigate with Tab and keyboard controls. Check labels, focus visibility, and whether a beginner can tell which song is A or B.
- Ask whether “remove bass / high-pass” and “remove highs / low-pass” are understandable without DJ vocabulary.
- Do not assume a valid manifest means the PWA is installable. Test installation if offered; record unavailable installation separately.
- Audio is browser-local and may be evicted if browser storage is cleared. Do not clear someone’s real storage to test this.

## 8. Existing lessons and controller regression

Open **Practice basics**, start/pause a timer, complete a practice, and reload. Confirm progress remains on this device and the lab changes did not break the original lessons.

Physical controller integration requires a separately running WebSocket bridge. If none is available, mark bridge tests BLOCKED and finish the lab tests anyway. The training lab should stay useful without it.

If a compatible test bridge is available, check temporary-code pairing, CueCraft device identity, press/release commands, slider/jog updates, disconnect clearing, and reconnect behavior. Channel faders, headphone/master cue behavior, and screen-lock usability also need independent checks; do not assume every visible control is wired just because the page renders it.

Screen lock should keep the active DJ controls reachable while preventing accidental scrolling/navigation; unlock should restore normal use. Record cases where lock traps the user or hides controls.

Do not award XP, send NIM, claim a wallet connected, or claim progress was uploaded. This build has a generic optional progress hook; an actual sync service is not connected.

## 9. Code checks, if you have terminal access

From the CueCraft directory:

```powershell
node --test test/*.test.mjs
```

At the feature commit, 13 tests passed on the developer’s machine. Run them independently and record your result. JavaScript syntax can also be checked with `npm run check` if npm is installed, or `node --check` on each app/lab/protocol/service-worker module.

Passing unit tests do not replace audio, import, persistence, and UI tests. Test only CueCraft; the unrelated ZERO 2 HERO application has a different test setup.

## Return this report

Start with a verdict: **Ready for beginner testing**, **Ready with issues**, or **Not ready**, and explain why.

Include:

- Exact commit, URL, browser/OS, device or viewport, and whether you could hear audio.
- A table of test areas with **PASS / FAIL / BLOCKED / NOT TESTED** and brief evidence.
- Bugs ranked by impact: critical data loss/security issue; high broken core flow; medium incorrect/confusing behavior; low cosmetic issue.
- For each bug: title, exact steps, expected result, actual result, screenshot or recording if available, relevant console error, and whether it reproduces.
- Any disagreement between the displayed explanation, graph, timing, and audible result.
- Remaining checks someone needs to do manually.
- The three most useful improvements for a beginner, kept separate from bugs.

Be candid. Do not invent test results, hide blockers, or treat a known limitation as proof that everything else works. Send the report back to the user so the CueCraft development chat can work through it.
