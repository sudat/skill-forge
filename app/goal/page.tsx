import { createClient } from "@/lib/supabase/server";
import { GoalListClient } from "./GoalListClient";

export default async function GoalPage() {
  const supabase = await createClient();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  // 各ゴールのノード数を取得
  const goalsWithCount = await Promise.all(
    (goals ?? []).map(async (goal) => {
      const { count } = await supabase
        .from("skill_nodes")
        .select("*", { count: "exact", head: true })
        .eq("goal_id", goal.id);
      return { ...goal, nodeCount: count ?? 0 };
    })
  );

  return <GoalListClient goals={goalsWithCount} />;
}
