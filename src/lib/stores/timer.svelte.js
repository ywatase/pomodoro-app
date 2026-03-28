/**
 * ポモドーロタイマーの状態管理ストア
 * - 3モード: work(25分) / short(5分) / long(15分)
 * - 4ポモドーロ後に長休憩へ自動遷移
 * - localStorage による状態永続化
 * - タイマー終了時コールバック対応
 */

const DURATIONS = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const STORAGE_KEY = 'tomatask_state';

function createTimerStore() {
  /** @type {'work' | 'short' | 'long'} */
  let mode = $state('work');
  let remaining = $state(DURATIONS.work);
  let running = $state(false);
  let completedPomodoros = $state(0);
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let intervalId;

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
      remaining = s.remaining ?? DURATIONS[mode];
      completedPomodoros = s.completedPomodoros ?? 0;
      running = false;
    } catch {
      // 破損データは無視
    }
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId);
      intervalId = undefined;
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
      // 4ポモドーロ達成で長休憩へ自動遷移
      const nextMode = completedPomodoros % 4 === 0 ? 'long' : 'short';
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
    intervalId = undefined;
    running = false;
    save();
  }

  function resetTimer() {
    pauseTimer();
    remaining = DURATIONS[mode];
    save();
  }

  /** @param {'work' | 'short' | 'long'} newMode */
  function switchMode(newMode) {
    pauseTimer();
    mode = newMode;
    remaining = DURATIONS[newMode];
    save();
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
  };
}

export const timerStore = createTimerStore();
