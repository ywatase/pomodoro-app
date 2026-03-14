/**
 * ポモドーロタイマーの状態管理ストア
 * - 3モード: work(25分) / short(5分) / long(15分)
 * - 4ポモドーロ後に長休憩へ自動遷移
 * - localStorage による状態永続化
 * - タイマー終了時コールバック対応
 * - 設定からタイマー時間を動的取得
 */

/** デフォルト時間（秒）。設定が読み込まれるまでのフォールバック。 */
const DEFAULT_DURATIONS = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

/** 設定ストアへの参照（循環参照を避けるため遅延 import） */
let _settingsStore = null;
async function getSettingsStore() {
  if (!_settingsStore) {
    const mod = await import('./settings.svelte.js');
    _settingsStore = mod.settingsStore;
  }
  return _settingsStore;
}

function getDurations() {
  if (_settingsStore) {
    const s = _settingsStore.settings;
    return {
      work: (s.workDuration ?? 25) * 60,
      short: (s.shortBreakDuration ?? 5) * 60,
      long: (s.longBreakDuration ?? 15) * 60,
    };
  }
  return { ...DEFAULT_DURATIONS };
}

function getPomodorosUntilLong() {
  if (_settingsStore) {
    return _settingsStore.settings.pomodorosUntilLongBreak ?? 4;
  }
  return 4;
}

const STORAGE_KEY = 'tomatask_state';

function createTimerStore() {
  let mode = $state('work');
  let remaining = $state(DEFAULT_DURATIONS.work);
  let running = $state(false);
  let completedPomodoros = $state(0);
  let intervalId = null;

  /** タイマー終了時に呼ばれるコールバック一覧 */
  const _onEndCallbacks = [];

  function save() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        remaining,
        running: false,
        completedPomodoros,
      })
    );
  }

  function restore() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      mode = s.mode ?? 'work';
      remaining = s.remaining ?? getDurations()[mode];
      completedPomodoros = s.completedPomodoros ?? 0;
      running = false;
    } catch {
      // 破損データは無視
    }
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      running = false;
      onTimerEnd();
      return;
    }
    remaining -= 1;
    save();
  }

  function onTimerEnd() {
    const endedMode = mode;
    if (mode === 'work') {
      completedPomodoros += 1;
      // 設定のポモドーロ数達成で長休憩へ自動遷移
      const n = getPomodorosUntilLong();
      const nextMode = completedPomodoros % n === 0 ? 'long' : 'short';
      switchMode(nextMode);
    } else {
      switchMode('work');
    }
    save();
    // 登録されたコールバックを呼ぶ
    for (const cb of _onEndCallbacks) {
      cb(endedMode, completedPomodoros);
    }
  }

  function startTimer() {
    if (running) return;
    running = true;
    intervalId = setInterval(tick, 1000);
    save();
  }

  function pauseTimer() {
    if (!running) return;
    clearInterval(intervalId);
    intervalId = null;
    running = false;
    save();
  }

  function resetTimer() {
    pauseTimer();
    remaining = getDurations()[mode];
    save();
  }

  function switchMode(newMode) {
    pauseTimer();
    mode = newMode;
    remaining = getDurations()[newMode];
    save();
  }

  /** 設定ストアを注入する（循環参照回避のため外部から呼ぶ） */
  function injectSettingsStore(store) {
    _settingsStore = store;
  }

  /**
   * タイマー終了時コールバックを登録する
   * @param {(endedMode: string, completedPomodoros: number) => void} cb
   */
  function onEnd(cb) {
    _onEndCallbacks.push(cb);
  }

  return {
    get mode() {
      return mode;
    },
    get remaining() {
      return remaining;
    },
    get running() {
      return running;
    },
    get completedPomodoros() {
      return completedPomodoros;
    },
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    restore,
    onEnd,
    injectSettingsStore,
  };
}

export const timerStore = createTimerStore();
