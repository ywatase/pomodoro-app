# tomatask

## 概要

ローカル完結のポモドーロタイマーアプリ。Obsidian タスクと連携し、強力な通知で押し忘れを防ぐ。

## 技術スタック

- **フレームワーク**: Tauri v2
- **フロントエンド**: Svelte
- **バックエンド**: Rust (Tauri commands)
- **パッケージマネージャ**: bun
- **対象 OS**: macOS (将来的に Linux/Windows も可)

## アーキテクチャ

```text
┌─────────────────────────────────┐
│           System Tray           │
├─────────────────────────────────┤
│  Svelte (UI)                    │
│  ├── Timer View                 │
│  ├── Task List View             │
│  └── Settings View              │
├─────────────────────────────────┤
│  Tauri Commands (Rust)          │
│  ├── timer: タイマー制御         │
│  ├── notification: 通知管理      │
│  │   ├── OS通知 (繰り返し)       │
│  │   └── 音声再生               │
│  ├── obsidian: vault 読み書き    │
│  └── idle: アイドル検知          │
├─────────────────────────────────┤
│  Local Storage                  │
│  ├── 設定ファイル (JSON)         │
│  └── Obsidian vault (Markdown)  │
└─────────────────────────────────┘
```

## ハーネスエンジニアリング

品質ゲートを自動化し、壊れにくい開発フローを維持する。

- **pre-commit**: lint / format / typecheck を自動実行
- **テスト戦略**: ユニットテスト + E2E テスト。機能追加前にテストを書く
- **CI**: push 時に全テスト実行
- **リンター設定は変更禁止**: hooks がブロックする

## コミット規約

- 日本語で記述
- prefix: feat/fix/docs/style/refactor/chore/test/perf
- 関心事単位でコミット（style/refactor を機能変更と混ぜない）

## コメント規約

- Code: How / Test: What / Commit: Why / Comment: Why not
