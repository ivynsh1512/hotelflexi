// HotelFlexi Sound & Siren Audio Engine
// Uses Web Audio API with auto-unlocking on first user interaction

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let activeFilter: BiquadFilterNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;
let vibrationInterval: NodeJS.Timeout | null = null;
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

// 3. Play Urgent Siren (Smooth European Two-Tone 880Hz / 660Hz with Anti-Crack Filtering and Looping Vibration)
export function playSiren(): void {
  if (typeof window === 'undefined') return;
  if (isSirenPlaying) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop any existing sounds
    stopSiren();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Use triangle wave with a lowpass filter to remove any high-frequency digital crackle
    osc.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, ctx.currentTime);

    // Initial frequency: 880Hz (A5)
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    // Smooth soft-attack gain ramp to prevent initial click
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.06);

    // Connect audio chain: osc -> filter -> gain -> destination
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    activeOscillator = osc;
    activeGain = gain;
    activeFilter = filter;
    isSirenPlaying = true;

    // Smooth European Hi-Lo siren modulation (880Hz high <-> 660Hz low alternating every 420ms)
    let isHigh = false;
    sirenInterval = setInterval(() => {
      if (!activeOscillator || !audioCtx) return;
      const now = audioCtx.currentTime;
      const targetFreq = isHigh ? 880 : 660;
      activeOscillator.frequency.cancelScheduledValues(now);
      activeOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.12);
      isHigh = !isHigh;
    }, 420);

    // Continuous Hardware Vibration on Mobile Devices (rhythmic looping pulse)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([600, 250, 600, 250]);
      } catch {}

      if (vibrationInterval) clearInterval(vibrationInterval);
      vibrationInterval = setInterval(() => {
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([600, 250, 600, 250]);
          }
        } catch {}
      }, 1700);
    }
  } catch (err) {
    console.warn('Could not start siren audio:', err);
  }
}

// 4. Stop Urgent Siren & Cancel Vibrations
export function stopSiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {}
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

  if (activeFilter) {
    try {
      activeFilter.disconnect();
    } catch {}
    activeFilter = null;
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

// 6. Test Siren (Runs for 3.5 seconds then automatically stops)
export function testSiren(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        playSiren();
      }).catch(() => {
        playSiren();
      });
    } else {
      playSiren();
    }
    setTimeout(() => {
      stopSiren();
      resolve();
    }, 3500);
  });
}
