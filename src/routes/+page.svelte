<script>
  import { onDestroy, onMount } from 'svelte';
  import { timerStore } from '$lib/stores/timer.svelte.js';
  import { startRepeatNotification, stopRepeatNotification } from '$lib/notification.js';
  import { playNotificationSound } from '$lib/audio.js';
  import { settingsStore } from '$lib/stores/settings.svelte.js';

  /** @type {readonly ('work' | 'short' | 'long')[]} */
  const MODES = ['work', 'short', 'long'];

  /** @type {Record<string, string>} */
  const MODE_LABELS = {
    work: '作業',
    short: '短休憩',
    long: '長休憩',
  };

  /** @type {Record<string, string>} */
  const MODE_COLORS = {
    work: '#e74c3c',
    short: '#27ae60',
    long: '#2980b9',
  };

  /** @param {number} seconds */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** ユーザーアクション時は繰り返し通知を停止する */
  function handleStart() {
    stopRepeatNotification();
    timerStore.startTimer();
  }

  function handleReset() {
    stopRepeatNotification();
    timerStore.resetTimer();
  }

  function handleSwitchMode(m) {
    stopRepeatNotification();
    timerStore.switchMode(m);
  }

  onMount(() => {
    timerStore.restore();
    settingsStore.load();
    // タイマー終了時に音声 + 繰り返し通知を開始
    timerStore.onEnd((endedMode, count) => {
      const { audioEnabled, audioVolume, notificationEnabled } = settingsStore.settings;
      playNotificationSound(endedMode, audioVolume, audioEnabled);
      if (notificationEnabled) {
        startRepeatNotification(endedMode, count);
      }
    });
  });

  onDestroy(() => {
    timerStore.pauseTimer();
    stopRepeatNotification();
  });
</script>

<main style="--accent: {MODE_COLORS[timerStore.mode]}">
  <div class="session-info">
    <span class="session-count">🍅 × {timerStore.completedPomodoros}</span>
    {#if timerStore.completedPomodoros > 0}
      <span class="session-hint">
        あと {4 - (timerStore.completedPomodoros % 4)} セットで長休憩
      </span>
    {/if}
  </div>

  <div class="mode-tabs" role="tablist">
    {#each MODES as m}
      <button
        role="tab"
        aria-selected={timerStore.mode === m}
        class:active={timerStore.mode === m}
        onclick={() => handleSwitchMode(m)}
      >
        {MODE_LABELS[m]}
      </button>
    {/each}
  </div>

  <div class="timer" aria-live="polite">
    {formatTime(timerStore.remaining)}
  </div>

  <div class="controls">
    {#if timerStore.running}
      <button class="btn btn-pause" onclick={() => timerStore.pauseTimer()}>一時停止</button>
    {:else}
      <button class="btn btn-start" onclick={handleStart}>開始</button>
    {/if}
    <button class="btn btn-reset" onclick={handleReset}>リセット</button>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #1a1a2e;
    color: #eee;
    font-family: 'Segoe UI', system-ui, sans-serif;
    user-select: none;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1.5rem;
    padding: 1rem;
  }

  .session-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-height: 3rem;
  }

  .session-count {
    font-size: 1.4rem;
  }

  .session-hint {
    font-size: 0.8rem;
    color: #aaa;
  }

  .mode-tabs {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .mode-tabs button {
    background: transparent;
    border: none;
    color: #aaa;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .mode-tabs button.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  .timer {
    font-size: 6rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--accent);
    text-shadow: 0 0 30px color-mix(in srgb, var(--accent) 40%, transparent);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.2s;
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn-start {
    background: var(--accent);
    color: #fff;
    min-width: 120px;
  }

  .btn-pause {
    background: #f39c12;
    color: #fff;
    min-width: 120px;
  }

  .btn-reset {
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
  }

  .btn-reset:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
