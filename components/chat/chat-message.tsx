"use client";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";


  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* アバター */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-purple-500"
            : "bg-gradient-to-br from-purple-500 to-pink-500"
        }`}
      >
        {isUser ? "👤" : "🤖"}
      </div>

      {/* メッセージバブル */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-purple-500/20 border border-purple-500/30 text-gray-100 rounded-tr-sm"
            : "bg-white/[0.05] border border-white/[0.08] text-gray-200 rounded-tl-sm"
        }`}
      >
        {isStreaming && !content ? (
          /* 思考中: 3点ドットアニメ */
          <span className="flex items-center gap-1 py-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{content}</p>
            {isStreaming && (
              <span className="inline-block w-[2px] h-[1em] bg-purple-400 animate-[blink_0.8s_step-end_infinite] ml-0.5 align-text-bottom rounded-sm" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

type TreeGeneratedNoticeProps = {
  nodeCount: number;
  goalId: string;
};

export function TreeGeneratedNotice({
  nodeCount,
  goalId,
}: TreeGeneratedNoticeProps) {
  void goalId;
  return (
    <div className="flex justify-center my-3">
      <div className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400">
        <span>🌳</span>
        <span>
          スキルツリーが生成されました（{nodeCount}ノード）
        </span>
        <a
          href="/tree"
          className="ml-2 underline text-green-300 hover:text-green-200 transition-colors"
        >
          ツリーを見る →
        </a>
      </div>
    </div>
  );
}
