"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatPanel } from "@/components/chat/chat-panel";
import { buildTree } from "@/lib/skill-tree";
import { STATUS_CONFIG, DEFAULT_TASTE_SETTINGS, TASTE_STORAGE_KEY } from "@/lib/constants";
import type { TasteSettings } from "@/lib/constants";
import type { Goal, GoalConversation, SkillNode, SkillNodeStatus, SkillNodeWithChildren } from "@/types/database";
import { TasteSettingsDialog } from "@/components/skill-tree/taste-settings-dialog";

type GoalDetailClientProps = {
  goal: Goal;
  nodes: SkillNode[];
  history: GoalConversation[];
  defaultTab?: "document" | "chat";
};

export function GoalDetailClient({
  goal,
  nodes,
  history,
  defaultTab = "document",
}: GoalDetailClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"document" | "chat">(
    nodes.length === 0 ? "chat" : defaultTab
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(goal.status);

  const isActive = currentStatus === "active";

  const toggleStatus = async () => {
    const newStatus = isActive ? "archived" : "active";
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setCurrentStatus(newStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const tree = buildTree(nodes);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/goal"
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              ← ゴール一覧
            </Link>
            <div className="w-px h-4 bg-white/[0.08]" />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[15px] text-gray-200 truncate max-w-[220px]"
                  title={goal.title}
                >
                  {goal.title}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "text-purple-400 border-purple-500/30 bg-purple-500/10"
                      : "text-gray-500 border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  {isActive ? "アクティブ" : "アーカイブ"}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {nodes.length > 0
                  ? `${nodes.length} ノード`
                  : "ツリー未生成"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTab("document")}
                className={`px-4 py-1.5 rounded-md text-[12px] transition-colors ${
                  tab === "document"
                    ? "bg-white/[0.08] text-gray-200"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ドキュメント
              </button>
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={`px-4 py-1.5 rounded-md text-[12px] transition-colors ${
                  tab === "chat"
                    ? "bg-white/[0.08] text-gray-200"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                チャット
              </button>
            </div>

            <button
              type="button"
              onClick={toggleStatus}
              disabled={statusLoading}
              className={`px-4 py-1.5 rounded-lg text-[12px] border transition-colors disabled:opacity-50 ${
                isActive
                  ? "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-gray-200"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
              }`}
            >
              {statusLoading ? "..." : isActive ? "アーカイブ" : "アクティブにする"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "document" ? (
          <DocumentView goal={goal} nodes={nodes} tree={tree} />
        ) : (
          <ChatPanel
            initialGoalId={goal.id}
            initialHistory={history}
          />
        )}
      </div>
    </div>
  );
}

type BulkStatus = "idle" | "running" | "done";

function DocumentView({
  goal,
  nodes,
  tree,
}: {
  goal: Goal;
  nodes: SkillNode[];
  tree: SkillNodeWithChildren[];
}) {
  const [generatedNodes, setGeneratedNodes] = useState<Set<string>>(
    new Set(nodes.filter((n) => n.detailed_knowledge_text).map((n) => n.id))
  );
  const [bulkStatus, setBulkStatus] = useState<BulkStatus>("idle");
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    currentDepth: 0,
  });
  const [bulkGeneratingIds, setBulkGeneratingIds] = useState<Set<string>>(new Set());

  const [tasteSettings, setTasteSettings] = useState<TasteSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_TASTE_SETTINGS;
    try {
      const stored = localStorage.getItem(TASTE_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as TasteSettings) : DEFAULT_TASTE_SETTINGS;
    } catch {
      return DEFAULT_TASTE_SETTINGS;
    }
  });
  const [isTasteDialogOpen, setIsTasteDialogOpen] = useState(false);

  const handleTasteChange = useCallback((settings: TasteSettings) => {
    setTasteSettings(settings);
    localStorage.setItem(TASTE_STORAGE_KEY, JSON.stringify(settings));
  }, []);

  const markGenerated = useCallback((nodeId: string) => {
    setGeneratedNodes((prev) => new Set([...prev, nodeId]));
  }, []);

  const handleBulkGenerate = useCallback(async () => {
    const pendingNodes = nodes.filter((n) => !generatedNodes.has(n.id));
    if (pendingNodes.length === 0) return;

    const depths = [...new Set(pendingNodes.map((n) => n.depth))].sort((a, b) => a - b);
    const nodesByDepth = new Map(
      depths.map((d) => [d, pendingNodes.filter((n) => n.depth === d)])
    );

    setBulkStatus("running");
    setBulkProgress({ total: pendingNodes.length, completed: 0, failed: 0, currentDepth: depths[0] ?? 0 });

    let completed = 0;
    let failed = 0;

    for (const depth of depths) {
      const depthNodes = nodesByDepth.get(depth) ?? [];
      setBulkProgress((prev) => ({ ...prev, currentDepth: depth }));
      setBulkGeneratingIds(new Set(depthNodes.map((n) => n.id)));

      let idx = 0;
      const tasks = depthNodes.map((nd) => async () => {
        try {
          const res = await fetch(`/api/skill-nodes/${nd.id}/generate-detailed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tasteSettings),
          });
          if (!res.ok) throw new Error("failed");
          markGenerated(nd.id);
          completed++;
        } catch {
          failed++;
        } finally {
          setBulkGeneratingIds((prev) => {
            const s = new Set(prev);
            s.delete(nd.id);
            return s;
          });
          setBulkProgress((prev) => ({ ...prev, completed, failed }));
        }
      });

      const worker = async () => {
        while (idx < tasks.length) {
          const i = idx++;
          await tasks[i]?.();
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, tasks.length) }, worker));
    }

    setBulkGeneratingIds(new Set());
    setBulkStatus("done");
    setTimeout(() => setBulkStatus("idle"), 5000);
  }, [nodes, generatedNodes, markGenerated, tasteSettings]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-400 mb-2">スキルツリーがまだ生成されていません</p>
          <p className="text-sm text-gray-600">
            チャットタブでAIと対話してツリーを生成してください
          </p>
        </div>
      </div>
    );
  }

  const createdAt = new Date(goal.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pendingCount = nodes.filter((n) => !generatedNodes.has(n.id)).length;
  const bulkRunning = bulkStatus === "running";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Document header */}
        <div className="mb-8 pb-6 border-b border-white/[0.06]">
          <h1 className="text-2xl text-gray-100 mb-2">{goal.title}</h1>
          {goal.description && (
            <p className="text-gray-400 text-sm mb-3">{goal.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] text-gray-500">
              <span>作成日: {createdAt}</span>
              <span>{nodes.length} スキルノード</span>
            </div>

            {/* Bulk generate controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTasteDialogOpen(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:text-gray-300 hover:border-white/[0.14] transition-colors text-sm"
                title="生成テイスト設定"
              >
                ⚙
              </button>
              {bulkStatus === "idle" && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={handleBulkGenerate}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5"
                >
                  全ノード一括生成（{pendingCount}件）
                </button>
              )}
              {bulkStatus === "running" && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="inline-block w-3 h-3 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin shrink-0" />
                  <span>
                    生成中... {bulkProgress.completed}/{bulkProgress.total} 完了
                    （Lv{bulkProgress.currentDepth + 1}処理中）
                  </span>
                  {bulkProgress.failed > 0 && (
                    <span className="text-red-400">{bulkProgress.failed}件失敗</span>
                  )}
                </div>
              )}
              {bulkStatus === "done" && (
                <span className="text-[11px] text-emerald-400">
                  {bulkProgress.failed === 0
                    ? `全${bulkProgress.total}ノード生成完了 ✓`
                    : `生成完了 ✓（${bulkProgress.failed}件失敗）`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skill tree as document */}
        <div className="space-y-2">
          {tree.map((rootNode) => (
            <TreeDocNode
              key={rootNode.id}
              node={rootNode}
              depth={0}
              generatedNodes={generatedNodes}
              bulkGeneratingIds={bulkGeneratingIds}
              bulkRunning={bulkRunning}
            />
          ))}
        </div>
      </div>
      {isTasteDialogOpen && (
        <TasteSettingsDialog
          settings={tasteSettings}
          onChange={handleTasteChange}
          onClose={() => setIsTasteDialogOpen(false)}
        />
      )}
    </div>
  );
}

function TreeDocNodeActions({
  nodeId,
  hasDetailedText,
  bulkGenerating,
}: {
  nodeId: string;
  hasDetailedText: boolean;
  bulkGenerating: boolean;
  bulkRunning: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      {/* 一括生成で処理中のノードにのみスピナーを表示 */}
      {!hasDetailedText && bulkGenerating && (
        <span className="text-[10px] px-2.5 py-1 rounded-md border border-purple-500/30 text-purple-400 flex items-center gap-1.5 opacity-60">
          <span className="inline-block w-2.5 h-2.5 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
          生成中...
        </span>
      )}
      {hasDetailedText && (
        <Link
          href={`/skill-nodes/${nodeId}`}
          className="text-[10px] px-2.5 py-1 rounded-md border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          詳細テキストを見る →
        </Link>
      )}
    </div>
  );
}

function TreeDocNode({
  node,
  depth,
  generatedNodes,
  bulkGeneratingIds,
  bulkRunning,
}: {
  node: SkillNodeWithChildren;
  depth: number;
  generatedNodes: Set<string>;
  bulkGeneratingIds: Set<string>;
  bulkRunning: boolean;
}) {
  const config = STATUS_CONFIG[node.status as SkillNodeStatus];
  const hasDetailedText = generatedNodes.has(node.id);

  return (
    <div className={depth > 0 ? "ml-5 mt-1" : "mt-4"}>
      {/* Node heading */}
      <div className="flex items-start gap-2.5 mb-1.5">
        <span
          className="text-xs mt-0.5 shrink-0 w-3"
          style={{ color: config.color }}
        >
          {config.icon}
        </span>
        <h3
          className={`font-medium ${
            depth === 0
              ? "text-[16px] text-gray-100"
              : depth === 1
                ? "text-[14px] text-gray-200"
                : "text-[13px] text-gray-300"
          }`}
        >
          {node.label}
        </h3>
      </div>

      {/* Knowledge text + actions */}
      <div className="ml-5 mb-3">
        {node.knowledge_text && (
          <p className="text-[12px] text-gray-400 leading-relaxed whitespace-pre-wrap bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2.5 mb-1.5">
            {node.knowledge_text}
          </p>
        )}
        <TreeDocNodeActions
          nodeId={node.id}
          hasDetailedText={hasDetailedText}
          bulkGenerating={bulkGeneratingIds.has(node.id)}
          bulkRunning={bulkRunning}
        />
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="border-l border-white/[0.06] pl-0">
          {node.children.map((child) => (
            <TreeDocNode
              key={child.id}
              node={child}
              depth={depth + 1}
              generatedNodes={generatedNodes}
              bulkGeneratingIds={bulkGeneratingIds}
              bulkRunning={bulkRunning}
            />
          ))}
        </div>
      )}
    </div>
  );
}
