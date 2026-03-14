<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settingsStore, DEFAULT_SETTINGS } from '$lib/stores/settings.svelte.js';

  onMount(() => settingsStore.load());

  function update(key, value) {
    settingsStore.update(key, value);
  }

  function handleNumberInput(key, e) {
    const val = Number(e.target.value);
    if (!isNaN(val) && val > 0) update(key, val);
  }

  function handleVolumeInput(e) {
    update('audioVolume', Number(e.target.value));
  }

  function resetDefaults() {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      settingsStore.update(k, v);
    }
  }
</script>

<main>
  <header>
    <button class="btn-back" onclick={() => goto('/')}>← 戻る</button>
    <h1>設定</h1>
  </header>

  <section>
    <h2>⏱ タイマー時間</h2>
    <div class="field">
      <label>作業時間（分）</label>
      <input
        type="number"
        min="1"
        max="120"
        value={settingsStore.settings.workDuration}
        oninput={(e) => handleNumberInput('workDuration', e)}
      />
    </div>
    <div class="field">
      <label>短休憩（分）</label>
      <input
        type="number"
        min="1"
        max="60"
        value={settingsStore.settings.shortBreakDuration}
        oninput={(e) => handleNumberInput('shortBreakDuration', e)}
      />
    </div>
    <div class="field">
      <label>長休憩（分）</label>
      <input
        type="number"
        min="1"
        max="60"
        value={settingsStore.settings.longBreakDuration}
        oninput={(e) => handleNumberInput('longBreakDuration', e)}
      />
    </div>
    <div class="field">
      <label>長休憩までのポモドーロ数</label>
      <input
        type="number"
        min="1"
        max="10"
        value={settingsStore.settings.pomodorosUntilLongBreak}
        oninput={(e) => handleNumberInput('pomodorosUntilLongBreak', e)}
      />
    </div>
  </section>

  <section>
    <h2>🔔 通知設定</h2>
    <div class="field toggle">
      <label>OS通知を有効化</label>
      <input
        type="checkbox"
        checked={settingsStore.settings.notificationEnabled}
        onchange={(e) => update('notificationEnabled', e.target.checked)}
      />
    </div>
    <div class="field">
      <label>繰り返し間隔（秒）</label>
      <input
        type="number"
        min="10"
        max="300"
        disabled={!settingsStore.settings.notificationEnabled}
        value={settingsStore.settings.notificationRepeatInterval}
        oninput={(e) => handleNumberInput('notificationRepeatInterval', e)}
      />
    </div>
  </section>

  <section>
    <h2>🔊 音声設定</h2>
    <div class="field toggle">
      <label>音声通知を有効化</label>
      <input
        type="checkbox"
        checked={settingsStore.settings.audioEnabled}
        onchange={(e) => update('audioEnabled', e.target.checked)}
      />
    </div>
    <div class="field">
      <label>音量（{Math.round(settingsStore.settings.audioVolume * 100)}%）</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        disabled={!settingsStore.settings.audioEnabled}
        value={settingsStore.settings.audioVolume}
        oninput={handleVolumeInput}
      />
    </div>
  </section>

  <section>
    <h2>⏰ アイドルリマインド</h2>
    <div class="field toggle">
      <label>リマインドを有効化</label>
      <input
        type="checkbox"
        checked={settingsStore.settings.idleRemindEnabled}
        onchange={(e) => update('idleRemindEnabled', e.target.checked)}
      />
    </div>
    <div class="field">
      <label>リマインド間隔（分）</label>
      <input
        type="number"
        min="1"
        max="60"
        disabled={!settingsStore.settings.idleRemindEnabled}
        value={settingsStore.settings.idleRemindInterval}
        oninput={(e) => handleNumberInput('idleRemindInterval', e)}
      />
    </div>
  </section>

  <section>
    <h2>📓 Obsidian 設定</h2>
    <div class="field">
      <label>Vault パス</label>
      <input
        type="text"
        class="input-text"
        value={settingsStore.settings.obsidianVaultPath}
        oninput={(e) => update('obsidianVaultPath', e.target.value)}
        placeholder="~/path/to/vault/DailyNotes"
      />
    </div>
    <div class="field">
      <label>追記セクション（空 = 末尾）</label>
      <input
        type="text"
        class="input-text"
        value={settingsStore.settings.obsidianLogSection}
        oninput={(e) => update('obsidianLogSection', e.target.value)}
        placeholder="## Pomodoro"
      />
    </div>
  </section>

  <div class="actions">
    <button class="btn-reset" onclick={resetDefaults}>デフォルトに戻す</button>
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
    padding: 1rem 1.5rem;
    max-width: 400px;
    margin: 0 auto;
    overflow-y: auto;
    height: 100vh;
    box-sizing: border-box;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.3rem;
  }

  h2 {
    font-size: 0.95rem;
    color: #aaa;
    margin: 0 0 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.3rem;
  }

  section {
    margin-bottom: 1.5rem;
  }

  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
    gap: 0.5rem;
  }

  .field label {
    font-size: 0.9rem;
    color: #ccc;
    flex: 1;
  }

  .field input[type='number'] {
    width: 70px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    text-align: right;
  }

  .field input[type='number']:disabled {
    opacity: 0.4;
  }

  .field input[type='range'] {
    width: 130px;
  }

  .field input[type='range']:disabled {
    opacity: 0.4;
  }

  .field.toggle input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .input-text {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    width: 180px;
    font-size: 0.85rem;
  }

  .btn-back {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #aaa;
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn-back:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .btn-reset {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #aaa;
    padding: 0.4rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn-reset:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
</style>
