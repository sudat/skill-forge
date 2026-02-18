"use client";

import { useState, useCallback } from "react";
import { TreeView } from "./tree-view";
import { NodeDetail } from "./node-detail";
import type { SkillNode, SkillNodeStatus } from "@/types/database";

type TreeContainerProps = {
  nodes: SkillNode[];
};

export function TreeContainer({ nodes: initialNodes }: TreeContainerProps) {
  const [nodes, setNodes] = useState<SkillNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleStatusChange = useCallback(
    (nodeId: string, status: SkillNodeStatus) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status } : n))
      );
    },
    []
  );

  return (
    <div className="flex h-full">
      {/* ツリーパネル */}
      <div className="w-[380px] shrink-0 border-r border-white/[0.06] overflow-y-auto py-3">
        <div className="px-4 mb-3">
          <h3 className="text-[13px] text-gray-400 font-medium">
            スキルツリー
          </h3>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {nodes.length}個のノード
          </p>
        </div>
        <TreeView
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(node) => setSelectedNodeId(node.id)}
        />
      </div>

      {/* 詳細パネル */}
      <div className="flex-1 overflow-hidden">
        <NodeDetail
          node={selectedNode}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
