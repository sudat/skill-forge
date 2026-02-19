import { createClient } from "@/lib/supabase/server";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SkillNode, SkillNodeStatus, OverlappingTopic } from "@/types/database";

function getCoverageColor(score: number): string {
  if (score >= 70) return "var(--accent-tertiary)";
  if (score >= 40) return "var(--status-in-progress)";
  if (score > 0) return "#ef4444";
  return "var(--status-locked)";
}

function getCoverageLabel(score: number): string {
  if (score >= 70) return "高";
  if (score >= 40) return "中";
  if (score > 0) return "低";
  return "未";
}

export default async function GapPage() {
  const supabase = await createClient();

  // アクティブゴールを取得
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeGoal = goals?.[0];

  if (!activeGoal) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
        <section className="pt-12 pb-8 px-8">
          <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
            [03] Gap Analysis
          </span>
          <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
            ギャップ分析
          </h1>
          <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
            ゴールに対する未カバー領域
          </p>
        </section>
        <section className="px-8 pb-20">
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-[var(--text-secondary)] mb-4">まずゴールを設定してください</p>
            <Button>
              <a href="/goal">🎯 ゴールを設定する</a>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // スキルノードを取得
  const { data: nodes } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("goal_id", activeGoal.id)
    .order("depth")
    .order("sort_order");

  const allNodes = (nodes ?? []) as SkillNode[];

  if (allNodes.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
        <section className="pt-12 pb-8 px-8">
          <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
            [03] Gap Analysis
          </span>
          <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
            ギャップ分析
          </h1>
          <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
            ゴールに対する未カバー領域
          </p>
        </section>
        <section className="px-8 pb-20">
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-[var(--text-secondary)] mb-4">スキルツリーがまだ生成されていません</p>
            <Button>
              <a href="/goal">🎯 ゴール設定AIで対話する</a>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // 統計計算
  const totalNodes = allNodes.length;
  const coveredNodes = allNodes.filter((n) => n.coverage_score > 0).length;
  const coverageRate = Math.round((coveredNodes / totalNodes) * 100);
  const uncoveredNodes = allNodes.filter((n) => n.coverage_score === 0);
  const availableUncovered = uncoveredNodes.filter(
    (n) => (n.status as SkillNodeStatus) === "available"
  );

  // ステータス別カウント
  const statusCounts: Record<string, number> = {};
  for (const node of allNodes) {
    statusCounts[node.status] = (statusCounts[node.status] ?? 0) + 1;
  }

  // 動画重複データを取得
  const { data: overlaps } = await supabase
    .from("video_overlaps")
    .select(`
      *,
      video_a:videos!video_overlaps_video_a_id_fkey(id, title),
      video_b:videos!video_overlaps_video_b_id_fkey(id, title)
    `)
    .order("overlap_score", { ascending: false });

  const allOverlaps = overlaps ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
      {/* Hero */}
      <section className="pt-12 pb-8 px-8">
        <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
          [03] Gap Analysis
        </span>
        <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
          ギャップ分析
        </h1>
        <p className="text-base text-[var(--text-secondary)] opacity-80 leading-relaxed">
          「{activeGoal.title}」のカバレッジ
        </p>
      </section>

      {/* Content */}
      <section className="px-8 pb-20 max-w-5xl">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] card-hover-lift">
            <div className="text-xs text-[var(--text-tertiary)] mb-2">全体カバレッジ</div>
            <div className="text-3xl font-mono font-bold text-[var(--accent-tertiary)]">
              {coverageRate}
              <span className="text-sm text-[var(--text-tertiary)] ml-1">%</span>
            </div>
            <div className="mt-2 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-tertiary)] rounded-full"
                style={{ width: `${coverageRate}%` }}
              />
            </div>
          </div>
          <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] card-hover-lift">
            <div className="text-xs text-[var(--text-tertiary)] mb-2">未カバーノード</div>
            <div className="text-3xl font-mono font-bold text-red-400">
              {uncoveredNodes.length}
              <span className="text-sm text-[var(--text-tertiary)] ml-1">個</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-2">全{totalNodes}ノード中</div>
          </div>
          <div className="p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] card-hover-lift">
            <div className="text-xs text-[var(--text-tertiary)] mb-2">次に学べるスキル</div>
            <div className="text-3xl font-mono font-bold text-[var(--accent-primary)]">
              {availableUncovered.length}
              <span className="text-sm text-[var(--text-tertiary)] ml-1">個</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-2">解放済みの未カバーノード</div>
          </div>
        </div>

        {/* カバレッジヒートマップ */}
        <div className="mb-8">
          <h2 className="text-[15px] text-[var(--text-primary)] mb-4">カバレッジヒートマップ</h2>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4">
            <div className="flex flex-wrap gap-1.5">
              {allNodes.map((node) => {
                const color = getCoverageColor(node.coverage_score);
                const label = getCoverageLabel(node.coverage_score);
                const indent = node.depth * 16;
                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all hover:opacity-80"
                    style={{
                      borderColor: `${color}40`,
                      backgroundColor: `${color}15`,
                      marginLeft: node.depth > 0 ? `${indent}px` : undefined,
                      color,
                    }}
                    title={`${node.label}: ${node.coverage_score}%`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {node.label}
                    <span className="opacity-60">{label}</span>
                  </div>
                );
              })}
            </div>
            {/* 凡例 */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border-subtle)]">
              <span className="text-[11px] text-[var(--text-tertiary)]">カバレッジ:</span>
              {[
                { label: "高 (70%+)", color: "var(--accent-tertiary)" },
                { label: "中 (40-70%)", color: "var(--status-in-progress)" },
                { label: "低 (1-40%)", color: "#ef4444" },
                { label: "未 (0%)", color: "var(--status-locked)" },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1 text-[11px]" style={{ color }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 次のステップ提案 */}
        {availableUncovered.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[15px] text-[var(--text-primary)] mb-4">
              次に学ぶべきスキル（TOP {Math.min(3, availableUncovered.length)}）
            </h2>
            <div className="space-y-2">
              {availableUncovered.slice(0, 3).map((node, i) => (
                <div
                  key={node.id}
                  className="flex items-start gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--accent-primary)]/20"
                >
                  <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm text-[var(--text-primary)] mb-1">{node.label}</div>
                    {node.knowledge_text && (
                      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-2">
                        {node.knowledge_text.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未カバーノード一覧 */}
        <div className="mb-8">
          <h2 className="text-[15px] text-[var(--text-primary)] mb-4">
            未カバーノード一覧 ({uncoveredNodes.length}個)
          </h2>
          {uncoveredNodes.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              全てのノードが動画でカバーされています！
            </p>
          ) : (
            <div className="space-y-2">
              {uncoveredNodes.map((node) => {
                const status = node.status as SkillNodeStatus;
                const isLocked = status === "locked";
                return (
                  <div
                    key={node.id}
                    className={`flex items-start gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] ${
                      isLocked ? "opacity-40" : ""
                    }`}
                  >
                    <span className="text-sm text-red-400 shrink-0 mt-0.5">✕</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-[var(--text-primary)]">{node.label}</span>
                        {isLocked && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded">
                            未解放
                          </span>
                        )}
                      </div>
                      {node.knowledge_text && (
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-2">
                          {node.knowledge_text.slice(0, 120)}
                          {node.knowledge_text.length > 120 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 動画重複分析 */}
        <div>
          <h2 className="text-[15px] text-[var(--text-primary)] mb-4">
            動画重複分析 ({allOverlaps.length}ペア)
          </h2>
          {allOverlaps.length === 0 ? (
            <div className="text-center py-8 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <p className="text-sm text-[var(--text-tertiary)]">
                動画が2本以上登録されると、重複分析が表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allOverlaps.map((overlap) => {
                const videoA = (overlap as unknown as { video_a: { title: string } }).video_a;
                const videoB = (overlap as unknown as { video_b: { title: string } }).video_b;
                const score = overlap.overlap_score;
                const isHighOverlap = score >= 60;
                const overlapColor = score >= 70 ? "#ef4444" : score >= 40 ? "var(--status-in-progress)" : "var(--accent-tertiary)";
                const topics = (overlap.overlapping_topics as OverlappingTopic[] | null) ?? [];

                return (
                  <div
                    key={overlap.id}
                    className={`p-4 rounded-xl border ${
                      isHighOverlap
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-[var(--bg-secondary)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[var(--text-secondary)] mb-1 truncate">
                          {videoA?.title ?? "動画A"}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">vs</div>
                        <div className="text-[13px] text-[var(--text-secondary)] mt-1 truncate">
                          {videoB?.title ?? "動画B"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className="text-2xl font-mono font-bold"
                          style={{ color: overlapColor }}
                        >
                          {score}%
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">重複度</div>
                      </div>
                    </div>

                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {topics.slice(0, 5).map((t, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded"
                          >
                            {t.topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {overlap.recommendation && (
                      <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-lg p-3 leading-relaxed">
                        💡 {overlap.recommendation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
