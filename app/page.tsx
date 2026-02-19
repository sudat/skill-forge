"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { STATUS_CONFIG } from "@/lib/constants";
import { countByStatus, buildTree } from "@/lib/skill-tree";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import type { SkillNodeStatus, Video } from "@/types/database";

// Reveal animation hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Reveal({ 
  children, 
  delay = 0,
  className = ""
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useReveal();
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    activeGoal: any;
    allNodes: any[];
    tree: any;
    statusCount: Record<string, number>;
    masteryRate: number;
    uncoveredCount: number;
    videoCount: number;
    recentVideos: Video[];
    recentConversations: any[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // アクティブなゴールを取得
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      const activeGoal = goals?.[0];

      // スキルノードを取得
      const { data: nodes } = activeGoal
        ? await supabase
            .from("skill_nodes")
            .select("*")
            .eq("goal_id", activeGoal.id)
            .order("sort_order")
        : { data: [] };

      const allNodes = nodes ?? [];
      const tree = buildTree(allNodes);
      const { counts: statusCount } = countByStatus(tree);

      // カバレッジ率を計算
      const coveredCount = allNodes.filter((n) => n.coverage_score > 0).length;
      const masteryRate =
        allNodes.length > 0
          ? Math.round((coveredCount / allNodes.length) * 100)
          : 0;

      const uncoveredCount = allNodes.filter((n) => n.coverage_score === 0).length;

      // 最近の動画を取得
      const { data: recentVideos } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      const { count: videoCount } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true });

      // 最近のAI対話履歴
      const { data: recentConversations } = activeGoal
        ? await supabase
            .from("goal_conversations")
            .select("*")
            .eq("goal_id", activeGoal.id)
            .order("created_at", { ascending: false })
            .limit(5)
        : { data: [] };

      setData({
        activeGoal,
        allNodes,
        tree,
        statusCount,
        masteryRate,
        uncoveredCount,
        videoCount: videoCount ?? 0,
        recentVideos: recentVideos ?? [],
        recentConversations: [...(recentConversations ?? [])].reverse(),
      });
    }

    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-tertiary)]">読み込み中...</div>
      </div>
    );
  }

  const {
    activeGoal,
    allNodes,
    statusCount,
    masteryRate,
    uncoveredCount,
    videoCount,
    recentVideos,
    recentConversations,
  } = data;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] with-noise">
      {/* Hero Section */}
      <section className="pt-12 pb-16 px-6 lg:px-12">
        <Reveal>
          <div className="max-w-4xl">
            <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-3 tracking-wide">
              [01] Dashboard
            </span>
            <h1 className="text-hero text-[var(--text-primary)] mb-4 tracking-tight">
              ダッシュボード
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-[48ch] leading-relaxed opacity-80">
              あなたの学習の全体像。スキルツリーの進捗と次のステップを確認できます。
            </p>
          </div>
        </Reveal>
      </section>

      {/* Stats Grid - Bento Style */}
      <section className="px-6 lg:px-12 pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Reveal delay={0}>
            <StatCard
              label="登録動画"
              value={videoCount}
              unit="本"
              color="blue"
            />
          </Reveal>
          <Reveal delay={60}>
            <StatCard
              label="スキルノード"
              value={allNodes.length}
              unit="個"
              color="purple"
            />
          </Reveal>
          <Reveal delay={120}>
            <StatCard
              label="カバレッジ率"
              value={masteryRate}
              unit="%"
              color="green"
            />
          </Reveal>
          <Reveal delay={180}>
            <StatCard
              label="未カバー領域"
              value={uncoveredCount}
              unit="個"
              color="red"
            />
          </Reveal>
        </div>
      </section>

      {/* Main Content - Bento Grid */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="bento-grid">
          {/* Active Goal - Featured */}
          <Reveal delay={0} className="bento-item featured">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[var(--text-primary)] tracking-tight">
                  現在のゴール
                </h2>
                {activeGoal && (
                  <LinkButton href={`/goal/${activeGoal.id}`} variant="secondary">
                    詳細を見る →
                  </LinkButton>
                )}
              </div>
              
              {activeGoal ? (
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                    {activeGoal.title}
                  </h3>
                  {activeGoal.description && (
                    <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                      {activeGoal.description}
                    </p>
                  )}
                  
                  {/* ステータス別内訳 */}
                  {allNodes.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {(Object.keys(STATUS_CONFIG) as SkillNodeStatus[]).map(
                        (status) => {
                          const count = statusCount[status] ?? 0;
                          if (count === 0) return null;
                          const config = STATUS_CONFIG[status];
                          return (
                            <div key={status} className="flex items-center gap-3">
                              <span
                                className="text-sm w-5"
                                style={{ color: config.color }}
                              >
                                {config.icon}
                              </span>
                              <span className="text-sm text-[var(--text-secondary)] flex-1">
                                {config.label}
                              </span>
                              <span
                                className="text-sm font-mono font-medium"
                                style={{ color: config.color }}
                              >
                                {count}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-auto">
                    <LinkButton 
                      href={`/goal/${activeGoal.id}?tab=chat`} 
                      variant="primary"
                      className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-85 transition-opacity duration-150"
                    >
                      対話を続ける
                    </LinkButton>
                    <LinkButton 
                      href="/tree" 
                      variant="secondary"
                      className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
                    >
                      ツリーを見る
                    </LinkButton>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <p className="text-[var(--text-tertiary)] mb-4">
                    まだゴールが設定されていません
                  </p>
                  <a
                    href="/goal"
                    className="inline-block px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-85 transition-opacity duration-150"
                  >
                    ゴールを設定する
                  </a>
                </div>
              )}
            </div>
          </Reveal>

          {/* Recent Videos */}
          <Reveal delay={80} className="bento-item">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[var(--text-primary)] tracking-tight">
                  最近の動画
                </h2>
                <LinkButton href="/videos" variant="secondary">
                  全て見る →
                </LinkButton>
              </div>
              
              <div className="flex-1">
                {recentVideos && recentVideos.length > 0 ? (
                  <div className="space-y-3">
                    {recentVideos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-subtle)]"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-sm shrink-0 border border-[var(--border-subtle)]">
                          ▶
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[var(--text-primary)] truncate font-medium">
                            {video.title}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {video.analysis_status === "completed"
                              ? "解析済み"
                              : video.analysis_status === "analyzing"
                                ? "解析中..."
                                : "未解析"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-[var(--text-tertiary)] mb-3">
                      まだ動画がありません
                    </p>
                    <LinkButton href="/videos" variant="secondary">
                      動画を登録する →
                    </LinkButton>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Weekly Progress */}
          <Reveal delay={160} className="bento-item">
            <div className="h-full flex flex-col">
              <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4 tracking-tight">
                今週の学習
              </h2>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-4xl font-bold text-[var(--accent-tertiary)] font-mono tracking-tight mb-2">
                  0<span className="text-lg text-[var(--text-tertiary)] font-normal ml-1">時間</span>
                  <span className="text-lg text-[var(--text-tertiary)] font-normal ml-2">0</span>
                  <span className="text-lg text-[var(--text-tertiary)] font-normal ml-1">分</span>
                </div>
                
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full mt-4 overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full bg-[var(--accent-tertiary)] rounded-full transition-all duration-500"
                    style={{ width: "0%" }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    週間目標: 7時間
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    0%
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recent AI Conversations */}
      {recentConversations.length > 0 && (
        <section className="px-6 lg:px-12 pb-20 section-alt">
          <div className="max-w-4xl">
            <Reveal>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="inline-block text-xs font-mono text-[var(--text-tertiary)] mb-2 tracking-wide">
                    [02] Conversations
                  </span>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                    最近のAI対話
                  </h2>
                </div>
                <LinkButton
                  href={activeGoal ? `/goal/${activeGoal.id}?tab=chat` : "/goal"}
                  variant="primary"
                >
                  対話ページへ →
                </LinkButton>
              </div>
            </Reveal>

            <div className="space-y-3">
              {recentConversations.map((conv, index) => (
                <Reveal key={conv.id} delay={index * 60}>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex gap-4 items-start">
                    <span className="text-lg shrink-0 mt-0.5">
                      {conv.role === "user" ? "👤" : "🤖"}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {conv.message}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
