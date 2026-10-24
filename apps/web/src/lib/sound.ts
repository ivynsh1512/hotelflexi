// HotelFlexi Sound & Audio Engine
// Strict compliance:
// 1. Routine cleaning, linen replacement, and ordinary staff tasks NEVER play alarms.
// 2. Audible alerts are strictly opt-in, permission-aware, rate-limited (minimum 60s cooldown), and easy to silence.
// 3. Audio NEVER auto-starts on load and NEVER loops indefinitely.

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let activeFilter: BiquadFilterNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;
let vibrationInterval: NodeJS.Timeout | null = null;
let isSirenPlaying = false;
let lastSirenPlayTime = 0;
const SIREN_COOLDOWN_MS = 60000; // Minimum 60-second cooldown between audible alarms

/**
 * Check if the user has explicitly opted into audible emergency alerts.
 * Defaults to false (visual notifications only) until enabled in settings.
 */
export function isAudibleAlertOptedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('hotelflexi_audible_alerts_enabled') === 'true';
  } catch {
    return false;
  }
}

/**
 * Set user preference for audible alerts.
 */
export function setAudibleAlertsOptIn(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hotelflexi_audible_alerts_enabled', enabled ? 'true' : 'false');
    if (!enabled && isSirenPlaying) {
      stopSiren();
    }
  } catch {}
}

/**
 * Initialize or get AudioContext
 */
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

/**
 * Global Unlock: Listen for user gesture (click/tap/keydown) to resume AudioContext
 */
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

    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
  };

  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

/**
 * Play Urgent Siren for critical guest emergencies ONLY.
 * Enforces opt-in verification and minimum 60-second rate-limiting cooldown.
 * Automatically shuts off after 6 seconds to prevent runaway noise.
 */
export function playSiren(forceOverride: boolean = false): void {
  if (typeof window === 'undefined') return;
  if (isSirenPlaying) return;

  // Rate-limiting check
  const nowMs = Date.now();
  if (!forceOverride && nowMs - lastSirenPlayTime < SIREN_COOLDOWN_MS) {
    return; // Rate limited
  }

  // Opt-in check
  if (!forceOverride && !isAudibleAlertOptedIn()) {
    return; // Opted out - silent visual alert only
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const startSoundGraph = () => {
    if (isSirenPlaying) return;
    stopSiren();

    try {
      lastSirenPlayTime = Date.now();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      activeOscillator = osc;
      activeGain = gain;
      activeFilter = filter;
      isSirenPlaying = true;

      // Smooth modulation (880Hz <-> 660Hz alternating every 450ms)
      let isHigh = false;
      sirenInterval = setInterval(() => {
        if (!activeOscillator || !audioCtx) return;
        const curTime = audioCtx.currentTime;
        const targetFreq = isHigh ? 880 : 660;
        activeOscillator.frequency.cancelScheduledValues(curTime);
        activeOscillator.frequency.linearRampToValueAtTime(targetFreq, curTime + 0.15);
        isHigh = !isHigh;
      }, 450);

      // Hardware vibration
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400]);
        } catch {}

        if (vibrationInterval) clearInterval(vibrationInterval);
        vibrationInterval = setInterval(() => {
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([400, 200, 400]);
            }
          } catch {}
        }, 3000);
      }

      // Safety automatic shutoff after 6 seconds to prevent continuous buzzing
      setTimeout(() => {
        stopSiren();
      }, 6000);
    } catch (err) {
      console.warn('Could not start emergency audio graph:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(startSoundGraph).catch(startSoundGraph);
  } else {
    startSoundGraph();
  }
}

/**
 * Stop Urgent Siren & Cancel Vibrations immediately
 */
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

export function isSirenActive(): boolean {
  return isSirenPlaying;
}

/**
 * Test siren for user preview / settings (plays a brief 2.5-second test beep safely)
 */
export async function testSiren(): Promise<void> {
  playSiren(true);
  setTimeout(() => {
    stopSiren();
  }, 2500);
}

/**
 * Play clean 2-tone notification chime (short, pleasant, non-emergency)
 */
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const startChime = () => {
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      if ('vibrate' in navigator) {
        navigator.vibrate([100]);
      }
    } catch (err) {
      console.warn('Could not play chime:', err);
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(startChime).catch(startChime);
  } else {
    startChime();
  }
}
