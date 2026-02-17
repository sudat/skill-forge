export default function GoalPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-base">
          🎯
        </div>
        <div>
          <div className="text-[15px] text-gray-200">ゴール設定 AI</div>
          <div className="text-[11px] text-gray-500">
            対話を通じてスキルツリーを構築・更新します
          </div>
        </div>
      </div>

      {/* Chat area - placeholder */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-4">🌳</div>
            <p className="text-gray-400 mb-2">
              あなたの学習ゴールを教えてください
            </p>
            <p className="text-sm text-gray-600">
              例：「フルスタックエンジニアになりたい」「英語でビジネス交渉ができるようになりたい」
            </p>
          </div>
        </div>
      </div>

      {/* Input area - placeholder */}
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <div className="flex gap-2.5 items-center bg-white/[0.04] rounded-xl p-1.5 pl-4 border border-white/[0.08]">
          <input
            type="text"
            placeholder="ゴールや学びたいことを入力..."
            className="flex-1 bg-transparent border-none outline-none text-gray-200 text-sm"
            disabled
          />
          <button
            className="px-5 py-2 rounded-lg bg-white/[0.06] text-gray-500 text-[13px] cursor-not-allowed"
            disabled
          >
            送信
          </button>
        </div>
        <p className="text-[11px] text-gray-600 mt-2 text-center">
          AI対話機能は次のステップで実装されます
        </p>
      </div>
    </div>
  );
}
