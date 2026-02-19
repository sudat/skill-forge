import { createClient } from "@/lib/supabase/server";
import { TreeContainer } from "@/components/skill-tree/tree-container";
import { LinkButton } from "@/components/ui/button";

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
          <p className="text-[var(--text-secondary)] mb-4">
            スキルツリーを表示するにはゴールを設定してください
          </p>
          <a
            href="/goal"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] text-white text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 active:scale-[0.98]"
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
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] text-[var(--text-primary)]">{activeGoal.title}</h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">スキルツリー</p>
          </div>
          <LinkButton href={`/goal/${activeGoal.id}?tab=chat`} variant="primary">
            対話に戻る →
          </LinkButton>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-hidden">
        <TreeContainer nodes={nodes ?? []} />
      </div>
    </div>
  );
}
