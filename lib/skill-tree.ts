import type { SkillNode, SkillNodeWithChildren } from "@/types/database";

/**
 * フラットなスキルノード配列をツリー構造に変換する
 */
export function buildTree(nodes: SkillNode[]): SkillNodeWithChildren[] {
  const nodeMap = new Map<string, SkillNodeWithChildren>();
  const roots: SkillNodeWithChildren[] = [];

  // 全ノードをMapに登録（children空配列付き）
  for (const node of nodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  // 親子関係を構築
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  // sort_orderでソート（再帰的に）
  const sortChildren = (nodes: SkillNodeWithChildren[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

/**
 * ツリーをフラットな配列に展開する
 */
export function flattenTree(
  nodes: SkillNodeWithChildren[]
): SkillNodeWithChildren[] {
  const result: SkillNodeWithChildren[] = [];
  const traverse = (node: SkillNodeWithChildren) => {
    result.push(node);
    node.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return result;
}

/**
 * ステータス別のノード数を集計する
 */
export function countByStatus(nodes: SkillNodeWithChildren[]) {
  const flat = flattenTree(nodes);
  const leaves = flat.filter((n) => n.children.length === 0);
  const counts: Record<string, number> = {
    mastered: 0,
    learned: 0,
    in_progress: 0,
    available: 0,
    locked: 0,
  };
  leaves.forEach((n) => {
    counts[n.status] = (counts[n.status] || 0) + 1;
  });
  return { counts, total: leaves.length };
}
