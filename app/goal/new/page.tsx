"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function NewGoalPage() {
  const router = useRouter();

  const handleGoalCreated = (goalId: string) => {
    router.push(`/goal/${goalId}`);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
        <Link
          href="/goal"
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
        >
          ← ゴール一覧
        </Link>
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-base">
            🎯
          </div>
          <div>
            <div className="text-[15px] text-gray-200">新しいゴールを作成</div>
            <div className="text-[11px] text-gray-500">
              学習したいことを入力してください
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel
          initialGoalId={null}
          initialHistory={[]}
          onGoalCreated={handleGoalCreated}
        />
      </div>
    </div>
  );
}
