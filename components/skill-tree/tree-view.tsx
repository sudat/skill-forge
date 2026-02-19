"use client";

import { useState } from "react";
import { buildTree } from "@/lib/skill-tree";
import { STATUS_CONFIG } from "@/lib/constants";
import type { SkillNode, SkillNodeWithChildren, SkillNodeStatus } from "@/types/database";

type TreeViewProps = {
  nodes: SkillNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: SkillNode) => void;
};

export function TreeView({ nodes, selectedNodeId, onSelectNode }: TreeViewProps) {
  const tree = buildTree(nodes);

  if (tree.length === 0) {
    return (
      <div className="p-5 text-center">
        <div className="text-3xl mb-3">🌱</div>
        <p className="text-sm text-[var(--text-secondary)]">
          ゴール設定AIとの対話でスキルツリーが生成されます
        </p>
        <a
          href="/goal"
          className="inline-block mt-3 text-xs text-[var(--accent-primary)] underline hover:opacity-80"
        >
          ゴール設定へ →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

type TreeNodeRowProps = {
  node: SkillNodeWithChildren;
  selectedNodeId: string | null;
  onSelectNode: (node: SkillNode) => void;
};

function TreeNodeRow({ node, selectedNodeId, onSelectNode }: TreeNodeRowProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const status = node.status as SkillNodeStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.locked;
  const isSelected = node.id === selectedNodeId;
  const coverage = node.coverage_score ?? 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group ${
          isSelected
            ? "bg-[var(--bg-tertiary)] border border-[var(--border-default)]"
            : "hover:bg-[var(--bg-tertiary)]/50"
        }`}
        style={{ paddingLeft: `${node.depth * 16 + 12}px` }}
        onClick={() => onSelectNode(node)}
      >
        {/* 展開トグル */}
        {hasChildren ? (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((o) => !o);
            }}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* ステータスアイコン */}
        <span
          className="text-xs shrink-0 w-4 text-center"
          style={{ color: config.color }}
        >
          {config.icon}
        </span>

        {/* ラベル */}
        <span
          className={`text-[13px] flex-1 min-w-0 truncate ${
            isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
          }`}
        >
          {node.label}
        </span>

        {/* カバレッジバー */}
        <div className="shrink-0 flex items-center gap-1.5 w-[72px]">
          <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${coverage}%`,
                backgroundColor: config.color,
                opacity: 0.7,
              }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right">
            {coverage}%
          </span>
        </div>
      </div>

      {/* 子ノード */}
      {hasChildren && isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
