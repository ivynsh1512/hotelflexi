// HotelFlexi Sound & Siren Audio Engine
// Uses Web Audio API with auto-unlocking on first user interaction

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;
let isSirenPlaying = false;

// 1. Initialize or get AudioContext
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Could not create AudioContext:', e);
    }
  }
  return audioCtx;
}

// 2. Global Unlock: Listen for any user gesture (click/tap/keydown) to resume AudioContext
export function setupAudioUnlock(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          isAudioUnlocked = true;
        }).catch(() => {});
      } else if (ctx.state === 'running') {
        isAudioUnlocked = true;
      }
    }

    // Clean up event listeners once unlocked
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

// 3. Play Urgent Siren (Two-tone emergency siren with piercing harmonics)
export function playSiren(): void {
  if (typeof window === 'undefined') return;
  if (isSirenPlaying) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop any existing oscillator
    stopSiren();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use sawtooth wave for high-visibility emergency penetration
    osc.type = 'sawtooth';
    // Frequency range: 960Hz (high) <-> 770Hz (low) standard emergency warble
    osc.frequency.setValueAtTime(960, ctx.currentTime);

    // Master volume (0.28 is loud without clipping)
    gain.gain.setValueAtTime(0.28, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    activeOscillator = osc;
    activeGain = gain;
    isSirenPlaying = true;

    // Siren warble modulation alternating every 350ms
    let isHigh = false;
    sirenInterval = setInterval(() => {
      if (!activeOscillator || !audioCtx) return;
      const now = audioCtx.currentTime;
      const freq = isHigh ? 960 : 770;
      activeOscillator.frequency.setTargetAtTime(freq, now, 0.08);
      isHigh = !isHigh;
    }, 350);

    // Trigger physical hardware vibration on mobile/Android devices
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 200, 400, 200, 600]);
    }
  } catch (err) {
    console.warn('Could not start siren audio:', err);
  }
}

// 4. Stop Urgent Siren
export function stopSiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch {}
    activeOscillator = null;
  }

  if (activeGain) {
    try {
      activeGain.disconnect();
    } catch {}
    activeGain = null;
  }

  isSirenPlaying = false;
}

// 5. Play Standard Notification Chime (Clean 2-tone chime for non-emergency alerts)
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone rising chime (880Hz -> 1320Hz)
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);

    if ('vibrate' in navigator) {
      navigator.vibrate([150]);
    }
  } catch (err) {
    console.warn('Could not play chime:', err);
  }
}

// 6. Test Siren (Runs for 3 seconds then automatically stops)
export function testSiren(): Promise<void> {
  return new Promise((resolve) => {
    playSiren();
    setTimeout(() => {
      stopSiren();
      resolve();
    }, 3000);
  });
}
