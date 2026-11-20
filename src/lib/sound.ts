let context: AudioContext | null = null;

function soundEnabled(): boolean {
  return localStorage.getItem('fajing.sound') !== '0';
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioCtor =
    window.AudioContext ??
    (
      window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }
  if (!context) {
    context = new AudioCtor();
  }
  if (context.state === 'suspended') {
    void context.resume();
  }
  return context;
}

function tone(
  frequency: number,
  delay: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.045,
) {
  const audio = getContext();
  if (!audio) {
    return;
  }
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const start = audio.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration,
  );

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function safe(action: () => void) {
  if (!soundEnabled()) {
    return;
  }
  try {
    action();
  } catch {
    // Audio may be blocked by the browser; the UI must not fail.
  }
}

export function playClick(): void {
  safe(() => tone(520, 0, 0.05, 'square', 0.018));
}

export function playComplete(): void {
  safe(() => {
    tone(659, 0, 0.12, 'triangle');
    tone(880, 0.09, 0.18, 'triangle');
    tone(1319, 0.2, 0.22, 'sine', 0.03);
  });
}

export function playChest(): void {
  safe(() => {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      tone(frequency, index * 0.075, 0.16, 'triangle');
    });
  });
}

export function playLevelUp(): void {
  safe(() => {
    [392, 523, 659, 784, 1047].forEach((frequency, index) => {
      tone(frequency, index * 0.09, 0.22, 'sine', 0.04);
    });
  });
}
