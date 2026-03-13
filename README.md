# tomatask

ローカル完結のポモドーロタイマー。Obsidian のタスクと連携し、強力な通知で集中と記録を支援する。

## 動機

- Pomodone App は便利だが、機密情報を扱う業務ではクラウド連携が使えない
- 既存の Obsidian ポモドーロプラグインは通知が弱く、押し忘れが頻発する
- ローカルで完結しつつ、Obsidian vault と自然に連携するツールが欲しい

## 特徴

- **強い通知**: dismiss するまで繰り返す OS 通知 + 音声通知
- **アイドルリマインド**: タイマー未使用時にポモドーロ開始を促す
- **Obsidian 連携**: Daily note にセッションログを自動追記（`[🍅:: N]` 形式）
- **ローカル完結**: 外部サービスへの通信なし
- **軽量**: Tauri v2 ベースで省メモリ・省ストレージ

## 技術スタック

- [Tauri v2](https://v2.tauri.app/) - デスクトップアプリフレームワーク
- [Svelte](https://svelte.dev/) - フロントエンド
- [Rust](https://www.rust-lang.org/) - バックエンド
- [bun](https://bun.sh/) - パッケージマネージャ

## 開発

```bash
# 依存関係のインストール
bun install

# 開発サーバー起動
bun run tauri dev

# ビルド
bun run tauri build
```

## ライセンス

MIT
