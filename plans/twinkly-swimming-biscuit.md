# ゴール削除機能 追加計画

## Context

ゴール一覧画面（`/goal`）にゴールを丸ごと削除するボタンがないため追加する。
現在はアーカイブ機能（論理削除）のみで、完全削除ができない。

**制約**: 誤削除防止のため、アーカイブ済みのゴールのみ削除可能とする。

---

## 難易度評価

```
難易度: ★★☆
根拠: 3ファイル, 約120行, 2コンポーネント連携
リスク: 関連データ削除の順序誤りによる外部キー制約違反の可能性
```

---

## 変更ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `app/api/goals/[id]/route.ts` | 修正 | DELETEメソッド追加 |
| `app/goal/GoalListClient.tsx` | 修正 | 削除ボタン、モーダル、削除処理追加 |
| `components/goal/delete-confirm-modal.tsx` | 新規 | 削除確認モーダルコンポーネント |

---

## 実装詳細

### 1. API: DELETEメソッド追加

**ファイル**: `app/api/goals/[id]/route.ts`

**削除順序**（外部キー依存関係の逆順）:
1. `video_node_mappings` 削除（skill_nodes経由でnode_idを取得）
2. `skill_nodes` 削除
3. `goal_conversations` 削除
4. `goals` 削除

**バリデーション**:
- アーカイブ済み（`status === "archived"`）のみ削除可能
- アクティブなゴールを削除しようとすると 400 エラー

### 2. UI: 削除ボタン追加

**ファイル**: `app/goal/GoalListClient.tsx`

- state追加: `deleteTarget`, `isDeleting`
- `handleDelete` 関数追加
- `GoalCard` に削除ボタン追加（アーカイブ済みのみ表示）
- モーダル表示条件分岐追加

### 3. モーダルコンポーネント

**ファイル**: `components/goal/delete-confirm-modal.tsx`

- 既存モーダルパターン（`video-register-modal.tsx`）に準拠
- Props: `goalTitle`, `nodeCount`, `onConfirm`, `onClose`, `isDeleting`
- 警告メッセージ: スキルノード数も表示

---

## 処理フロー

```
[削除ボタンクリック]（アーカイブ済みのみ表示）
        ↓
[DeleteConfirmModal表示]
        ↓
[削除確認] → DELETE /api/goals/[id]
        ↓
[API: archived確認] → NG → 400 Error
        ↓ OK
[関連データ削除] → video_node_mappings → skill_nodes → goal_conversations
        ↓
[goals削除]
        ↓
[UI更新] → ゴール一覧から削除
```

---

## 検証方法

1. **正常系**: アーカイブ済みゴールを削除
   - 削除ボタンが表示される（アーカイブセクション）
   - モーダルでゴール名とノード数が表示される
   - 削除実行 → 一覧から消える

2. **異常系**: アクティブゴールには削除ボタンが表示されない

3. **DB確認**: 削除後、関連テーブルも削除されている

---

## 参考

- 既存モーダルパターン: `components/videos/video-register-modal.tsx`
- 既存APIパターン: `app/api/goals/[id]/route.ts`（PATCH）
