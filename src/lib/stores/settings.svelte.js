/**
 * アプリ設定ストア
 * - Tauri plugin-store (settings.json) で永続化
 * - ブラウザ環境では localStorage にフォールバック
 */

import { Store } from '@tauri-apps/plugin-store';

const FALLBACK_KEY = 'tomatask_settings';

/** デフォルト設定 */
export const DEFAULT_SETTINGS = {
  // タイマー時間 (分)
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosUntilLongBreak: 4,

  // 通知設定
  notificationEnabled: true,
  notificationRepeatInterval: 30, // 秒

  // 音声設定
  audioEnabled: true,
  audioVolume: 0.5, // 0.0〜1.0

  // アイドルリマインド設定
  idleRemindEnabled: true,
  idleRemindInterval: 5, // 分

  // Obsidian 設定
  obsidianVaultPath: '~/git/gitlab.adways.net/watase.yusuke/journal/DailyNotes',
  obsidianLogSection: '', // 空文字 = ファイル末尾
};

let _store = null;

async function getStore() {
  if (_store) return _store;
  try {
    _store = await Store.load('settings.json', { autoSave: true });
  } catch {
    _store = null;
  }
  return _store;
}

function createSettingsStore() {
  let settings = $state({ ...DEFAULT_SETTINGS });
  let loaded = $state(false);

  async function load() {
    const store = await getStore();
    if (store) {
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        const val = await store.get(key);
        if (val !== null && val !== undefined) {
          settings[key] = val;
        }
      }
    } else {
      // localStorage フォールバック
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(FALLBACK_KEY);
        if (raw) {
          try {
            Object.assign(settings, JSON.parse(raw));
          } catch {
            // 破損データは無視
          }
        }
      }
    }
    loaded = true;
  }

  async function save() {
    const store = await getStore();
    if (store) {
      for (const [key, val] of Object.entries(settings)) {
        await store.set(key, val);
      }
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(settings));
    }
  }

  function update(key, value) {
    settings[key] = value;
    save();
  }

  return {
    get settings() {
      return settings;
    },
    get loaded() {
      return loaded;
    },
    load,
    update,
  };
}

export const settingsStore = createSettingsStore();
