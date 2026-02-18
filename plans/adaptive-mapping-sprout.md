# 詳細テキスト生成テイスト設定ダイアログ 実装計画

## Context

ユーザーが「詳細テキスト生成」を行う際、生成されるコンテンツのスタイルを事前にカスタマイズできるようにする。
現在は固定プロンプトで生成されるため、子供向け（親しみやすく短く簡単）やエンジニア向け（深掘りで長い）など
異なるニーズに対応できない。歯車アイコンから設定ダイアログを開き、3つのテイスト（親密さ・長さ・深さ）を
3段階で切り替えられるようにする。

## 難易度

```
難易度: ★★☆
根拠: 6ファイル, 約180行変更, 新規コンポーネント1個 + 既存5ファイル改修
リスク: prompts.ts の定数→関数化でAPIルートの呼び出し変更が必要
```

## 変更ファイル一覧（実装順序）

| 順序 | ファイル | 変更種別 | 概要 |
|------|----------|----------|------|
| 1 | `lib/constants.ts` | 追記 | TasteSettings 型・定数追加 |
| 2 | `lib/ai/prompts.ts` | 改修 | 定数 → 関数に変換（テイスト注入） |
| 3 | `components/skill-tree/taste-settings-dialog.tsx` | 新規作成 | テイスト設定ダイアログ |
| 4 | `app/goal/[id]/GoalDetailClient.tsx` | 改修 | 歯車ボタン・状態・fetch body 追加 |
| 5 | `app/api/skill-nodes/[id]/generate-detailed/route.ts` | 改修 | body パース・関数プロンプト切替 |
| 6 | `components/skill-tree/node-detail.tsx` | 改修 | localStorage 読取・fetch body 追加 |

---

## 実装詳細

### 1. `lib/constants.ts` — TasteSettings 型・定数追加

既存の `StatusConfig` 型・`STATUS_CONFIG` 定数の後ろに追加する。

```typescript
export type TasteFormality = "formal" | "normal" | "friendly";
export type TasteLength = "short" | "normal" | "detailed";
export type TasteDepth = "intro" | "standard" | "deep";

export type TasteSettings = {
  formality: TasteFormality;
  length: TasteLength;
  depth: TasteDepth;
};

export const DEFAULT_TASTE_SETTINGS: TasteSettings = {
  formality: "normal",
  length: "normal",
  depth: "standard",
};

export const TASTE_LABELS = {
  formality: { formal: "フォーマル", normal: "普通", friendly: "フレンドリー" },
  length:    { short: "短め",        normal: "普通", detailed: "詳細" },
  depth:     { intro: "入門",        standard: "標準", deep: "深掘り" },
} as const;

export const TASTE_STORAGE_KEY = "skill-forge:taste-settings";
```

---

### 2. `lib/ai/prompts.ts` — 定数 → 関数変換

`DETAILED_KNOWLEDGE_GEN_SYSTEM_PROMPT` 定数を削除し、関数 `buildDetailedKnowledgeGenPrompt` を追加する。
既存のプロンプト本文（## 入力形式 以降）はそのまま維持し、冒頭に `## 生成テイスト設定` セクションを挿入する。

```typescript
import type { TasteSettings } from "@/lib/constants";

export function buildDetailedKnowledgeGenPrompt(taste: TasteSettings): string {
  const formalityInstr = {
    formal:   "- 文体は敬語・丁寧語で統一し、フォーマルなビジネス文書のトーンで書く",
    normal:   "- 文体は標準的な敬語で書く",
    friendly: "- 文体はカジュアルで話しかけるような親しみやすいトーンで書く",
  }[taste.formality];

  const lengthInstr = {
    short:    "- 文章量は4000〜5000字を目安に、要点を絞ってコンパクトに書く",
    normal:   "- 文章量は6000〜8000字を目安に書く",
    detailed: "- 文章量は8000字以上を目標に、できる限り詳しく丁寧に書く",
  }[taste.length];

  const depthInstr = {
    intro:    "- 対象読者は初学者。専門用語は必ず補足説明し、基礎から丁寧に解説する。深掘りセクションは簡潔でよい",
    standard: "- 対象読者はある程度の基礎知識を持つ学習者。基礎と応用をバランスよく扱う",
    deep:     "- 対象読者は中〜上級者。基礎説明は最小限にとどめ、深掘りポイントと実務応用に多くの文量を割く",
  }[taste.depth];

  return `あなたは学習コンテンツ生成AIです。スキルツリーの特定ノードに対して、詳細な学習テキスト（detailed_knowledge_text）をMarkdown形式で生成します。

## 生成テイスト設定（必ず従うこと）
${formalityInstr}
${lengthInstr}
${depthInstr}

## 入力形式
... (既存の ## 入力形式 以降の本文をそのまま引き継ぐ)`;
}
```

**重要:** 関数の中の `...` 部分は `lib/ai/prompts.ts` の既存本文（170行目の ` あなたは〜` 以降の内容から
`## 入力形式` 以降を全てコピーする。`DETAILED_KNOWLEDGE_GEN_SYSTEM_PROMPT` 定数そのものは削除する。

---

### 3. `components/skill-tree/taste-settings-dialog.tsx` — 新規作成

`video-register-modal.tsx` の既存モーダルパターン（fixed overlay・backdrop click で閉じる・ダークテーマ）を踏襲。

```tsx
"use client";

import { useRef } from "react";
import type { TasteSettings, TasteFormality, TasteLength, TasteDepth } from "@/lib/constants";
import { TASTE_LABELS } from "@/lib/constants";

type Props = {
  settings: TasteSettings;
  onChange: (settings: TasteSettings) => void;
  onClose: () => void;
};

function ToggleGroup<T extends string>({ label, options, value, labels, onChange }: {
  label: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-1.5 rounded-lg text-[12px] border transition-all ${
              value === opt
                ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                : "border-white/[0.08] bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:border-white/[0.14]"
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TasteSettingsDialog({ settings, onChange, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[#0c0e14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[14px] text-gray-200">生成テイスト設定</h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all text-sm">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <ToggleGroup<TasteFormality>
            label="親密さ"
            options={["formal", "normal", "friendly"] as const}
            value={settings.formality}
            labels={TASTE_LABELS.formality}
            onChange={(v) => onChange({ ...settings, formality: v })}
          />
          <ToggleGroup<TasteLength>
            label="文章の長さ"
            options={["short", "normal", "detailed"] as const}
            value={settings.length}
            labels={TASTE_LABELS.length}
            onChange={(v) => onChange({ ...settings, length: v })}
          />
          <ToggleGroup<TasteDepth>
            label="深さ"
            options={["intro", "standard", "deep"] as const}
            value={settings.depth}
            labels={TASTE_LABELS.depth}
            onChange={(v) => onChange({ ...settings, depth: v })}
          />
        </div>
        <div className="px-5 py-3 border-t border-white/[0.06] flex justify-end">
          <button type="button" onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-[13px] bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all">
            完了
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. `app/goal/[id]/GoalDetailClient.tsx` — 歯車ボタン・状態追加

#### 追加インポート（3行目付近）
```typescript
import { TasteSettingsDialog } from "@/components/skill-tree/taste-settings-dialog";
import type { TasteSettings } from "@/lib/constants";
import { DEFAULT_TASTE_SETTINGS, TASTE_STORAGE_KEY } from "@/lib/constants";
```

#### DocumentView 関数内に状態追加（162行目付近、既存 useState の後）
```typescript
const [tasteSettings, setTasteSettings] = useState<TasteSettings>(() => {
  if (typeof window === "undefined") return DEFAULT_TASTE_SETTINGS;
  try {
    const stored = localStorage.getItem(TASTE_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TasteSettings) : DEFAULT_TASTE_SETTINGS;
  } catch {
    return DEFAULT_TASTE_SETTINGS;
  }
});
const [isTasteDialogOpen, setIsTasteDialogOpen] = useState(false);

const handleTasteChange = useCallback((settings: TasteSettings) => {
  setTasteSettings(settings);
  localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(settings));
}, []);
```

#### handleBulkGenerate 内の fetch 変更（201行目付近）
```typescript
// 変更前
const res = await fetch(`/api/skill-nodes/${nd.id}/generate-detailed`, { method: "POST" });

// 変更後
const res = await fetch(`/api/skill-nodes/${nd.id}/generate-detailed`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(tasteSettings),
});
```
`useCallback` の依存配列に `tasteSettings` を追加する。

#### JSX 変更（269〜298行）— 歯車ボタンを追加してコントロール群を div でラップ

変更前:
```tsx
{/* Bulk generate controls */}
{bulkStatus === "idle" && pendingCount > 0 && ( <button>全ノード一括生成...</button> )}
{bulkStatus === "running" && ( <div>生成中...</div> )}
{bulkStatus === "done" && ( <span>生成完了</span> )}
```

変更後:
```tsx
{/* Bulk generate controls */}
<div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => setIsTasteDialogOpen(true)}
    className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:text-gray-300 hover:border-white/[0.14] transition-colors text-sm"
    title="生成テイスト設定"
  >
    ⚙
  </button>
  {bulkStatus === "idle" && pendingCount > 0 && ( <button>全ノード一括生成...</button> )}
  {bulkStatus === "running" && ( <div>生成中...</div> )}
  {bulkStatus === "done" && ( <span>生成完了</span> )}
</div>
```

DocumentView のルート `<div className="h-full overflow-y-auto">` の末尾（315行付近）にダイアログを追加:
```tsx
{isTasteDialogOpen && (
  <TasteSettingsDialog
    settings={tasteSettings}
    onChange={handleTasteChange}
    onClose={() => setIsTasteDialogOpen(false)}
  />
)}
```

---

### 5. `app/api/skill-nodes/[id]/generate-detailed/route.ts` — body パース・プロンプト切替

#### インポート変更（9行目付近）
```typescript
// 変更前
import { DETAILED_KNOWLEDGE_GEN_SYSTEM_PROMPT } from "@/lib/ai/prompts";

// 変更後
import { buildDetailedKnowledgeGenPrompt } from "@/lib/ai/prompts";
import type { TasteSettings } from "@/lib/constants";
import { DEFAULT_TASTE_SETTINGS } from "@/lib/constants";
```

#### 引数名変更・body パース（POST 関数の先頭）
```typescript
// _req → req に変更
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: nodeId } = await params;

  // テイスト設定の読み取り（省略可能）
  let tasteSettings: TasteSettings = DEFAULT_TASTE_SETTINGS;
  try {
    const body = await req.json() as Partial<TasteSettings>;
    if (body && typeof body === "object") {
      tasteSettings = {
        formality: body.formality ?? DEFAULT_TASTE_SETTINGS.formality,
        length: body.length ?? DEFAULT_TASTE_SETTINGS.length,
        depth: body.depth ?? DEFAULT_TASTE_SETTINGS.depth,
      };
    }
  } catch { /* body なし or 不正 JSON はデフォルトで続行 */ }
```

#### プロンプト呼び出し変更（101・115行付近、2箇所）
```typescript
// 変更前
{ role: "system", content: DETAILED_KNOWLEDGE_GEN_SYSTEM_PROMPT },

// 変更後（両方の if/else ブランチで）
{ role: "system", content: buildDetailedKnowledgeGenPrompt(tasteSettings) },
```

---

### 6. `components/skill-tree/node-detail.tsx` — localStorage 読取・fetch body 追加

#### 追加インポート（5行目付近）
```typescript
import { DEFAULT_TASTE_SETTINGS, TASTE_STORAGE_KEY } from "@/lib/constants";
import type { TasteSettings } from "@/lib/constants";
```

#### handleGenerate 内の fetch 変更（45行目付近）
```typescript
// localStorage からテイスト設定を読む
let tasteSettings: TasteSettings = DEFAULT_TASTE_SETTINGS;
try {
  const stored = localStorage.getItem(TASTE_STORAGE_KEY);
  if (stored) tasteSettings = JSON.parse(stored) as TasteSettings;
} catch { /* 読取失敗時はデフォルトを使う */ }

const res = await fetch(`/api/skill-nodes/${node.id}/generate-detailed`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(tasteSettings),
});
```

---

## 動作確認手順（E2E）

1. `bun run dev` で開発サーバー起動
2. `http://localhost:3000/goal/{id}` を開く
3. 「全ノード一括生成」ボタンの左隣に ⚙ アイコンが表示されることを確認
4. ⚙ をクリック → テイスト設定ダイアログが開く
5. 各設定（親密さ・長さ・深さ）を切り替えてトグルボタンが正しくハイライトされることを確認
6. 「完了」または背景クリックでダイアログが閉じる
7. ページをリロードして設定が localStorage に保存・復元されることを確認
8. テイストを変えて詳細テキストを生成し、実際の文体・長さ・深さが変わることを確認

## 再利用する既存コード

- `components/videos/video-register-modal.tsx` — ダイアログの backdrop click パターン・スタイル参照
- `STATUS_CONFIG` パターン (`lib/constants.ts`) — 定数定義の規約に合わせて TasteSettings を追加
- `handleBulkGenerate` の `useCallback` パターン (`GoalDetailClient.tsx`) — handleTasteChange でも同様に使用
