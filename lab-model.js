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
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export function baseName(fileName) { return String(fileName).replace(/\.[^.]+$/, '').trim(); }
export function validatePlan(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.tracks) || !Array.isArray(data.recipes) || !data.transitions || typeof data.transitions !== 'object' || Array.isArray(data.transitions)) throw new Error('That file is not a CueCraft set export.');
  const tracks = data.tracks.map((track, index) => {
    const duration = num(track?.duration, NaN);
    if (!track || typeof track.id !== 'string' || !track.id || typeof track.name !== 'string' || !(duration > 0)) throw new Error(`Song ${index + 1} in that file is missing its id, name, or length.`);
    const inPoint = Math.max(0, Math.min(duration, num(track.in, 0))), outPoint = Math.max(inPoint, Math.min(duration, num(track.out, duration)));
    const clean = { id: track.id, name: track.name, duration, in: inPoint, out: outPoint, bpm: Math.max(0, num(track.bpm, 0)), key: typeof track.key === 'string' ? track.key : '', section: typeof track.section === 'string' && track.section ? track.section : 'Opening', peaks: Array.isArray(track.peaks) ? track.peaks.map(n => num(n, 0)) : [] };
    if (track.demo === 0 || track.demo === 1) clean.demo = track.demo;
    return clean;
  });
  if (new Set(tracks.map(t => t.id)).size !== tracks.length) throw new Error('That file lists the same song id twice.');
  return { name: typeof data.name === 'string' && data.name.trim() ? data.name : 'My first set', target: num(data.target, 0) > 0 ? num(data.target) : 1500, tracks, transitions: { ...data.transitions }, recipes: data.recipes.filter(r => r && typeof r === 'object' && typeof r.id === 'string') };
}
export function relinkCandidates(tracks, fileName) { const name = baseName(fileName); return tracks.filter(track => track.demo === undefined && String(track.name).trim() === name); }
// Decoded audio is large (~80 MB per 4-minute stereo song), so keep only the songs that are needed right now.
export function retainOnly(cache, keepIds = []) { const keep = new Set(keepIds); let released = 0; for (const id of [...cache.keys()]) if (!keep.has(id)) { cache.delete(id); released++; } return released; }
// Stored audio that no song in any known plan refers to (left by a plan import or an interrupted save) can be deleted.
export function orphanIds(storedIds, ...trackLists) { const keep = new Set(trackLists.flat().map(track => track && track.id)); return storedIds.filter(id => !keep.has(id)); }
