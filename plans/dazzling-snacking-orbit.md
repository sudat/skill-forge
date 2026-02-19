# attio-aesthetic 全ページ統一化プラン

## Context

現在、`app/page.tsx`（ダッシュボード）は attio-aesthetic の基準実装として完成しているが、その他のページ（ギャップ分析・ゴール一覧・設定・動画ライブラリ）が Hero section・with-noise・section番号ラベルを持っていない。全ページの第一印象を統一するための最小変更。

**問題**: ダッシュボード以外はページタイトルが `text-2xl` の素のテキストで、Attio感のある Hero リズムが欠如している。
**ゴール**: `with-noise` + Section番号 + `text-hero` のパターンを全対象ページに適用する。

---

## 現状スコア

| 項目 | スコア |
|------|--------|
| カラーパレット | 95/100 ✅ |
| Noise Texture | ダッシュボードのみ ⚠️ |
| Bento Grid | ダッシュボードのみ（他ページは不要） ✅ |
| Card Hover (translateY) | 部分的 ⚠️ |
| Scroll Reveal | ダッシュボードのみ ⚠️ |
| Dark Mode | 100/100 ✅ |
| **総合** | **79/100** |

---

## 変更しないページ（理由あり）

| ページ | 理由 |
|--------|------|
| `app/goal/[id]/GoalDetailClient.tsx` | `h-screen` フルスクリーン構造。Hero section を差し込む余地なし |
| `app/tree/page.tsx` | キャンバス系レンダリング。`with-noise` の `::before z-index:1` がキャンバスに重なる可能性 |

---

## 改善計画（優先度順）

### 難易度: ★☆☆
根拠: 4ファイル, 約105行追加/20行削除, 各ページが独立（影響なし）
リスク: ほぼなし。JSXの外側構造変更のみ。ロジック・状態管理に触れない。

---

### Step 1: `app/gap/page.tsx`（ギャップ分析）

**変更内容**
- アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- Hero section を追加（Section番号 `[03]`, `text-hero` タイトル, サブタイトル）
- コンテンツを `<section className="px-8 pb-20">` でラップ
- サマリーカード3枚に `card-hover-lift` クラスを追加
- `p-8` を親 `section` の `px-8` に移動（コンテンツ内部の余白は変更なし）

**基準実装**: `app/page.tsx` の Hero section パターンを参照

---

### Step 2: `app/settings/page.tsx`（設定）

**変更内容**
- `<div className="min-h-screen bg-[var(--bg-primary)] px-8 py-8">` を `with-noise` 付きに変更
- Hero section を追加（Section番号 `[05]`, `text-hero` タイトル, サブタイトル）
- `<SettingsClient />` を `<section className="px-8 pb-20">` でラップ
- `SettingsClient.tsx` 自体は変更不要

---

### Step 3: `components/videos/videos-container.tsx`（動画ライブラリ）

**変更内容**
- アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- Hero section を追加（Section番号 `[06]`, `text-hero` タイトル, 動画本数のサブタイトル）
- コンテンツを `<section className="px-8 pb-20">` でラップ

---

### Step 4: `app/goal/GoalListClient.tsx`（ゴール一覧）

**変更内容**
- アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- Hero section を追加（Section番号 `[04]`, `text-hero` タイトル）
- コンテンツを `<section className="px-8 pb-20">` でラップ
- `GoalCard` のルートdivから `transition-all duration-300` を削除し `card-hover-lift` に統一

---

## 共通テンプレート

全ページで `app/page.tsx` の以下パターンを流用する:

```tsx
<div className="min-h-screen bg-[var(--bg-primary)] with-noise">
  {/* Hero */}
  <section className="pt-12 pb-8 px-8">
    <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
      [XX] PageLabel
    </span>
    <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
      ページタイトル
    </h1>
    <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
      サブタイトル
    </p>
  </section>

  {/* Content */}
  <section className="px-8 pb-20">
    {/* 既存コンテンツ（内部の p-8 を削除） */}
  </section>
</div>
```

---

## 参照ファイル

| ファイル | 役割 |
|---------|------|
| `app/page.tsx` | Hero/with-noise/section番号の基準実装 |
| `app/globals.css` | `with-noise`, `text-hero`, `card-hover-lift` の定義確認 |
| `app/gap/page.tsx` | Step 1 改善対象 |
| `app/settings/page.tsx` | Step 2 改善対象 |
| `components/videos/videos-container.tsx` | Step 3 改善対象 |
| `app/goal/GoalListClient.tsx` | Step 4 改善対象 |

---

## 検証方法

実装後に `e2e-testing` スキルで以下を確認:
1. 各ページ（/gap, /settings, /videos, /goal）で noise texture が見える
2. ページ番号ラベル `[03]〜[06]` が表示される
3. ヘッダーテキストが大きく表示される（Hero サイズ）
4. カードにホバーすると translateY(-2px) で浮く
5. dark mode での表示が正常
