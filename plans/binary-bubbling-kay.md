# SkillForge デザイン改善計画

## Context

SkillForgeの全ページデザインを改善し、Attio LP風のミニマルで清潔感のあるUIを実現する。

### 現状の課題
- 全体的にコントラストが低い（text-gray-500/600が多用）
- マイクロインタラクションが不足
- 余白（ホワイトスペース）の活用が限定的
- 視覚的階層が弱い
- ライトモード未対応

### 解決後のゴール
- ダークモード/ライトモード両対応
- ミニマルさと清潔感の実現
- マイクロインタラクションの追加
- Bentoグリッド（適材適所）
- 情報設計の改善

---

## Design System

### カラーパレット

#### ダークモード
```css
/* ベースカラー - より深みのある黒 */
--bg-primary: #09090b;
--bg-secondary: #18181b;
--bg-tertiary: #27272a;

/* アクセント */
--accent-primary: #a855f7;  /* パープル */
--accent-secondary: #3b82f6; /* ブルー */
--accent-tertiary: #22c55e;  /* グリーン */

/* テキスト - コントラスト改善 */
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-tertiary: #71717a;

/* ボーダー */
--border-subtle: rgba(255,255,255,0.08);
--border-default: rgba(255,255,255,0.12);
--border-accent: rgba(168,85,247,0.3);
```

#### ライトモード
```css
/* ベースカラー */
--bg-primary: #ffffff;
--bg-secondary: #f4f4f5;
--bg-tertiary: #e4e4e7;

/* アクセント（同一） */
--accent-primary: #9333ea;
--accent-secondary: #2563eb;
--accent-tertiary: #16a34a;

/* テキスト */
--text-primary: #09090b;
--text-secondary: #52525b;
--text-tertiary: #a1a1aa;

/* ボーダー */
--border-subtle: rgba(0,0,0,0.06);
--border-default: rgba(0,0,0,0.1);
--border-accent: rgba(147,51,234,0.3);
```

### コンポーネントパターン

#### カード（刷新）
```tsx
<div className="p-6 bg-[var(--bg-secondary)] rounded-2xl
  border border-[var(--border-subtle)]
  hover:border-[var(--border-default)]
  transition-all duration-300
  hover:shadow-lg hover:shadow-purple-500/5">
```

#### ボタン（刷新）
```tsx
<button className="px-6 py-3 rounded-xl
  bg-[var(--accent-primary)] text-white font-medium
  hover:bg-[var(--accent-primary)]/90
  hover:shadow-lg hover:shadow-purple-500/25
  active:scale-[0.98]
  transition-all duration-200">
```

### マイクロインタラクション

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -12px rgba(0,0,0,0.4);
}
```

---

## Implementation Plan

### Week 1: 基盤構築

#### 1.1 CSS変数定義
- **File**: `app/globals.css`
- **Tasks**:
  - ダークモード用CSS変数定義
  - ライトモード用CSS変数定義（`:root`と`.light`）
  - アニメーション定義（fadeInUp, shimmer）
  - ユーティリティクラス（card-hover-lift, animate-fade-in-up）

#### 1.2 テーマ管理
- **File**: `lib/theme.ts`（新規作成）
- **Tasks**:
  - テーマ設定ユーティリティ

#### 1.3 テーマプロバイダー
- **File**: `app/layout.tsx`
- **Tasks**:
  - `next-themes`パッケージ導入
  - `ThemeProvider`でラップ
  - フォント設定更新（weight: 400/500/700/900）

#### 1.4 テーマトグルUI
- **File**: `components/theme-toggle.tsx`（新規作成）
- **Tasks**:
  - ダーク/ライト切り替えボタン
  - アイコン（Sun/Moon）

### Week 2: コアコンポーネント

#### 2.1 Card コンポーネント
- **File**: `components/ui/card.tsx`（新規作成）
- **Tasks**:
  - 基本カード
  - ホバー効果付きカード
  - Bentoグリッド対応カード

#### 2.2 Button コンポーネント
- **File**: `components/ui/button.tsx`（新規作成）
- **Tasks**:
  - Primary（パープル）
  - Secondary（アウトライン）
  - Ghost（透明）

#### 2.3 Badge コンポーネント
- **File**: `components/ui/badge.tsx`（新規作成）
- **Tasks**:
  - ステータス用バッジ（5色）

### Week 3: ページ適用

#### 3.1 ダッシュボード
- **File**: `app/page.tsx`
- **Tasks**:
  - CSS変数への移行
  - Bentoグリッドの部分的導入
  - マイクロインタラクション追加

#### 3.2 ゴール管理
- **Files**: `app/goal/page.tsx`, `app/goal/new/page.tsx`, `app/goal/[id]/page.tsx`
- **Tasks**:
  - CSS変数への移行
  - 新コンポーネント適用

#### 3.3 動画ライブラリ
- **Files**: `app/videos/page.tsx`, `components/videos/*.tsx`
- **Tasks**:
  - CSS変数への移行
  - 新コンポーネント適用

#### 3.4 スキルツリー
- **Files**: `app/tree/page.tsx`, `components/skill-tree/*.tsx`
- **Tasks**:
  - CSS変数への移行
  - 新コンポーネント適用

#### 3.5 ギャップ分析
- **File**: `app/gap/page.tsx`
- **Tasks**:
  - CSS変数への移行
  - 新コンポーネント適用

### Week 4: 詳細調整

#### 4.1 サイドバー
- **File**: `components/sidebar.tsx`
- **Tasks**:
  - テーマトグル配置
  - CSS変数への移行

#### 4.2 ステータス設定
- **File**: `lib/constants.ts`
- **Tasks**:
  - STATUS_CONFIGの色をCSS変数参照に変更

#### 4.3 動作確認
- E2Eテスト（agent-browser）で動作確認
- ダーク/ライトモード切り替え確認
- 各ページのレンダリング確認

---

## Critical Files

| File | 変更内容 |
|------|----------|
| `app/globals.css` | CSS変数定義、アニメーション、テーマ基盤 |
| `app/layout.tsx` | テーマプロバイダー、フォント設定 |
| `app/page.tsx` | ダッシュボードBentoグリッド実装 |
| `components/sidebar.tsx` | テーマトグル配置 |
| `lib/constants.ts` | STATUS_CONFIG色設定 |
| `components/ui/card.tsx` | 新規作成 |
| `components/ui/button.tsx` | 新規作成 |
| `components/ui/badge.tsx` | 新規作成 |
| `components/theme-toggle.tsx` | 新規作成 |
| `lib/theme.ts` | 新規作成 |

---

## Verification

### テスト方法

1. **開発サーバー起動**
   ```bash
   bun run dev
   ```

2. **E2Eテスト（agent-browser）**
   ```
   agent-browser open http://localhost:3000
   agent-browser snapshot -i
   ```

3. **確認項目**
   - [ ] ダークモード表示が正しい
   - [ ] ライトモード切り替えが動作する
   - [ ] 各ページのレンダリングが正しい
   - [ ] マイクロインタラクションが動作する
   - [ ] Bentoグリッドが崩れていない

4. **ビルド確認**
   ```bash
   bun run build
   ```

---

## 難易度評価

```
難易度: ★★☆
根拠: 15 files, 500行概算, 8 components
リスク: CSS変数移行の漏れ、テーマ切り替えの実装複雑性
```

---

## References

- Attio LP: https://attio.com/
- next-themes: https://github.com/pacocoursey/next-themes
- Tailwind CSS v4: https://tailwindcss.com/
