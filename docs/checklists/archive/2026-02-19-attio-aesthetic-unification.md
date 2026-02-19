# attio-aesthetic 全ページ統一化

## 概要
ダッシュボード以外の4ページに Hero section + with-noise + section番号ラベルを追加し、全体の第一印象を統一する。

## 進捗

### Step 1: app/gap/page.tsx（ギャップ分析）
- [x] アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- [x] Hero section 追加（[03] Gap Analysis, text-hero, サブタイトル）
- [x] コンテンツを `<section className="px-8 pb-20">` でラップ
- [x] サマリーカード3枚に `card-hover-lift` クラスを追加
- [x] early return 2つにも Hero パターンを適用

### Step 2: app/settings/page.tsx（設定）
- [x] アウターラッパーに `with-noise` を追加
- [x] Hero section 追加（[05] Settings, text-hero, サブタイトル）
- [x] `<SettingsClient />` を `<section className="px-8 pb-20">` でラップ

### Step 3: components/videos/videos-container.tsx（動画ライブラリ）
- [x] アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- [x] Hero section 追加（[06] Videos, text-hero, 動画本数サブタイトル）
- [x] コンテンツを `<section className="px-8 pb-20">` でラップ
- [x] ボタンを content section 内に移動

### Step 4: app/goal/GoalListClient.tsx（ゴール一覧）
- [x] アウターラッパーを `min-h-screen bg-[var(--bg-primary)] with-noise` に変更
- [x] Hero section 追加（[04] Goals, text-hero, サブタイトル）
- [x] コンテンツを `<section className="px-8 pb-20">` でラップ
- [x] GoalCard の `transition-all duration-300` を削除し `card-hover-lift` に統一

## E2Eテスト結果 ✅

全ページで以下を確認済み：
- /gap: [03] Gap Analysis ラベル ✅、ギャップ分析 hero テキスト ✅、サマリーカード ✅
- /settings: [05] Settings ラベル ✅、設定 hero テキスト ✅、サブタイトル ✅
- /videos: [06] Videos ラベル ✅、動画ライブラリ hero テキスト ✅、登録済み: 0本 サブタイトル ✅
- /goal: [04] Goals ラベル ✅、ゴール管理 hero テキスト ✅、サブタイトル ✅、ゴールカード ✅
