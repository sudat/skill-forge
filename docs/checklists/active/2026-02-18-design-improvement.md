# SkillForge デザイン改善

**目的**: Attio LP風のミニマルで清潔感のあるUIを実現し、ダーク/ライトモード両対応にする

**開始日**: 2026-02-18

**進捗**: 0/20 (0%)

---

## 1. 基盤構築（Week 1）

**依存**: なし

- [ ] `next-themes`パッケージをインストール
- [ ] `app/globals.css`にCSS変数定義（ダーク/ライト両モード）
- [ ] `app/globals.css`にアニメーション定義（fadeInUp, shimmer）
- [ ] `app/globals.css`にユーティリティクラス追加
- [ ] `lib/theme.ts`作成（テーマ設定ユーティリティ）
- [ ] `app/layout.tsx`にThemeProvider設定
- [ ] `components/theme-toggle.tsx`作成（テーマ切り替えUI）

---

## 2. コアコンポーネント（Week 2）

**依存**: セクション1完了

- [ ] `components/ui/card.tsx`作成（カードコンポーネント）
- [ ] `components/ui/button.tsx`作成（ボタンコンポーネント）
- [ ] `components/ui/badge.tsx`作成（バッジコンポーネント）

---

## 3. ページ適用（Week 3）

**依存**: セクション2完了

- [ ] `app/page.tsx`（ダッシュボード）CSS変数移行
- [ ] `components/sidebar.tsx` CSS変数移行＋テーマトグル配置
- [ ] `lib/constants.ts` STATUS_CONFIGの色をCSS変数参照に変更
- [ ] `app/goal/page.tsx`, `app/goal/new/page.tsx`, `app/goal/[id]/page.tsx` CSS変数移行
- [ ] `app/videos/page.tsx`, `components/videos/*.tsx` CSS変数移行
- [ ] `app/tree/page.tsx`, `components/skill-tree/*.tsx` CSS変数移行
- [ ] `app/gap/page.tsx` CSS変数移行

---

## 4. 動作確認（Week 4）

**依存**: セクション3完了

- [ ] E2Eテスト（agent-browser）で動作確認
- [ ] ビルド確認（`bun run build`）

---

## 完了条件

- [ ] ダークモード/ライトモード切り替えが動作する
- [ ] 全ページで新しいデザインが適用されている
- [ ] マイクロインタラクションが動作する
- [ ] ビルドが成功する
