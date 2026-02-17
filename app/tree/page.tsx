import { createClient } from "@/lib/supabase/server";

export default async function TreePage() {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
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
    <div className="flex h-screen">
      {/* Tree panel */}
      <div className="w-[380px] border-r border-white/[0.06] overflow-y-auto p-5">
        <h3 className="text-[15px] text-gray-200 mb-4">スキルツリー</h3>
        {nodes && nodes.length > 0 ? (
          <p className="text-sm text-gray-500">
            {nodes.length}個のノードが登録されています
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            ゴール設定AIとの対話でスキルツリーが生成されます
          </p>
        )}
      </div>

      {/* Detail panel */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">
          スキルノードを選択してください
        </p>
      </div>
    </div>
  );
}
