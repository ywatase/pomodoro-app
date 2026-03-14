<script>
  import { tasksStore } from '$lib/stores/tasks.svelte.js';
  import { settingsStore } from '$lib/stores/settings.svelte.js';
  import { loadObsidianTasks, syncCompletionToVault } from '$lib/obsidianSync.js';

  let obsidianTasks = $state([]);
  let loading = $state(false);
  let error = $state('');
  let filterDate = $state(todayString());
  let filterTag = $state('');

  function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function loadTasks() {
    loading = true;
    error = '';
    try {
      const vaultPath = settingsStore.settings.obsidianVaultPath;
      if (!vaultPath) {
        error = 'Vault パスが設定されていません（設定画面で入力してください）';
        return;
      }
      const filter = {};
      if (filterDate) filter.date = filterDate;
      if (filterTag) filter.tags = [filterTag];
      obsidianTasks = await loadObsidianTasks(vaultPath, filter);
    } catch (e) {
      error = `読み込みエラー: ${e}`;
    } finally {
      loading = false;
    }
  }

  async function importToTomatask() {
    for (const ot of obsidianTasks) {
      // 既にインポート済みでなければ追加
      const exists = tasksStore.tasks.find((t) => t.id === ot.id);
      if (!exists) {
        // obsidian タスクは id を保持するため直接追加
        const id = tasksStore.addTask(ot.title);
        // isCompleted を反映
        if (ot.isCompleted && id) {
          tasksStore.toggleComplete(id);
        }
      }
    }
  }

  async function syncToVault() {
    const tomataskObs = tasksStore.tasks.filter((t) => t.id.startsWith('obsidian:'));
    await syncCompletionToVault(tomataskObs, obsidianTasks);
  }
</script>

<div class="sync-panel">
  <h3>📓 Obsidian タスク同期</h3>

  <div class="filter-row">
    <input
      type="date"
      class="input-date"
      bind:value={filterDate}
    />
    <input
      type="text"
      class="input-tag"
      placeholder="#タグ"
      bind:value={filterTag}
    />
    <button class="btn-load" onclick={loadTasks} disabled={loading}>
      {loading ? '...' : '読込'}
    </button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if obsidianTasks.length > 0}
    <ul class="obs-task-list">
      {#each obsidianTasks as task (task.id)}
        <li class="obs-task" class:done={task.isCompleted}>
          <span class="obs-check">{task.isCompleted ? '✅' : '⬜'}</span>
          <span class="obs-title">{task.title}</span>
        </li>
      {/each}
    </ul>

    <div class="sync-actions">
      <button class="btn-import" onclick={importToTomatask}>
        ↓ インポート
      </button>
      <button class="btn-sync" onclick={syncToVault}>
        ↑ Vault へ同期
      </button>
    </div>
  {:else if !loading}
    <p class="empty">タスクが見つかりません</p>
  {/if}
</div>

<style>
  .sync-panel {
    width: 100%;
    max-width: 360px;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #aaa;
  }

  .filter-row {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }

  .input-date,
  .input-tag {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .input-date {
    flex: 1;
  }

  .input-tag {
    width: 80px;
  }

  .btn-load {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .btn-load:disabled {
    opacity: 0.4;
  }

  .obs-task-list {
    list-style: none;
    margin: 0 0 0.5rem 0;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .obs-task {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.4rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    font-size: 0.82rem;
  }

  .obs-task.done .obs-title {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .obs-check {
    font-size: 0.75rem;
  }

  .obs-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #ccc;
  }

  .sync-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-import,
  .btn-sync {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.3rem 0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .btn-import:hover,
  .btn-sync:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .error {
    color: #e74c3c;
    font-size: 0.8rem;
    margin: 0.3rem 0;
  }

  .empty {
    color: #555;
    font-size: 0.8rem;
    text-align: center;
    margin: 0.3rem 0;
  }
</style>
