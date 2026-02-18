# SkillForge — PRD & 実装計画

## 1. プロダクト概要

### コンセプト

AIと対話して自分だけのスキルツリーを育て、YouTube動画で枝を伸ばす。

### 解決する課題

YouTube動画は断片的で、複数動画を横断した学習体系への昇華ができない。NotebookLM等の既存ツールは「ある時点での情報整理」はできるが、「学習の縦軸（進捗・ギャップ・次の一歩）」を管理できない。

### 二層モデル

- Knowledge Layer（AI生成テキスト）: 「何を学ぶか」— 概念・関係・構造
- Practice Layer（YouTube動画）: 「どう実践されるか」— 実演・実装・デバッグプロセス

動画は知識の実演補足であり、テキストの代替ではない。

### MVPの価値仮説

1. AIとの対話でゴールがスキルツリーとして具体化される瞬間に「おお」がある
2. 動画を登録すると、スキルツリー上のカバー範囲と未カバー領域が一目で分かる
3. 動画間の重複検出で「15時間の動画群が実質5時間分」と分かる時間節約


---
## 2. 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 15 App Router |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| DB / BaaS | Supabase (PostgreSQL) |
| AI API | Z.AI Coding Plan (GLM-4.7 — OpenAI SDK互換) |
| ホスティング | Vercel（予定） |

### Z.AI API 仕様

```
エンドポイント: https://api.z.ai/api/coding/paas/v4
環境変数: ZAI_API_KEY
互換性: OpenAI SDK完全互換（baseURL差し替えのみ）
モデル: glm-4.7（Coding Plan対象モデル）
```

Next.jsからの呼び出し例（OpenAI SDK経由）:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/coding/paas/v4",
});

const response = await client.chat.completions.create({
  model: "glm-4.7",
  messages: [...],
  response_format: { type: "json_object" }, // Structured Output対応
  stream: true, // ストリーミング対応
});
```

npm パッケージ: `openai`（npm install openai）


---
## 3. プロジェクト構成

### リポジトリ

```
https://github.com/sudat/skill-forge
```

### ディレクトリ構造（最上位はapp/、srcは使わない）

```
skill-forge/
├── app/
│   ├── globals.css
│   ├── layout.tsx           # ルートレイアウト（サイドバー付き）
│   ├── page.tsx             # ダッシュボード
│   ├── goal/
│   │   └── page.tsx         # ゴール設定AI対話（スケルトン実装済み）
│   ├── tree/
│   │   └── page.tsx         # スキルツリー表示（スケルトン実装済み）
│   ├── videos/
│   │   └── page.tsx         # 動画ライブラリ（スケルトン実装済み）
│   ├── gap/
│   │   └── page.tsx         # ギャップ分析（スケルトン実装済み）
│   └── api/                 # ← 新規作成が必要
│       ├── chat/
│       │   └── route.ts     # ゴール対話AIエンドポイント
│       ├── videos/
│       │   ├── route.ts     # 動画登録
│       │   └── analyze/
│       │       └── route.ts # 動画AI解析
│       └── tree/
│           └── generate/
│               └── route.ts # スキルツリー生成/更新
├── components/
│   ├── sidebar.tsx          # 実装済み
│   ├── skill-tree/          # ← 新規作成が必要
│   │   ├── tree-view.tsx
│   │   ├── tree-node.tsx
│   │   └── node-detail.tsx
│   ├── chat/                # ← 新規作成が必要
│   │   ├── chat-panel.tsx
│   │   └── chat-message.tsx
│   └── videos/              # ← 新規作成が必要
│       ├── video-register-modal.tsx
│       └── video-card.tsx
├── lib/
│   ├── constants.ts         # 実装済み
│   ├── skill-tree.ts        # 実装済み（buildTree, flattenTree, countByStatus）
│   ├── supabase/
│   │   ├── client.ts        # 実装済み（ブラウザ用）
│   │   └── server.ts        # 実装済み（サーバー用）
│   └── ai/                  # ← 新規作成が必要
│       ├── client.ts        # Z.AI OpenAIクライアント初期化
│       └── prompts.ts       # 各機能のシステムプロンプト定義
├── types/
│   └── database.ts          # 実装済み（Supabase型定義 + アプリ型エイリアス）
├── .env.local               # 設定済み（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ZAI_API_KEY）
└── .env.local.example
```


---
## 4. データベース設計（実装済み）

### Supabase プロジェクト情報

```
Project ID: qqmgmycxwfddovgkzdos
Region: ap-northeast-1（東京）
URL: https://qqmgmycxwfddovgkzdos.supabase.co
```

### ER図

```
goal (1) ──── (N) goal_conversations
  │
  └── (1) ──── (N) skill_nodes (自己参照: parent_id)
                      │
                      └── (N) ──── video_node_mappings ──── (N) videos
                                                              │
                                                    video_overlaps (自己結合)
```

### テーブル一覧（全6テーブル、RLS有効化済み、MVP用全許可ポリシー付き）

| テーブル | 役割 | 主要カラム |
|---------|------|-----------|
| goals | 学習ゴール | title, description, status(active/archived) |
| goal_conversations | AI対話履歴 | goal_id, role(user/assistant), message, triggered_tree_update |
| skill_nodes | スキルツリー本体（隣接リスト） | goal_id, parent_id, label, knowledge_text, status, coverage_score, depth, sort_order |
| videos | 登録動画 | title, url, transcript, summary, key_points(JSONB), analysis_status |
| video_node_mappings | 動画⇔ノードマッピング | video_id, node_id, relevance_score, coverage_detail, timestamp_start/end |
| video_overlaps | 動画間重複分析 | video_a_id, video_b_id, overlap_score, overlapping_topics(JSONB), recommendation |

### 設計上の意図

- skill_nodes.knowledge_text: ノードに直接保持（MVP規模では正規化不要）
- skill_nodes.coverage_score: 非正規化キャッシュ（video_node_mappingsから算出、動画登録時に更新）
- video_overlaps: CHECK (video_a_id < video_b_id) で重複レコード防止
- 全テーブルにuser_id保持（MVPでは未使用、将来の認証対応用）

### 型定義

`types/database.ts` に以下のアプリケーション型エイリアスが定義済み:

```typescript
export type Goal = Tables<"goals">
export type GoalConversation = Tables<"goal_conversations">
export type SkillNode = Tables<"skill_nodes">
export type Video = Tables<"videos">
export type VideoNodeMapping = Tables<"video_node_mappings">
export type VideoOverlap = Tables<"video_overlaps">
export type SkillNodeWithChildren = SkillNode & { children: SkillNodeWithChildren[] }
export type SkillNodeStatus = "mastered" | "learned" | "in_progress" | "available" | "locked"
export type VideoAnalysisStatus = "pending" | "analyzing" | "completed" | "failed"
```

### ユーティリティ関数（lib/skill-tree.ts に実装済み）

- `buildTree(nodes: SkillNode[]): SkillNodeWithChildren[]` — フラット配列→ツリー構造
- `flattenTree(nodes: SkillNodeWithChildren[]): SkillNodeWithChildren[]` — ツリー→フラット
- `countByStatus(nodes: SkillNodeWithChildren[])` — ステータス別集計

### UIステータス定義（lib/constants.ts に実装済み）

| ステータス | 色 | 日本語ラベル | 意味 |
|-----------|-----|------------|------|
| mastered | 緑 #22c55e | 習得済み | 動画カバー十分 + 学習完了 |
| learned | 青 #3b82f6 | 学習中 | 動画登録あり、学習進行中 |
| in_progress | 黄 #f59e0b | 着手中 | 学習開始済み |
| available | 紫 #8b5cf6 | 解放済み | 親ノードが完了し学習可能 |
| locked | 灰 #4b5563 | 未解放 | 前提スキル未達 |


---
## 5. 実装タスク

### 前提: 実装済みのもの

- Next.js 15プロジェクト基盤
- Supabase接続（lib/supabase/client.ts, server.ts）
- DB型定義（types/database.ts）
- ルートレイアウト + サイドバー
- 5ページのスケルトンUI（ダッシュボード、ゴール設定、スキルツリー、動画ライブラリ、ギャップ分析）
- UIテーマ（ダークテーマ、RPG風ネオンアクセント）

---

### Task 3: ゴール対話AI → スキルツリー生成（コア機能）

このタスクがアプリの心臓部。ユーザーが「フルスタックエンジニアになりたい」と入力すると、AIがヒアリングしながらスキルツリーを生成し、各ノードにknowledge_textを自動付与する。

#### 3-1. AI クライアント初期化

ファイル: `lib/ai/client.ts`

```typescript
import OpenAI from "openai";

export const aiClient = new OpenAI({
  apiKey: process.env.ZAI_API_KEY!,
  baseURL: "https://api.z.ai/api/coding/paas/v4",
});

export const AI_MODEL = "glm-5";
```

依存パッケージ: `npm install openai`

#### 3-2. システムプロンプト設計

ファイル: `lib/ai/prompts.ts`

2つのプロンプトが必要:

(A) ゴール対話プロンプト（GOAL_CHAT_SYSTEM_PROMPT）

役割: メンターとして対話し、学習ゴールを具体化する。十分な情報が集まったらスキルツリーをJSON形式で出力する。

挙動の要件:
- 最初のユーザー入力に対して、2〜3個の質問で現在の経験レベル・優先領域を確認する
- 3〜5ラウンドの対話後、スキルツリーを生成する
- スキルツリー生成時はresponse_format: json_objectで出力し、以下のスキーマに従う

```typescript
type TreeGenerationResponse = {
  type: "tree_generation";
  message: string; // ユーザーに表示するメッセージ
  tree: {
    nodes: Array<{
      temp_id: string;        // "node_1" 等の一時ID
      parent_temp_id: string | null; // ルートはnull
      label: string;
      knowledge_text: string; // 200〜500文字の学習テキスト
      depth: number;
      sort_order: number;
    }>;
  };
};

type ChatResponse = {
  type: "chat";
  message: string; // 通常の対話メッセージ
};
```

- ツリーの推奨サイズ: ルート1 + 大カテゴリ3〜5 + 各カテゴリ配下3〜5ノード = 合計15〜30ノード
- knowledge_textは各ノードに必ず付与する。概念の定義、なぜ重要か、学習の指針を含める
- ノードのstatusは全て"available"で初期化する（ルートのみ"in_progress"）

(B) ナレッジ生成プロンプト（KNOWLEDGE_GEN_SYSTEM_PROMPT）

後からノードを追加・更新する際に個別ノードのknowledge_textを生成するためのプロンプト。スキルツリーの全体構造とそのノードの位置を入力として受け取り、500文字程度のknowledge_textを出力する。

#### 3-3. API Route: ゴール対話

ファイル: `app/api/chat/route.ts`

メソッド: POST（ストリーミング）

リクエスト:
```typescript
{
  goal_id: string;     // 既存ゴールのID（新規の場合はnull）
  message: string;     // ユーザーの入力
  goal_title?: string; // 新規ゴール作成時のタイトル
}
```

処理フロー:
1. goal_idがnullなら新規goalをSupabaseに作成し、goal_titleをtitleに設定
2. goal_conversationsから過去の対話履歴を取得
3. ユーザーメッセージをgoal_conversationsに保存
4. 対話履歴 + 新メッセージをZ.AI APIに送信（ストリーミング）
5. AIレスポンスをストリーミングでクライアントに返却
6. レスポンス完了後、AIメッセージをgoal_conversationsに保存
7. レスポンスにtype: "tree_generation"が含まれる場合:
   - skill_nodesテーブルに全ノードをbulk insert
   - temp_idとDBのidの対応表を使ってparent_idを解決
   - triggered_tree_update = true でconversationレコードを更新

レスポンス: ReadableStream（Server-Sent Events）

ストリーミングの形式:
```
data: {"type": "chat_delta", "content": "テキスト断片"}
data: {"type": "tree_generated", "goal_id": "...", "node_count": 20}
data: {"type": "done"}
```

重要: ツリー生成時はストリーミングを使わず、完全なJSONレスポンスを取得してからパースする。対話のみの場合はストリーミングする。AIの応答がtype: "tree_generation"かtype: "chat"かを判定するため、response_format: { type: "json_object" } を常に使い、AIの出力のtypeフィールドで分岐する。

#### 3-4. チャットUI

ファイル: `app/goal/page.tsx`（既存スケルトンを置換）

コンポーネント構成:
- `components/chat/chat-panel.tsx`: チャットパネル全体（メッセージリスト + 入力欄）
- `components/chat/chat-message.tsx`: 個別メッセージ表示

UI要件:
- ダークテーマ継続。ユーザーメッセージは右寄せ + 薄い紫背景、AIは左寄せ
- 入力欄は画面下部に固定。Enterで送信、Shift+Enterで改行
- ストリーミング中はメッセージが段階的に表示される
- AIがスキルツリーを生成したら、チャット内にインラインで「🌳 スキルツリーが生成されました（20ノード）」のような通知を表示
- ゴールが未選択の場合、最初のメッセージ送信時にゴールタイトルの入力を促す（または最初のメッセージをゴールタイトルとして自動使用）

状態管理:
- ゴールの選択/作成状態
- 対話履歴（初回ロード時にSupabaseから取得）
- ストリーミング中のフラグ
- 生成されたツリーの有無

#### 3-5. 受け入れ条件

- [x] 「フルスタックエンジニアになりたい」と入力すると、AIが2〜3回質問してくる
- [x] 対話後にスキルツリーが生成され、skill_nodesテーブルに15〜30ノードがinsertされる
- [x] 各ノードにknowledge_textが付与されている
- [x] 対話履歴がgoal_conversationsに保存され、ページリロード後も復元される
- [x] ストリーミングでメッセージがリアルタイム表示される

---

### Task 4: スキルツリー表示UI

ゴール設定で生成されたスキルツリーを視覚的に表示し、各ノードの詳細（knowledge_text + マッピング済み動画）を閲覧できるようにする。

#### 4-1. ツリー表示コンポーネント

ファイル: `components/skill-tree/tree-view.tsx`

lib/skill-tree.tsのbuildTree()を使って、フラットなskill_nodesをツリー構造に変換して表示する。

表示形式: インデントリスト（左サイドパネル、幅380px）。各ノードはステータスに応じた色のドットアイコン + ラベル + カバレッジバーで構成。

```
🟢 フルスタックエンジニア ████████ 80%
  🔵 フロントエンド ██████░░ 60%
    🟡 React基礎 ████████ 85%
    🟣 状態管理 ░░░░░░░░ 0%
    🔒 テスト ░░░░░░░░ 0%
  🔵 バックエンド ██████░░ 55%
    ...
```

ノードクリックで右パネルに詳細を表示する。

#### 4-2. ノード詳細パネル

ファイル: `components/skill-tree/node-detail.tsx`

右パネル（flex-1）に表示する内容:
- ノードラベル + ステータスバッジ
- knowledge_text（Markdown形式で表示）
- カバレッジスコア（プログレスバー）
- マッピング済み動画リスト（video_node_mappingsからJOIN取得）
  - 各動画のrelevance_score、coverage_detail、timestamp_start〜end
- ステータス変更ボタン（手動で mastered/learned 等に変更可能）

#### 4-3. ページ統合

ファイル: `app/tree/page.tsx`（既存スケルトンを置換）

- Server ComponentでSupabaseからアクティブゴールのskill_nodesを取得
- Client Componentのtree-viewに渡す
- ゴールが未設定の場合は /goal へのリンクを表示

#### 4-4. 受け入れ条件

- [x] Task 3で生成されたスキルツリーがインデントリストで表示される
- [x] ノードクリックで右パネルにknowledge_textが表示される
- [x] ステータスの色分けがlib/constants.tsのSTATUS_CONFIGに従っている
- [x] カバレッジスコアがプログレスバーで表示される

---

### Task 5: 動画登録 + AI解析

ユーザーがYouTube動画の文字起こしを手動ペーストして登録し、AIが自動で解析（サマリー生成、キーポイント抽出、スキルノードへのマッピング）を行う。

#### 5-1. 動画登録モーダル

ファイル: `components/videos/video-register-modal.tsx`

入力フィールド:
- タイトル（必須）
- URL（任意）
- チャンネル名（任意）
- 再生時間（任意、"1:30:00" 形式）
- 文字起こし（必須、textarea）

登録ボタン押下で:
1. videosテーブルにinsert（analysis_status: "pending"）
2. AI解析APIを非同期で呼び出し

#### 5-2. API Route: 動画AI解析

ファイル: `app/api/videos/analyze/route.ts`

メソッド: POST

リクエスト:
```typescript
{
  video_id: string;
}
```

処理フロー:
1. videosテーブルからtranscriptを取得
2. analysis_statusを"analyzing"に更新
3. Z.AI APIに以下を依頼（response_format: json_object）:
   - サマリー生成（500文字程度）
   - キーポイント抽出（JSON配列）
   - 既存スキルノードとの関連度マッピング

AIへの入力:
```
- 動画の文字起こし全文
- 現在のスキルツリー構造（goal_id配下のskill_nodesのlabel一覧とID）
```

AIの出力スキーマ:
```typescript
{
  summary: string;
  key_points: Array<{
    topic: string;
    description: string;
    timestamp?: string;
  }>;
  node_mappings: Array<{
    node_id: string;        // 既存skill_nodeのUUID
    relevance_score: number; // 0-100
    coverage_detail: string;
    timestamp_start?: string;
    timestamp_end?: string;
  }>;
}
```

4. 結果をDBに書き込み:
   - videos: summary, key_points, analysis_status = "completed" を更新
   - video_node_mappings: node_mappingsをbulk insert
   - skill_nodes: 関連ノードのcoverage_scoreを再計算して更新
     - coverage_score = 関連するmappingsのrelevance_scoreの最大値（簡易計算。MVPとしてはこれで十分）

5. 既存動画との重複チェック:
   - 既に登録済みの動画がある場合、新規動画のkey_pointsと既存動画のkey_pointsをAIに比較させる
   - video_overlapsに結果をinsert

エラー時: analysis_status = "failed" に更新

#### 5-3. 動画ライブラリページ

ファイル: `app/videos/page.tsx`（既存スケルトンを置換）

- 動画カード一覧表示
- analysis_statusに応じたバッジ（未解析/解析中/解析済み/失敗）
- 動画クリックで詳細モーダルまたはページ（summary、key_points、マッピング済みノード一覧）
- 「＋ 動画を登録」ボタンで登録モーダルを開く
- 解析失敗時の再実行ボタン

#### 5-4. 受け入れ条件

- [x] 動画の文字起こしをペーストして登録できる
- [x] 登録後、AIがサマリーとキーポイントを自動生成する
- [x] 既存スキルノードとの関連度マッピングが自動で行われる
- [x] マッピング結果に基づきskill_nodes.coverage_scoreが更新される
- [x] 2本目以降の動画登録時、既存動画との重複分析が行われる

---

### Task 6: ギャップ分析 + 重複検出

スキルツリーの全体像に対して、動画でカバーされている領域と未カバー領域を分析し、次の学習ステップを提案する。

#### 6-1. ギャップ分析ページ

ファイル: `app/gap/page.tsx`（既存スケルトンを置換）

表示内容:

(A) カバレッジヒートマップ
- スキルツリーのノードをcoverage_scoreに基づいて色分け表示
- 高カバレッジ（緑） → 中（黄） → 低（赤） → 未カバー（灰）
- ツリー全体のカバレッジ率をサマリー表示

(B) 未カバーノード一覧
- coverage_score = 0 のノードをリスト表示
- 各ノードのknowledge_textの冒頭を表示して「何を学ぶべきか」を明確に

(C) 動画重複分析
- video_overlapsテーブルの内容を表示
- overlap_scoreが高い動画ペアを警告表示
- recommendationフィールドの内容（「動画Aの方が網羅的なのでBは飛ばしてよい」等）を表示

(D) 次のステップ提案（任意：余裕があれば）
- 未カバーのavailableノード上位3つを「次に学ぶべきスキル」として提案
- 静的な計算（AIは不要。coverage_score = 0 かつ status = "available" のノードをdepth順で表示するだけ）

#### 6-2. 受け入れ条件

- [x] スキルツリー全体のカバレッジ率が表示される
- [x] 未カバーノード一覧が表示される
- [x] 動画間の重複スコアと推奨が表示される

---

### Task 7: ダッシュボード改善

ファイル: `app/page.tsx`（既存実装を拡充）

現在のスケルトンに以下を追加:

- アクティブゴールのスキルツリー全体カバレッジ率
- ステータス別ノード数の内訳（mastered: X, learned: Y, ...）
- 最近登録した動画3件
- 最近のAI対話の要約（goal_conversationsの最新数件）

データ取得はServer ComponentでSupabaseから直接。AIは不要。

#### 受け入れ条件

- [x] ダッシュボードにリアルなデータが表示される
- [x] ゴール未設定時は「ゴールを設定する」CTAが表示される（実装済み）


---
## 6. 実装順序と依存関係

```
Task 3（ゴール対話 + ツリー生成）
  │
  ├──→ Task 4（スキルツリー表示）  ← Task 3で生成されたデータを表示
  │
  └──→ Task 5（動画登録 + AI解析） ← スキルツリーが存在しないとマッピングできない
          │
          └──→ Task 6（ギャップ分析） ← マッピングデータと重複データが必要
                  │
                  └──→ Task 7（ダッシュボード改善） ← 全データが揃って初めて意味がある
```

Task 3 → Task 4 は連続で実装するのが効率的（AIレスポンスのJSONパースとDB保存の結果を即座にUI確認できる）。

Task 5 は独立性が高いが、スキルツリーが存在しないとノードマッピングのテストができないため、Task 3完了後に着手する。


---
## 7. AI プロンプト設計指針

全プロンプトに共通する方針:

- 出力言語は日本語（ユーザーが日本語で入力するため）
- response_format: { type: "json_object" } を使い、構造化出力を強制する
- JSON出力時は必ず type フィールドを含め、レスポンスの種別を判定できるようにする
- knowledge_textは200〜500文字。概念の定義 → なぜ重要か → 学習の入り口、の3段構成
- 温度（temperature）は0.7（創造性と一貫性のバランス）
- max_tokensはツリー生成時4096、通常対話時1024、動画解析時4096

プロンプト内で使う用語統一:
- 「スキルノード」（skill node）
- 「知識テキスト」（knowledge text）
- 「カバレッジ」（coverage）
- 「関連度スコア」（relevance score）


---
## 8. UIデザインガイドライン

既存実装のダークテーマを継続。新規コンポーネントは以下のルールに従う。

- 背景色: `bg-[#0c0e14]`（ページ）、`bg-white/[0.02]`〜`bg-white/[0.05]`（カード・ホバー）
- ボーダー: `border-white/[0.06]`
- テキスト: `text-gray-200`（本文）、`text-gray-400`〜`text-gray-500`（補助テキスト）
- アクセント: lib/constants.tsのSTATUS_CONFIG参照
- 角丸: `rounded-xl`（カード）、`rounded-lg`（ボタン）
- フォント: Noto Sans JP（layout.tsxで設定済み）
- グロー効果: ステータスに応じたbox-shadow（STATUS_CONFIG.glow参照）
- CSSフレームワーク: Tailwind CSS v4（`@import "tailwindcss"` 方式。v3のtailwind.config.jsは不要）


---
## 9. 注意事項・制約

- Z.AI Coding Planのエンドポイントは `https://api.z.ai/api/coding/paas/v4`（generalの `/api/paas/v4` とは異なる）
- Z.AI APIはOpenAI SDK互換だが、一部の新機能（Structured Outputs with JSON Schema strict mode等）は未検証。response_format: { type: "json_object" } は動作確認済み
- Supabase Free Planの制約: 500MB DB、1GBストレージ。トランスクリプト保存で注意
- MVPは認証なし。single-user想定
- YouTube APIは使わない（コンプライアンスリスク回避）。文字起こしはユーザーが手動ペースト
- Tailwind CSS v4を使用。v3のtailwind.config.jsではなく、CSS内の@importで設定する方式