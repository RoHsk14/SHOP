export function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 800;
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.2);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 1200;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.4, audioCtx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    osc2.start(audioCtx.currentTime + 0.18);
    osc2.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
}
