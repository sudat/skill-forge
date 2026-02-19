"use client";

import { useState, useRef, useEffect } from "react";
import type { GoalConversation } from "@/types/database";
import { ChatMessage, TreeGeneratedNotice } from "./chat-message";

type MessageItem =
  | { kind: "message"; role: "user" | "assistant"; content: string; id: string }
  | { kind: "tree"; nodeCount: number; goalId: string; id: string };

type ChatPanelProps = {
  initialGoalId: string | null;
  initialHistory: GoalConversation[];
  onGoalCreated?: (goalId: string) => void;
};

export function ChatPanel({ initialGoalId, initialHistory, onGoalCreated }: ChatPanelProps) {
  const [goalId, setGoalId] = useState<string | null>(initialGoalId);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>(() =>
    initialHistory.map((c) => ({
      kind: "message" as const,
      role: c.role as "user" | "assistant",
      content: c.message,
      id: c.id,
    }))
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { kind: "message", role: "user", content: text, id: userMsgId },
    ]);
    setInput("");
    setIsLoading(true);

    // AIの返信プレースホルダー
    const aiMsgId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { kind: "message", role: "assistant", content: "", id: aiMsgId },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goalId,
          message: text,
          goal_title: !goalId ? text.slice(0, 100) : undefined,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as Record<string, unknown>;

            if (event.type === "goal_created") {
              const newGoalId = event.goal_id as string;
              setGoalId(newGoalId);
              onGoalCreated?.(newGoalId);
            } else if (event.type === "chat_message") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId && m.kind === "message"
                    ? { ...m, content: event.message as string }
                    : m
                )
              );
            } else if (event.type === "tree_generated") {
              // AIメッセージの内容を更新してツリー通知を追加
              setMessages((prev) => {
                const updated = prev.map((m) =>
                  m.id === aiMsgId && m.kind === "message"
                    ? { ...m, content: event.message as string }
                    : m
                );
                const treeItem: MessageItem = {
                  kind: "tree",
                  nodeCount: event.node_count as number,
                  goalId: event.goal_id as string,
                  id: crypto.randomUUID(),
                };
                return [...updated, treeItem];
              });
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId && m.kind === "message"
                    ? {
                        ...m,
                        content: `エラーが発生しました: ${event.message as string}`,
                      }
                    : m
                )
              );
            }
          } catch {
            // JSON parse error は無視
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId && m.kind === "message"
            ? { ...m, content: "通信エラーが発生しました。もう一度お試しください。" }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isEmpty && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-5">🌳</div>
              <p className="text-gray-300 mb-2 text-[15px]">
                あなたの学習ゴールを教えてください
              </p>
              <p className="text-sm text-gray-600">
                例：「フルスタックエンジニアになりたい」「英語でビジネス交渉ができるようになりたい」
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.kind === "tree") {
            return (
              <TreeGeneratedNotice
                key={msg.id}
                nodeCount={msg.nodeCount}
                goalId={msg.goalId}
              />
            );
          }
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={
                isLoading &&
                msg.role === "assistant"
              }
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="flex gap-2.5 items-end bg-white/[0.04] rounded-xl p-3 border border-white/[0.08] focus-within:border-purple-500/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ゴールや学びたいことを入力... (Enter で送信、Shift+Enter で改行)"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-gray-200 text-sm resize-none leading-relaxed min-h-[24px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`px-5 py-2 rounded-lg text-[13px] transition-all shrink-0 ${
              isLoading || !input.trim()
                ? "bg-white/[0.06] text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90"
            }`}
          >
            {isLoading ? "送信中..." : "送信"}
          </button>
        </div>
        {!goalId && (
          <p className="text-[11px] text-gray-600 mt-2 text-center">
            最初のメッセージでゴールが作成されます
          </p>
        )}
      </div>
    </div>
  );
}
