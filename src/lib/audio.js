/**
 * 音声通知ユーティリティ (Web Audio API)
 * - ポモドーロ終了時にビープ音を再生
 * - 音量設定・有効/無効切替対応
 * - 設定は settingsStore 経由で取得
 */

let _ctx = null;

function getAudioContext() {
  if (!_ctx) {
    _ctx = new AudioContext();
  }
  return _ctx;
}

/**
 * 単音のビープを生成して再生する
 * @param {AudioContext} ctx
 * @param {number} freq - 周波数 (Hz)
 * @param {number} startTime
 * @param {number} duration - 秒
 * @param {number} volume - 0.0〜1.0
 */
function beep(ctx, freq, startTime, duration, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * 作業終了音（明るい3音）を再生する
 * @param {number} volume - 0.0〜1.0
 */
export function playWorkEndSound(volume = 0.5) {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  beep(ctx, 523.25, t, 0.15, volume); // C5
  beep(ctx, 659.25, t + 0.18, 0.15, volume); // E5
  beep(ctx, 783.99, t + 0.36, 0.3, volume); // G5
}

/**
 * 休憩終了音（落ち着いた2音）を再生する
 * @param {number} volume - 0.0〜1.0
 */
export function playBreakEndSound(volume = 0.5) {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  beep(ctx, 440, t, 0.2, volume); // A4
  beep(ctx, 392, t + 0.25, 0.3, volume); // G4
}

/**
 * モードに応じた通知音を再生する
 * @param {string} mode - 完了したモード ('work'|'short'|'long')
 * @param {number} volume - 0.0〜1.0
 * @param {boolean} enabled - 音声有効フラグ
 */
export function playNotificationSound(mode, volume = 0.5, enabled = true) {
  if (!enabled) return;
  if (mode === 'work') {
    playWorkEndSound(volume);
  } else {
    playBreakEndSound(volume);
  }
}
