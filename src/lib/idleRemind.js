/**
 * アイドルリマインド機能
 * - タイマーが停止状態でN分経過するとリマインド通知を送る
 * - タイマー開始/リセット時に停止
 * - 一時無効化オプション付き
 */

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

/** アイドルリマインドタイマーID */
let _idleTimer = null;
/** リマインドインターバルタイマーID（繰り返し） */
let _remindTimer = null;
/** 一時無効フラグ */
let _snoozed = false;

async function ensurePermission() {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === 'granted';
  }
  return granted;
}

function sendReminder() {
  sendNotification({
    title: '⏰ 作業を開始しましょう',
    body: 'タイマーが止まっています。ポモドーロを始めませんか？',
  });
}

/**
 * アイドル検知を開始する（タイマーが止まったときに呼ぶ）
 * @param {number} intervalMinutes - リマインド間隔（分）
 * @param {boolean} enabled - リマインド有効フラグ
 */
export async function startIdleRemind(intervalMinutes = 5, enabled = true) {
  stopIdleRemind();
  if (!enabled || _snoozed) return;

  const granted = await ensurePermission();
  if (!granted) return;

  const intervalMs = intervalMinutes * 60 * 1000;

  // 最初のリマインドを intervalMs 後に送り、以降は繰り返す
  _idleTimer = setTimeout(async () => {
    sendReminder();
    _remindTimer = setInterval(sendReminder, intervalMs);
  }, intervalMs);
}

/**
 * アイドルリマインドを停止する（タイマー開始/リセット時に呼ぶ）
 */
export function stopIdleRemind() {
  if (_idleTimer !== null) {
    clearTimeout(_idleTimer);
    _idleTimer = null;
  }
  if (_remindTimer !== null) {
    clearInterval(_remindTimer);
    _remindTimer = null;
  }
}

/**
 * セッション中だけリマインドを一時無効化する
 */
export function snoozeIdleRemind() {
  _snoozed = true;
  stopIdleRemind();
}

/**
 * 一時無効化を解除してアイドル検知を再開する
 * @param {number} intervalMinutes
 * @param {boolean} enabled
 */
export async function unsnoozeIdleRemind(intervalMinutes = 5, enabled = true) {
  _snoozed = false;
  await startIdleRemind(intervalMinutes, enabled);
}

/** 現在スヌーズ中かどうか */
export function isSnoozed() {
  return _snoozed;
}
