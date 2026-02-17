import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // アクティブなゴールを取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .limit(1);

  const activeGoal = goals?.[0];

  // スキルノード数を取得
  const { count: nodeCount } = activeGoal
    ? await supabase
        .from("skill_nodes")
        .select("*", { count: "exact", head: true })
        .eq("goal_id", activeGoal.id)
    : { count: 0 };

  // 動画数を取得
  const { count: videoCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true });

  return (
    <div className="p-8">
      <h1 className="text-2xl text-gray-100 mb-2">ダッシュボード</h1>
      <p className="text-sm text-gray-500 mb-7">あなたの学習の全体像</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "登録動画",
            value: videoCount ?? 0,
            unit: "本",
            color: "text-blue-500",
          },
          {
            label: "スキルノード",
            value: nodeCount ?? 0,
            unit: "個",
            color: "text-purple-500",
          },
          { label: "習得率", value: 0, unit: "%", color: "text-green-500" },
          {
            label: "未カバー領域",
            value: 0,
            unit: "個",
            color: "text-red-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.06]"
          >
            <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
            <div className={`text-3xl font-mono font-bold ${stat.color}`}>
              {stat.value}
              <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Goal */}
      <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6">
        <h2 className="text-[15px] text-gray-200 mb-4">現在のゴール</h2>
        {activeGoal ? (
          <div>
            <div className="text-lg text-gray-100">{activeGoal.title}</div>
            {activeGoal.description && (
              <p className="text-sm text-gray-400 mt-2">
                {activeGoal.description}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              まだゴールが設定されていません
            </p>
            <a
              href="/goal"
              className="inline-block px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm"
            >
              🎯 ゴールを設定する
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
