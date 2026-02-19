# チャット ローディング吹き出し表示修正

## Context

`/goal/[id]` ページで最初のチャット送信時、ローディング中の吹き出し（3点ドットアニメ）が一瞬で消える問題。

**現象:**
- 最初に一瞬ローディング吹き出しが出るが1秒程度で消える
- リロードすると正しく表示される
- 通信上の問題ではなくUIの状態管理問題

---

## 原因分析

**現状のロジック**（`chat-panel.tsx` 189-193行）:
```tsx
isStreaming={
  isLoading &&
  msg.role === "assistant" &&
  msg.content === ""  // ← 問題の箇所
}
```

**問題点:**
- APIから最初の `chat_message` イベントが届くと `msg.content` が空でなくなる
- その結果、`isStreaming` が即座に `false` になる
- API応答が速い場合、3点ドットアニメが一瞬で消える

**ChatMessageの表示ロジック**（`chat-message.tsx`）:
- `isStreaming && !content` → 3点ドットアニメ（思考中）
- `isStreaming && content` → カーソル点滅付きテキスト
- `!isStreaming` → 通常テキスト

---

## 修正方針

`msg.content === ""` の条件を削除する。

**修正後:**
```tsx
isStreaming={
  isLoading &&
  msg.role === "assistant"
}
```

これで：
- `isLoading` の間、AIメッセージは常にストリーミング状態
- コンテンツが空 → 3点ドットアニメ
- コンテンツがある → カーソル点滅付きテキスト
- API完了（`finally`で`isLoading=false`）→ 通常表示

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `components/chat/chat-panel.tsx` | 189-193行の条件から `msg.content === ""` を削除 |

---

## 難易度評価

```
難易度: ★☆☆
根拠: 1ファイル, 1行削除, 依存なし
リスク: ほぼなし
```

---

## 検証方法

1. `/goal/[id]` ページを開く
2. 最初のメッセージを送信
3. 3点ドットアニメが適切に表示されることを確認
4. AI応答が始まるとカーソル点滅に切り替わることを確認
5. 応答完了でカーソルが消えることを確認
