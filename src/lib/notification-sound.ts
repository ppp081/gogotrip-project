/** เสียงสั้นๆ เมื่อมีแจ้งเตือนใหม่ (ไม่ต้องใช้ไฟล์เสียง) */
export function playNotificationSound(): void {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // ignore (autoplay / AudioContext blocked)
  }
}
