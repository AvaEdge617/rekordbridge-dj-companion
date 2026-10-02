export const defaults = () => ({ bars: 4, volume: 'fade', eq: 'none', filter: 'none', beatmatch: false });
export function seconds(text) {
  const parts = String(text).trim().split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n) || n < 0) || parts.length > 3) return NaN;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
export function time(value) {
  const n = Math.max(0, Math.round(value || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
export function range(track) { return Math.max(0, track.out - track.in); }
export function timing(a, b, settings) {
  const rate = settings.beatmatch && a.bpm > 0 && b.bpm > 0 ? a.bpm / b.bpm : 1;
  const requested = Math.max(0, Number(settings.bars) || 0) * 240 / (a.bpm || 120);
  const overlap = Math.min(requested, range(a), range(b) / rate);
  return { rate, requested, overlap, duration: overlap + Math.min(5, Math.max(0, range(b) / rate - overlap)) };
}
export function setDuration(tracks, transitions) {
  return Math.max(0, tracks.reduce((sum, track) => sum + range(track), 0) - tracks.slice(0, -1).reduce((sum, a, i) => sum + timing(a, tracks[i + 1], transitions[`${a.id}:${tracks[i + 1].id}`] || defaults()).overlap, 0));
}
export function describe(a, b, settings) {
  const t = timing(a, b, settings);
  return [
    `${a.name} leaves at ${time(a.out)}. ${b.name} enters at ${time(b.in)}.`,
    `Both songs play together for ${t.overlap.toFixed(1)} seconds (${settings.bars} bars requested).`,
    settings.volume === 'cut' ? 'Song A stops at the handoff; Song B takes over immediately.' : settings.volume === 'overlap' ? 'Both channel volumes remain up during the overlap; Song A stops at its OUT point.' : 'Song A gradually gets quieter as Song B gets louder.',
    settings.eq === 'center' ? 'Song B starts with its bass reduced. Halfway through, bass moves from Song A to Song B.' : settings.eq === 'gradual' ? 'Song A’s bass gradually decreases while Song B’s bass returns.' : 'The LOW EQ stays unchanged on both songs.',
    settings.filter === 'highpass' ? 'The outgoing high-pass filter removes more bass as the handoff approaches.' : settings.filter === 'lowpass' ? 'The outgoing low-pass filter removes more high frequencies as the handoff approaches.' : 'No filter is applied.',
    settings.beatmatch ? `Song B’s playback speed is ${(t.rate * 100).toFixed(1)}% to match the entered BPM. This also changes pitch.` : 'Each song keeps its original tempo.'
  ];
}
export function automation(settings, progress) {
  const p = Math.max(0, Math.min(1, progress));
  return { gainA: settings.volume === 'fade' ? 1 - p : settings.volume === 'cut' ? (p < .5 ? 1 : 0) : 1,
    gainB: settings.volume === 'fade' ? p : settings.volume === 'cut' ? (p < .5 ? 0 : 1) : 1,
    bassA: settings.eq === 'center' ? (p < .5 ? 0 : -24) : settings.eq === 'gradual' ? -24 * p : 0,
    bassB: settings.eq === 'center' ? (p < .5 ? -24 : 0) : settings.eq === 'gradual' ? -24 * (1 - p) : 0,
    filter: settings.filter === 'highpass' ? 20 * (100 ** p) : settings.filter === 'lowpass' ? 18000 * ((300 / 18000) ** p) : 20000 };
}
