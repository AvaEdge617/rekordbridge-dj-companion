import { automation, defaults, describe, range, seconds, setDuration, time, timing } from './lab-model.js';
import { PreviewAudio } from './lab-audio.js';
import { readFile, removeFile, storeFile } from './lab-storage.js';

const $ = id => document.getElementById(id), audio = new PreviewAudio();
let saved;
try { saved = JSON.parse(localStorage.getItem('cuecraft-set-v1') || 'null'); } catch { saved = null; }
const plan = saved || { name: 'My first set', target: 1500, tracks: [], transitions: {}, recipes: [] };
const buffers = new Map();
let selected = null, mystery = null, mysteryBuffers = null, previewToken = 0;
function message(text) { $('lab-message').textContent = text; }
function save() {
  try { localStorage.setItem('cuecraft-set-v1', JSON.stringify(plan)); }
  catch { message('Device storage is full. Export your plan to keep a copy.'); }
  $('set-total').textContent = `${time(setDuration(plan.tracks, plan.transitions))} / ${time(plan.target)} · estimated`;
}
function el(tag, text, className) { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item; }
function button(text, action, className = 'button button-quiet') { const item = el('button', text, className); item.type = 'button'; item.addEventListener('click', action); return item; }
function input(label, value, action, type = 'text') {
  const wrap = el('label', label), field = document.createElement('input'); field.type = type; field.value = value;
  if (type === 'number') { field.min = '0'; field.step = 'any'; }
  field.addEventListener('change', () => action(field)); wrap.append(field); return wrap;
}
function waveform(track) {
  const wrap = el('div', undefined, 'waveform-wrap'), canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 110;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${track.name} waveform; use IN and OUT sliders below`);
  const ctx = canvas.getContext('2d'), buffer = buffers.get(track.id);
  ctx.fillStyle = '#121923'; ctx.fillRect(0, 0, 800, 110);
  ctx.fillStyle = '#23493f'; ctx.fillRect(track.in / track.duration * 800, 0, range(track) / track.duration * 800, 110);
  if (buffer || track.peaks) {
    const peaks = buffer ? waveformPeaks(buffer) : track.peaks;
    ctx.fillStyle = '#57d5c1';
    for (let x = 0; x < 800; x++) { const peak = peaks[x] || 0; ctx.fillRect(x, 55 - peak * 48, 1, Math.max(1, peak * 96)); }
  } else { ctx.fillStyle = '#aeb9cc'; ctx.font = '18px sans-serif'; ctx.fillText('Audio loads when you press Hear it', 20, 60); }
  if (track.bpm > 0) { ctx.strokeStyle = '#ffffff35'; const bar = 240 / track.bpm; for (let t = 0; t < track.duration; t += bar) { const x = t / track.duration * 800; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 110); ctx.stroke(); } }
  for (const [point, color] of [[track.in, '#57d5c1'], [track.out, '#e895cb']]) { ctx.fillStyle = color; ctx.fillRect(point / track.duration * 800 - 2, 0, 4, 110); }
  wrap.append(canvas); return wrap;
}
function waveformPeaks(buffer) {
  const data = buffer.getChannelData(0), stride = Math.max(1, Math.floor(data.length / 800));
  return Array.from({ length: 800 }, (_, x) => { let peak = 0; for (let n = x * stride; n < Math.min(data.length, (x + 1) * stride); n += Math.max(1, Math.floor(stride / 50))) peak = Math.max(peak, Math.abs(data[n])); return Math.round(peak * 1000) / 1000; });
}
function renderTracks() {
  $('track-list').replaceChildren();
  if (!plan.tracks.length) $('track-list').append(el('p', 'Start with two audio files, or try the practice tracks.', 'empty-state'));
  plan.tracks.forEach((track, index) => {
    const card = el('article', undefined, 'panel track-card'); const heading = el('div', undefined, 'track-heading');
    heading.append(el('h2', `${String(index + 1).padStart(2, '0')} · ${track.name}`), el('span', `${time(range(track))} planned / ${time(track.duration)} full`, 'muted'));
    const details = el('div', undefined, 'track-fields');
    details.append(input('Name', track.name, field => { track.name = field.value; save(); renderTracks(); }), input('BPM · entered manually', track.bpm || '', field => { track.bpm = Math.max(0, Number(field.value) || 0); save(); renderTracks(); refreshEditor(); }, 'number'), input('Key · optional', track.key || '', field => { track.key = field.value; save(); }), input('Section', track.section || 'Opening', field => { track.section = field.value; save(); }));
    card.append(heading, details, waveform(track));
    const markers = el('div', undefined, 'marker-fields');
    for (const kind of ['in', 'out']) {
      const update = value => { const parsed = Number(value); track[kind] = Math.max(0, Math.min(track.duration, parsed)); if (track.in > track.out) track[kind === 'in' ? 'out' : 'in'] = track[kind]; save(); renderTracks(); refreshEditor(); };
      markers.append(input(`${kind.toUpperCase()} · minutes:seconds`, time(track[kind]), field => { const value = seconds(field.value); if (Number.isFinite(value)) update(value); else { field.value = time(track[kind]); message('Use minutes:seconds, such as 1:43.'); } }));
      const wrap = el('label', `${kind.toUpperCase()} point`), slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = String(track.duration); slider.step = '.01'; slider.value = String(track[kind]); slider.setAttribute('aria-label', `${track.name} ${kind.toUpperCase()} point`); slider.addEventListener('change', () => update(slider.value)); wrap.append(slider); markers.append(wrap);
    }
    const actions = el('div', undefined, 'lab-actions');
    const move = direction => { const other = index + direction; if (other < 0 || other >= plan.tracks.length) return; [plan.tracks[index], plan.tracks[other]] = [plan.tracks[other], plan.tracks[index]]; selected = null; audio.stop(); $('transition-editor').hidden = true; save(); renderTracks(); };
    const up = button('↑ Move up', () => move(-1)), down = button('↓ Move down', () => move(1)); up.disabled = index === 0; down.disabled = index === plan.tracks.length - 1;
    actions.append(up, down, button('Remove', () => { plan.tracks.splice(index, 1); buffers.delete(track.id); removeFile(track.id).catch(() => {}); selected = null; audio.stop(); $('transition-editor').hidden = true; save(); renderTracks(); }));
    card.append(markers, actions); $('track-list').append(card);
    if (index < plan.tracks.length - 1) $('track-list').append(button(`↓ Transition · ${track.name} → ${plan.tracks[index + 1].name}`, () => openTransition(track.id, plan.tracks[index + 1].id), 'transition-link'));
  });
  const sections = [...new Set(plan.tracks.map(t => t.section || 'Unsorted'))];
  $('section-summary').textContent = sections.map(section => `${section}: ${time(setDuration(plan.tracks.filter(t => (t.section || 'Unsorted') === section), plan.transitions))}`).join(' · ');
  save();
}
function automationGraph(s) {
  const wrap = el('div', undefined, 'waveform-wrap'), canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 160;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `Control changes over the transition: ${s.volume} volume, ${s.eq} bass, ${s.filter} filter`);
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#111923'; ctx.fillRect(0, 0, 800, 160);
  const lines = [['gainA', '#57d5c1', 'A volume'], ['gainB', '#e895cb', 'B volume']];
  if (s.eq !== 'none') lines.push(['bassA', '#aabaff', 'A bass'], ['bassB', '#f4bd64', 'B bass']);
  if (s.filter !== 'none') lines.push(['filter', '#aabaff', 'Filter cutoff']);
  for (const [key, color, label] of lines) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 100; i++) { const value = automation(s, i / 100)[key]; const normalized = key === 'filter' ? Math.log(value / 20) / Math.log(1000) : key.startsWith('bass') ? 1 + value / 24 : value; const y = 130 - normalized * 95; if (i) ctx.lineTo(20 + i * 7.6, y); else ctx.moveTo(20, y); } ctx.stroke(); const index = lines.findIndex(line => line[0] === key); ctx.fillStyle = color; ctx.font = '14px sans-serif'; ctx.fillText(label, 20 + index * 150, 18); }
  ctx.fillStyle = '#afb7c6'; ctx.fillText('Start', 20, 153); ctx.fillText('Handoff / end', 650, 153); wrap.append(canvas); return wrap;
}
function pair() { return selected && selected.map(id => plan.tracks.find(track => track.id === id)); }
function settings() { return { bars: Math.max(0, Math.min(64, Number($('overlap-bars').value) || 0)), volume: $('volume-mode').value, eq: $('eq-mode').value, filter: $('filter-mode').value, beatmatch: $('preview-beatmatch').checked }; }
function openTransition(a, b) {
  audio.stop(); selected = [a, b]; const s = plan.transitions[`${a}:${b}`] || defaults();
  $('overlap-bars').value = s.bars; $('volume-mode').value = s.volume; $('eq-mode').value = s.eq; $('filter-mode').value = s.filter; $('preview-beatmatch').checked = s.beatmatch;
  $('transition-editor').hidden = false; refreshEditor(); $('transition-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function refreshEditor() {
  const tracks = pair(); if (!tracks || tracks.some(track => !track)) return;
  const [a, b] = tracks, s = settings(), t = timing(a, b, s); plan.transitions[`${a.id}:${b.id}`] = s; save();
  $('pair-title').textContent = `${a.name} → ${b.name}`;
  $('pair-waveforms').replaceChildren(el('p', `Song A OUT · ${time(a.out)}`, 'muted'), waveform(a), el('p', `Song B IN · ${time(b.in)}`, 'muted'), waveform(b));
  $('automation-view').replaceChildren(automationGraph(s));
  const warnings = [];
  if (!a.bpm || !b.bpm) warnings.push('Enter BPM on both songs to estimate bars and match tempo. The displayed grid starts at 0:00; it is not an analyzed beat grid.');
  if (a.bpm && b.bpm && Math.abs(a.bpm / b.bpm - 1) > .08) warnings.push(`Beatmatch difficulty: high · ${a.bpm} → ${b.bpm} BPM. Try a shorter overlap or a cut; preview is still available.`);
  if (t.overlap < t.requested) warnings.push('The overlap is shortened to fit your selected song sections.');
  if (s.beatmatch) warnings.push('Tempo matching uses playback speed and changes pitch. Align your IN point by ear; no automatic beat analysis is performed.');
  $('transition-warning').textContent = warnings.join(' ') || 'Your choices are unrestricted. Change one setting, then listen again.';
  $('transition-explanation').replaceChildren(...describe(a, b, s).map(text => el('li', text)));
  const steps = ['Load Song B and cue it at your chosen IN point. Listen in your headphones.', 'Match tempo by ear and use gentle jog nudges to keep the beats aligned.', `Start Song B ${t.overlap.toFixed(1)} seconds before Song A’s OUT point.`];
  if (s.eq !== 'none') steps.push('Begin with Song B LOW turned down. Hand off the bass by turning Song A LOW down and Song B LOW toward center.');
  if (s.filter !== 'none') steps.push(s.filter === 'highpass' ? 'Gradually remove bass from Song A with its high-pass filter.' : 'Gradually remove high frequencies from Song A with its low-pass filter.');
  steps.push(s.volume === 'cut' ? 'At the handoff, cut Song A and bring Song B up.' : 'Use the channel faders to make your chosen handoff, then close Song A at OUT.');
  $('manual-steps').replaceChildren(...steps.map(text => el('li', text)));
}
async function loadBuffer(track) {
  if (track.demo !== undefined && !buffers.has(track.id)) buffers.set(track.id, await audio.practiceTrack(track.demo));
  if (buffers.has(track.id)) return buffers.get(track.id);
  const file = await readFile(track.id); if (!file) throw new Error(`Re-add audio for ${track.name}; this browser no longer has the file.`);
  const buffer = await audio.decode(file); buffers.set(track.id, buffer); return buffer;
}
async function hear() {
  const token = ++previewToken;
  try { const tracks = pair(); if (!tracks) return; const [a, b] = tracks; message('Loading your preview…'); const [bufferA, bufferB] = await Promise.all([loadBuffer(a), loadBuffer(b)]); if (token !== previewToken) return; await audio.preview({ ...a, buffer: bufferA }, { ...b, buffer: bufferB }, settings(), () => message('Preview finished. Change a setting and compare by ear.')); message('Playing the selected transition.'); renderTracks(); refreshEditor(); }
  catch (error) { message(error.message); }
}
async function importFiles(files) {
  let failures = 0;
  for (const file of files) {
    try { message(`Reading ${file.name}…`); const buffer = await audio.decode(file), id = crypto.randomUUID(); await storeFile(id, file); buffers.set(id, buffer); plan.tracks.push({ id, name: file.name.replace(/\.[^.]+$/, ''), duration: buffer.duration, in: 0, out: buffer.duration, bpm: 0, key: '', section: 'Opening', peaks: waveformPeaks(buffer) }); }
    catch { failures++; }
  }
  renderTracks(); message(failures ? `${failures} file(s) could not be imported. Try a supported MP3 or WAV and check available device storage. Other imported audio is saved.` : 'Audio saved on this device. Enter BPM, choose IN/OUT, then open a transition.');
}
async function demo() {
  message('Generating two practice beats…');
  for (let i = 0; i < 2; i++) {
    const id = crypto.randomUUID(), buffer = await audio.practiceTrack(i);
    const track = { id, name: i ? 'Practice B · bright groove' : 'Practice A · deep groove', duration: buffer.duration, in: 0, out: 24, bpm: 120, key: '', section: 'Practice', demo: i, peaks: waveformPeaks(buffer) };
    buffers.set(id, buffer); plan.tracks.push(track);
  }
  renderTracks(); const end = plan.tracks.slice(-2); openTransition(end[0].id, end[1].id); message('Practice beats are ready. These are generated sounds, not commercial songs.');
}
function renderRecipes() {
  $('recipe-list').replaceChildren();
  if (!plan.recipes.length) $('recipe-list').append(el('p', 'Hear a transition you like, then save its recipe.', 'muted'));
  for (const recipe of plan.recipes) {
    const card = el('article', undefined, 'recipe-card'); card.append(el('h3', recipe.name), el('p', `${recipe.settings.bars} bars · ${recipe.settings.volume} · ${recipe.settings.eq} bass · ${recipe.settings.filter} filter`, 'muted'));
    const select = document.createElement('select'); select.setAttribute('aria-label', `${recipe.name} practice status`);
    for (const label of ['Not practiced', 'Learning', 'Can do', 'Performance ready']) { const option = el('option', label); option.value = label; select.append(option); }
    select.value = recipe.status; select.addEventListener('change', () => { recipe.status = select.value; save(); });
    card.append(select, button('Open recipe', () => { if (recipe.pair.every(id => plan.tracks.some(t => t.id === id))) { recipe.pair.forEach((id, i) => Object.assign(plan.tracks.find(t => t.id === id), recipe.markers[i])); plan.transitions[recipe.pair.join(':')] = recipe.settings; renderTracks(); openTransition(...recipe.pair); } else message('This recipe’s songs were removed. The saved instructions remain in your exported plan.'); }), button('Delete recipe', () => { plan.recipes = plan.recipes.filter(r => r.id !== recipe.id); save(); renderRecipes(); })); $('recipe-list').append(card);
  }
}
async function playMystery() {
  try { mysteryBuffers ||= await Promise.all([audio.practiceTrack(0), audio.practiceTrack(1)]); const [a, b] = mysteryBuffers.map((buffer, index) => ({ id: `mystery${index}`, name: `Practice ${index ? 'B' : 'A'}`, in: 0, out: 16, bpm: 120, buffer })); await audio.preview(a, b, mystery.settings); }
  catch (error) { message(error.message); }
}
$('open-lab').addEventListener('click', () => { for (const id of ['home', 'lesson-view', 'pairing-view']) $(id).hidden = true; $('lab-view').hidden = false; window.scrollTo(0, 0); });
$('leave-lab').addEventListener('click', () => { previewToken++; audio.stop(); $('lab-view').hidden = true; $('home').hidden = false; });
$('set-name').value = plan.name; $('set-target').value = time(plan.target);
$('set-name').addEventListener('change', () => { plan.name = $('set-name').value; save(); });
$('set-target').addEventListener('change', () => { const value = seconds($('set-target').value); if (Number.isFinite(value)) plan.target = value; else $('set-target').value = time(plan.target); save(); });
$('audio-files').addEventListener('change', async event => { await importFiles([...event.target.files]); event.target.value = ''; });
$('add-demo').addEventListener('click', () => demo().catch(error => message(error.message)));
for (const id of ['overlap-bars', 'volume-mode', 'eq-mode', 'filter-mode', 'preview-beatmatch']) $(id).addEventListener('change', () => { previewToken++; audio.stop(); refreshEditor(); });
$('hear-transition').addEventListener('click', hear); $('stop-preview').addEventListener('click', () => { previewToken++; audio.stop(); message('Preview stopped.'); });
$('save-recipe').addEventListener('click', () => { const tracks = pair(); if (!tracks) return; plan.recipes.push({ id: crypto.randomUUID(), pair: [...selected], name: `${tracks[0].name} → ${tracks[1].name}`, settings: settings(), markers: tracks.map(t => ({ in: t.in, out: t.out })), instructions: describe(...tracks, settings()), status: 'Not practiced' }); save(); renderRecipes(); message('Recipe saved. Mark your practice progress when you are ready.'); });
$('export-set').addEventListener('click', () => { const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })), link = document.createElement('a'); link.href = url; link.download = 'cuecraft-set.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
$('mystery-new').addEventListener('click', () => { previewToken++; const choices = ['fade', 'bass', 'filter', 'cut'], answer = choices[Math.floor(Math.random() * choices.length)]; mystery = { answer, settings: { ...defaults(), bars: 2, volume: answer === 'fade' ? 'fade' : answer === 'cut' ? 'cut' : 'overlap', eq: answer === 'bass' ? 'center' : 'none', filter: answer === 'filter' ? 'highpass' : 'none' } }; $('mystery-result').textContent = 'Listen first. Which change did you hear?'; $('mystery-reveal').replaceChildren(); $('mystery-answers').hidden = false; $('mystery-replay').disabled = false; playMystery(); });
$('mystery-replay').addEventListener('click', () => { if (mystery) playMystery(); });
document.querySelectorAll('[data-guess]').forEach(item => item.addEventListener('click', () => { if (!mystery) return; const clue = { fade: 'The volume of A fell while B rose. Listen for the gradual change in loudness.', bass: 'LOW EQ changed in the middle. Listen for the low-frequency energy moving from A to B.', filter: 'A high-pass filter removed bass from A. Listen for A becoming thinner before it leaves.', cut: 'The channel volumes switched suddenly in the middle. Listen for an immediate handoff.' }; $('mystery-result').textContent = `${item.dataset.guess === mystery.answer ? 'You heard it!' : 'Good chance to compare.'} The answer is ${mystery.answer === 'bass' ? 'bass swap' : mystery.answer}. ${clue[mystery.answer]} Replay and listen for that change.`; $('mystery-reveal').replaceChildren(automationGraph(mystery.settings)); }));
window.addEventListener('pagehide', () => audio.stop());
renderTracks(); renderRecipes();
