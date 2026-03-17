/**
 * OS通知ユーティリティ
 * - タイマー終了時にネイティブ通知を発行
 * - dismissされるまで30秒間隔で再通知
 * - ユーザーアクション（開始/リセット/モード切替）で停止
 */

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

const REPEAT_INTERVAL_MS = 30_000;

/** @type {number|null} */
let _repeatTimer = null;

/**
 * 通知許可を確認・取得する
 * @returns {Promise<boolean>}
 */
async function ensurePermission() {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === 'granted';
  }
  return granted;
}

/**
 * タイマー終了通知を送信し、30秒ごとに繰り返す
 * @param {string} completedMode - 完了したモード ('work'|'short'|'long')
 * @param {number} completedPomodoros - 累計ポモドーロ数
 */
export async function startRepeatNotification(completedMode, completedPomodoros) {
  stopRepeatNotification();

  const granted = await ensurePermission();
  if (!granted) return;

  const send = () => {
    const title = completedMode === 'work' ? `🍅 ポモドーロ完了！` : `☕ 休憩終了`;
    const body =
      completedMode === 'work'
        ? `${completedPomodoros}回目の作業が終わりました。休憩しましょう。`
        : '休憩が終わりました。作業を始めましょう。';
    sendNotification({ title, body });
  };

  send();
  _repeatTimer = setInterval(send, REPEAT_INTERVAL_MS);
}

/**
 * 繰り返し通知を停止する（ユーザーアクション時に呼ぶ）
 */
export function stopRepeatNotification() {
  if (_repeatTimer !== null) {
    clearInterval(_repeatTimer);
    _repeatTimer = null;
  }
}
