import test from 'node:test';
import assert from 'node:assert/strict';
import { PreviewAudio } from '../lab-audio.js';
import { defaults } from '../lab-model.js';

test('preview schedules bounded real audio offsets and stop disconnects the graph', async () => {
  const sources = [], filters = [], nodes = [];
  const parameter = () => ({ value: 0, events: [], setValueAtTime(value, at) { this.events.push([value, at]); } });
  const node = () => { const n = { disconnected: false, connect() { return this; }, disconnect() { this.disconnected = true; } }; nodes.push(n); return n; };
  globalThis.AudioContext = class {
    currentTime = 0;
    destination = {};
    async resume() {}
    createGain() { return Object.assign(node(), { gain: parameter() }); }
    createBiquadFilter() { const n = Object.assign(node(), { frequency: parameter(), gain: parameter() }); filters.push(n); return n; }
    createBufferSource() { const n = Object.assign(node(), { playbackRate: parameter(), start(at, offset) { this.offset = offset; this.at = at; }, stop(at) { this.stopAt = at; } }); sources.push(n); return n; }
  };
  const audio = new PreviewAudio();
  const a = { in: 137, out: 141, bpm: 120, buffer: {} }, b = { in: 2, out: 60, bpm: 120, buffer: {} };
  const timing = await audio.preview(a, b, { ...defaults(), eq: 'center', filter: 'highpass' });
  assert.equal(timing.overlap, 4);
  assert.equal(sources[0].offset, 137);
  assert.equal(sources[1].offset, 2);
  assert.equal(filters[1].type, 'highpass');
  assert.equal(filters[0].gain.events.at(-1)[0], -24);
  assert.equal(filters[2].gain.events[0][0], -24);
  audio.stop();
  assert.ok(nodes.every(n => n.disconnected));
  assert.equal(audio.sources.length, 0);
  delete globalThis.AudioContext;
});
