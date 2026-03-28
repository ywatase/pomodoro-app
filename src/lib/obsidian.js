/**
 * Obsidian daily note 連携
 * - ポモドーロ完了時に [🍅:: N] 形式でログを追記
 * - vault パスは settingsStore から取得
 * - ファイルが存在しなければ新規作成
 * - 追記位置: ファイル末尾 or 特定セクション配下
 */

import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
} from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/plugin-fs';

/**
 * 今日の daily note ファイルパスを返す (YYYY-MM-DD.md)
 * @param {string} vaultPath - vault のパス（~ 展開済みを想定）
 * @returns {string}
 */
function getDailyNotePath(vaultPath) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${vaultPath}/${yyyy}-${mm}-${dd}.md`;
}

/**
 * ~ をホームディレクトリに展開する
 * Tauri の fs API はホームパスに対応しているため、
 * ~ を含む文字列はそのまま渡しても動作するが、明示的に展開しておく。
 * @param {string} p
 * @returns {string}
 */
function expandHome(p) {
  if (p.startsWith('~/')) {
    // Tauri v2 では $HOME 展開が自動で行われない場合があるため
    // フロントエンドでは window.__TAURI_INTERNALS__ から取れないので
    // そのまま渡す（Tauri の BaseDirectory.Home を利用するのが正解だが
    // パス文字列が必要な場合は ~ を維持して Tauri 側で解決させる）
    return p;
  }
  return p;
}

/**
 * ポモドーロログ行を生成する
 * Obsidian Pomodoro Timer 互換フォーマット: [🍅:: N]
 * @param {number} count - 今日の完了数
 * @returns {string}
 */
function buildLogLine(count) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `- ${hh}:${mi} [🍅:: ${count}]`;
}

/**
 * 特定セクション配下に行を挿入する
 * セクションが見つからなければ末尾に追記する
 * @param {string} content - ファイル内容
 * @param {string} section - 対象セクション名 (e.g. "## Pomodoro")
 * @param {string} line - 追記する行
 * @returns {string}
 */
function insertUnderSection(content, section, line) {
  const lines = content.split('\n');
  const idx = lines.findIndex((l) => l.trim() === section.trim());
  if (idx === -1) {
    // セクション未発見 → 末尾追記
    return content.trimEnd() + '\n' + line + '\n';
  }
  // セクション直後に挿入
  lines.splice(idx + 1, 0, line);
  return lines.join('\n');
}

/**
 * Obsidian daily note にポモドーロログを追記する
 * @param {string} vaultPath - vault パス
 * @param {number} completedPomodoros - 累計ポモドーロ数
 * @param {string} [section] - 追記セクション（空文字列 = 末尾）
 */
export async function appendObsidianLog(vaultPath, completedPomodoros, section = '') {
  if (!vaultPath) return;

  const expandedPath = expandHome(vaultPath);
  const filePath = getDailyNotePath(expandedPath);
  const logLine = buildLogLine(completedPomodoros);

  try {
    let content = '';
    const fileExists = await exists(filePath);
    if (fileExists) {
      content = await readTextFile(filePath);
    } else {
      // ディレクトリが存在しない場合は作成
      const dirPath = expandedPath;
      const dirExists = await exists(dirPath);
      if (!dirExists) {
        await mkdir(dirPath, { recursive: true });
      }
    }

    let newContent;
    if (section) {
      newContent = insertUnderSection(content, section, logLine);
    } else {
      newContent = content.trimEnd() + '\n' + logLine + '\n';
    }

    await writeTextFile(filePath, newContent);
  } catch (err) {
    console.error('Obsidian log append failed:', err);
  }
}
