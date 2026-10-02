import { automation, timing } from './lab-model.js';
export class PreviewAudio {
  constructor() { this.context = null; this.sources = []; this.nodes = []; this.timer = null; }
  async ready() { this.context ||= new AudioContext(); await this.context.resume(); return this.context; }
  async decode(file) { const ctx = await this.ready(); return ctx.decodeAudioData(await file.arrayBuffer()); }
  stop() { clearTimeout(this.timer); for (const source of this.sources) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); } for (const node of this.nodes) node.disconnect(); this.sources = []; this.nodes = []; }
  async preview(a, b, settings, onEnd = () => {}) {
    const ctx = await this.ready(); this.stop();
    const t = timing(a, b, settings); if (t.duration <= 0) throw new Error('Choose an OUT point after IN on both songs.');
    const start = ctx.currentTime + .04, mixEnd = start + t.overlap;
    const master = ctx.createGain(); master.gain.value = .45; master.connect(ctx.destination);
    this.nodes.push(master);
    [a, b].forEach((track, i) => {
      const source = ctx.createBufferSource(), gain = ctx.createGain(), bass = ctx.createBiquadFilter(), filter = ctx.createBiquadFilter();
      source.buffer = track.buffer; source.playbackRate.value = i ? t.rate : 1;
      bass.type = 'lowshelf'; bass.frequency.value = 180;
      filter.type = i || settings.filter === 'none' ? 'allpass' : settings.filter;
      source.connect(bass).connect(filter).connect(gain).connect(master);
      this.nodes.push(bass, filter, gain);
      for (let step = 0; step <= 80; step++) {
        const p = step / 80, values = automation(settings, p), at = start + p * t.overlap;
        gain.gain.setValueAtTime(i ? values.gainB : values.gainA, at);
        bass.gain.setValueAtTime(i ? values.bassB : values.bassA, at);
        if (!i && settings.filter !== 'none') filter.frequency.setValueAtTime(values.filter, at);
      }
      const offset = i ? track.in : Math.max(track.in, track.out - t.overlap);
      if (i || t.overlap > 0) { source.start(start, offset); source.stop(i ? start + t.duration : mixEnd); this.sources.push(source); }
    });
    this.timer = setTimeout(() => { this.stop(); master.disconnect(); onEnd(); }, (t.duration + .1) * 1000);
    return t;
  }
  async practiceTrack(variant = 0) {
    const ctx = await this.ready(), bpm = 120, duration = 32, buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let n = 0; n < data.length; n++) {
      const t = n / ctx.sampleRate, beat = t % .5, bassHz = variant ? 82.41 : 55;
      const kick = Math.sin(2 * Math.PI * (50 * beat + 70 * .03 * (1 - Math.exp(-beat / .03)))) * Math.exp(-beat * 28);
      const bass = .27 * Math.sin(2 * Math.PI * bassHz * t) * Math.exp(-beat * 5);
      const hat = .08 * (Math.sin(2 * Math.PI * 7231 * t) + Math.sin(2 * Math.PI * 9377 * t)) * Math.exp(-(t % .25) * 75);
      const melody = .08 * Math.sin(2 * Math.PI * (variant ? 659.25 : 440) * t) * Math.exp(-beat * 8);
      data[n] = (kick * .48 + bass + hat + melody);
    }
    return buffer;
  }
}
