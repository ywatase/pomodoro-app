/**
 * Obsidian タスク同期
 * - vault 内の Markdown ファイルから `- [ ]` / `- [x]` をパース
 * - タグ・ファイル・日付でフィルタリング
 * - tomatask のタスクリストと双方向同期
 * - 完了状態を vault ファイルに書き戻す
 */

import { readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs';

/**
 * Markdown テキストから Obsidian タスク行を抽出する
 * @param {string} content - ファイル内容
 * @param {string} filePath - 元ファイルパス（IDに使用）
 * @returns {Array<{id: string, title: string, isCompleted: boolean, lineIndex: number, raw: string}>}
 */
export function parseObsidianTasks(content, filePath) {
  const lines = content.split('\n');
  const tasks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchUnchecked = line.match(/^(\s*-\s+)\[ \]\s+(.+)$/);
    const matchChecked = line.match(/^(\s*-\s+)\[x\]\s+(.+)$/i);
    if (matchUnchecked) {
      tasks.push({
        id: `obsidian:${filePath}:${i}`,
        title: matchUnchecked[2].trim(),
        isCompleted: false,
        lineIndex: i,
        raw: line,
        filePath,
      });
    } else if (matchChecked) {
      tasks.push({
        id: `obsidian:${filePath}:${i}`,
        title: matchChecked[2].trim(),
        isCompleted: true,
        lineIndex: i,
        raw: line,
        filePath,
      });
    }
  }
  return tasks;
}

/**
 * ファイル内容の指定行の完了状態を切り替えた新しい内容を返す
 * @param {string} content
 * @param {number} lineIndex
 * @param {boolean} completed
 * @returns {string}
 */
function toggleTaskLine(content, lineIndex, completed) {
  const lines = content.split('\n');
  const line = lines[lineIndex];
  if (completed) {
    lines[lineIndex] = line.replace(/^(\s*-\s+)\[ \]/, '$1[x]');
  } else {
    lines[lineIndex] = line.replace(/^(\s*-\s+)\[x\]/i, '$1[ ]');
  }
  return lines.join('\n');
}

/**
 * タスクの完了状態を vault ファイルに書き戻す
 * @param {string} filePath
 * @param {number} lineIndex
 * @param {boolean} completed
 */
export async function writeTaskCompletion(filePath, lineIndex, completed) {
  try {
    const content = await readTextFile(filePath);
    const updated = toggleTaskLine(content, lineIndex, completed);
    await writeTextFile(filePath, updated);
  } catch (err) {
    console.error('Failed to write task completion:', err);
  }
}

/**
 * vault 内の Markdown ファイル一覧を取得する（再帰的）
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
async function listMarkdownFiles(dirPath) {
  const files = [];
  try {
    const entries = await readDir(dirPath);
    for (const entry of entries) {
      if (entry.isDirectory) {
        const sub = await listMarkdownFiles(`${dirPath}/${entry.name}`);
        files.push(...sub);
      } else if (entry.name.endsWith('.md')) {
        files.push(`${dirPath}/${entry.name}`);
      }
    }
  } catch {
    // アクセス不可ディレクトリは無視
  }
  return files;
}

/**
 * フィルタオプション
 * @typedef {Object} SyncFilter
 * @property {string[]} [tags] - タスクに含まれるタグ (#tag)
 * @property {string[]} [files] - 対象ファイル名（部分一致）
 * @property {string} [date] - 日付フィルタ (YYYY-MM-DD) — daily note 名に使用
 */

/**
 * フィルタに基づいてタスクを絞り込む
 * @param {Array} tasks
 * @param {SyncFilter} filter
 * @returns {Array}
 */
function applyFilter(tasks, filter) {
  let result = tasks;
  if (filter.tags && filter.tags.length > 0) {
    result = result.filter((t) =>
      filter.tags.some((tag) => t.title.includes(tag))
    );
  }
  if (filter.files && filter.files.length > 0) {
    result = result.filter((t) =>
      filter.files.some((f) => t.filePath.includes(f))
    );
  }
  if (filter.date) {
    result = result.filter((t) => t.filePath.includes(filter.date));
  }
  return result;
}

/**
 * vault からタスクを読み込んで tomatask 形式に変換する
 * @param {string} vaultPath
 * @param {SyncFilter} [filter]
 * @returns {Promise<Array>}
 */
export async function loadObsidianTasks(vaultPath, filter = {}) {
  if (!vaultPath) return [];
  const mdFiles = await listMarkdownFiles(vaultPath);
  const allTasks = [];
  for (const filePath of mdFiles) {
    try {
      const content = await readTextFile(filePath);
      const tasks = parseObsidianTasks(content, filePath);
      allTasks.push(...tasks);
    } catch {
      // 読み取り不可ファイルは無視
    }
  }
  return applyFilter(allTasks, filter);
}

/**
 * tomatask の完了状態を Obsidian vault に書き戻す（双方向同期）
 * @param {Array<{id: string, isCompleted: boolean}>} tomataskTasks
 * @param {Array} obsidianTasks - loadObsidianTasks の結果
 */
export async function syncCompletionToVault(tomataskTasks, obsidianTasks) {
  for (const tt of tomataskTasks) {
    const ot = obsidianTasks.find((o) => o.id === tt.id);
    if (ot && ot.isCompleted !== tt.isCompleted) {
      await writeTaskCompletion(ot.filePath, ot.lineIndex, tt.isCompleted);
    }
  }
}
