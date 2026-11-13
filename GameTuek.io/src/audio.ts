// Synthesized effects: no external audio assets or downloads.
export class GameAudio {
  private context: AudioContext | null = null;
  private disposed = false;

  unlock() {
    if (this.disposed) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* The game remains playable without audio support. */ }
  }

  private tone(frequency: number, endFrequency: number, duration: number,
    delay = 0, volume = 0.12, type: OscillatorType = 'sine') {
    const context = this.context;
    if (!context || this.disposed || context.state !== 'running') return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  drop() {
    // resume() may finish after the input handler returns.
    const context = this.context;
    if (!context) return;
    void context.resume().then(() => this.tone(520, 180, 0.13, 0, 0.08, 'triangle')).catch(() => {});
  }

  land(perfect: boolean) {
    this.tone(140, 55, 0.15, 0, 0.2);
    if (perfect) {
      [659.25, 830.61, 987.77].forEach((note, index) =>
        this.tone(note, note, 0.23, index * 0.075, 0.08, 'triangle'));
    } else {
      this.tone(280, 200, 0.08, 0, 0.05, 'triangle');
    }
  }

  gameOver() {
    [392, 311.13, 196].forEach((note, index) =>
      this.tone(note, note * 0.85, 0.32, index * 0.16, 0.1, 'triangle'));
  }

  dispose() {
    this.disposed = true;
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.context = null;
  }
}
