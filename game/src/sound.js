// Sound, synthesized only: no audio files, no network. Every cue is a short
// WebAudio oscillator phrase, built on the first user gesture (browsers will not
// start audio before one). The alarm's pitch climbs with the alarm meter.
export function createSound() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, duration, type, when, slideTo) {
    if (!ctx) return;
    const start = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(1, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  return {
    ensure,
    step() {
      tone(140 + Math.random() * 40, 0.05, 'triangle', 0);
    },
    pickup() {
      tone(660, 0.12, 'sine', 0);
      tone(990, 0.18, 'sine', 0.08);
    },
    coin() {
      tone(1180, 0.1, 'square', 0, 700);
      tone(1560, 0.14, 'sine', 0.12);
    },
    channelTick() {
      tone(520, 0.06, 'sine', 0);
    },
    alarmBlip(alarm) {
      // Higher alarm, higher and faster blips.
      tone(320 + alarm * 4, 0.09, 'sawtooth', 0);
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0, 55);
      tone(110, 0.7, 'square', 0.15, 40);
    },
    win() {
      tone(523, 0.16, 'sine', 0);
      tone(659, 0.16, 'sine', 0.14);
      tone(784, 0.22, 'sine', 0.28);
      tone(1047, 0.4, 'sine', 0.44);
    },
    click() {
      tone(880, 0.05, 'sine', 0);
    },
  };
}
