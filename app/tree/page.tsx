import { createClient } from "@/lib/supabase/server";
import { TreeContainer } from "@/components/skill-tree/tree-container";

export default async function TreePage() {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = goals?.[0];

  if (!activeGoal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🌳</div>
          <p className="text-gray-400 mb-4">
            スキルツリーを表示するにはゴールを設定してください
          </p>
          <a
            href="/goal"
            className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
          >
            🎯 ゴールを設定する
          </a>
        </div>
      </div>
    );
  }

  const { data: nodes } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("goal_id", activeGoal.id)
    .order("sort_order");

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] text-gray-200">{activeGoal.title}</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">スキルツリー</p>
          </div>
          <a
            href={`/goal/${activeGoal.id}?tab=chat`}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            対話に戻る →
          </a>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-hidden">
        <TreeContainer nodes={nodes ?? []} />
      </div>
    </div>
  );
}
