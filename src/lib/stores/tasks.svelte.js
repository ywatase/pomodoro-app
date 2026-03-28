/**
 * タスクリスト管理ストア
 * - CRUD: 追加/編集/削除/完了
 * - ポモドーロセッションとの紐付け
 * - tauri-plugin-store で永続化
 */

import { Store } from '@tauri-apps/plugin-store';

const STORE_KEY = 'tasks';
const FALLBACK_KEY = 'tomatask_tasks';

let _store = null;
let _activeTaskId = null;

async function getStore() {
  if (_store) return _store;
  try {
    _store = await Store.load('tasks.json', { autoSave: true });
  } catch {
    _store = null;
  }
  return _store;
}

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createTasksStore() {
  /** @type {Array<{id: string, title: string, completedPomodoros: number, isCompleted: boolean, createdAt: string}>} */
  let tasks = $state([]);
  let activeTaskId = $state(null);

  async function load() {
    const store = await getStore();
    if (store) {
      const saved = await store.get(STORE_KEY);
      if (Array.isArray(saved)) tasks = saved;
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (raw) {
        try {
          tasks = JSON.parse(raw);
        } catch {
          // ignore
        }
      }
    }
  }

  async function save() {
    const store = await getStore();
    if (store) {
      await store.set(STORE_KEY, tasks);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(tasks));
    }
  }

  function addTask(title) {
    if (!title.trim()) return null;
    const task = {
      id: generateId(),
      title: title.trim(),
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    tasks = [task, ...tasks];
    save();
    return task.id;
  }

  function updateTitle(id, title) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, title: title.trim() } : t));
    save();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    if (activeTaskId === id) activeTaskId = null;
    save();
  }

  function toggleComplete(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    save();
  }

  function setActiveTask(id) {
    activeTaskId = id;
  }

  /** ポモドーロ完了時に呼ぶ — アクティブタスクのカウントをインクリメント */
  function incrementPomodoro(id) {
    const targetId = id ?? activeTaskId;
    if (!targetId) return;
    tasks = tasks.map((t) =>
      t.id === targetId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t
    );
    save();
  }

  return {
    get tasks() {
      return tasks;
    },
    get activeTaskId() {
      return activeTaskId;
    },
    load,
    addTask,
    updateTitle,
    deleteTask,
    toggleComplete,
    setActiveTask,
    incrementPomodoro,
  };
}

export const tasksStore = createTasksStore();
