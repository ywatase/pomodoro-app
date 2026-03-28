<script>
  import { tasksStore } from '$lib/stores/tasks.svelte.js';

  let newTitle = $state('');
  let editingId = $state(null);
  let editingTitle = $state('');

  function handleAdd() {
    if (newTitle.trim()) {
      tasksStore.addTask(newTitle);
      newTitle = '';
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  function startEdit(task) {
    editingId = task.id;
    editingTitle = task.title;
  }

  function commitEdit(id) {
    if (editingTitle.trim()) {
      tasksStore.updateTitle(id, editingTitle);
    }
    editingId = null;
  }

  function cancelEdit() {
    editingId = null;
  }

  function handleEditKeydown(e, id) {
    if (e.key === 'Enter') commitEdit(id);
    if (e.key === 'Escape') cancelEdit();
  }
</script>

<div class="task-panel">
  <div class="add-row">
    <input
      class="input-new"
      type="text"
      placeholder="新しいタスクを追加..."
      bind:value={newTitle}
      onkeydown={handleKeydown}
    />
    <button class="btn-add" onclick={handleAdd} disabled={!newTitle.trim()}>+</button>
  </div>

  <ul class="task-list">
    {#each tasksStore.tasks as task (task.id)}
      <li class="task-item" class:active={tasksStore.activeTaskId === task.id} class:done={task.isCompleted}>
        <input
          type="checkbox"
          checked={task.isCompleted}
          onchange={() => tasksStore.toggleComplete(task.id)}
          aria-label="完了"
        />

        {#if editingId === task.id}
          <input
            class="input-edit"
            type="text"
            bind:value={editingTitle}
            onblur={() => commitEdit(task.id)}
            onkeydown={(e) => handleEditKeydown(e, task.id)}
            autofocus
          />
        {:else}
          <span
            class="task-title"
            role="button"
            tabindex="0"
            ondblclick={() => startEdit(task)}
            onkeydown={(e) => e.key === 'Enter' && startEdit(task)}
          >
            {task.title}
          </span>
        {/if}

        <span class="pomodoro-count" title="完了ポモドーロ数">
          🍅{task.completedPomodoros}
        </span>

        <button
          class="btn-select"
          class:selected={tasksStore.activeTaskId === task.id}
          onclick={() => tasksStore.setActiveTask(task.id === tasksStore.activeTaskId ? null : task.id)}
          title="このタスクで作業"
        >
          {tasksStore.activeTaskId === task.id ? '▶' : '○'}
        </button>

        <button
          class="btn-delete"
          onclick={() => tasksStore.deleteTask(task.id)}
          aria-label="削除"
        >
          ×
        </button>
      </li>
    {/each}

    {#if tasksStore.tasks.length === 0}
      <li class="empty">タスクがありません</li>
    {/if}
  </ul>
</div>

<style>
  .task-panel {
    width: 100%;
    max-width: 360px;
  }

  .add-row {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }

  .input-new {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .input-new::placeholder {
    color: #666;
  }

  .btn-add {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #eee;
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }

  .btn-add:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .task-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    border: 1px solid transparent;
    transition: border-color 0.2s;
  }

  .task-item.active {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }

  .task-item.done .task-title {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .task-title {
    flex: 1;
    font-size: 0.85rem;
    cursor: default;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .input-edit {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #eee;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .pomodoro-count {
    font-size: 0.7rem;
    color: #888;
    white-space: nowrap;
  }

  .btn-select {
    background: transparent;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0 0.2rem;
  }

  .btn-select.selected {
    color: #e74c3c;
  }

  .btn-delete {
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0 0.2rem;
    line-height: 1;
  }

  .btn-delete:hover {
    color: #e74c3c;
  }

  .empty {
    text-align: center;
    color: #555;
    font-size: 0.8rem;
    padding: 0.5rem;
  }
</style>
