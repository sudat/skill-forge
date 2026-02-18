import { z } from "zod";

// ─── チャット / スキルツリー生成 ───────────────────────────────────────────

export const ChatResponseSchema = z.object({
  type: z.literal("chat"),
  message: z.string(),
});

export const TreeNodeSchema = z.object({
  temp_id: z.string(),
  parent_temp_id: z.string().nullable(),
  label: z.string(),
  knowledge_text: z.string(),
  depth: z.number().int().min(0),
  sort_order: z.number().int().min(0),
});

export const TreeGenerationSchema = z.object({
  type: z.literal("tree_generation"),
  message: z.string(),
  tree: z.object({
    nodes: z.array(TreeNodeSchema).min(1),
  }),
});

export const AIResponseSchema = z.discriminatedUnion("type", [
  ChatResponseSchema,
  TreeGenerationSchema,
]);

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type TreeNode = z.infer<typeof TreeNodeSchema>;

// ─── 動画解析 ────────────────────────────────────────────────────────────────

export const KeyPointSchema = z.object({
  topic: z.string(),
  description: z.string(),
  timestamp: z.string().optional(),
});

export const NodeMappingSchema = z.object({
  node_id: z.string(),
  relevance_score: z.number().int().min(0).max(100),
  coverage_detail: z.string(),
  timestamp_start: z.string().optional(),
  timestamp_end: z.string().optional(),
});

export const AnalysisResultSchema = z.object({
  summary: z.string(),
  key_points: z.array(KeyPointSchema),
  node_mappings: z.array(NodeMappingSchema),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ─── 動画重複チェック ────────────────────────────────────────────────────────

export const OverlappingTopicSchema = z.object({
  topic: z.string(),
  video_a_section: z.string().optional(),
  video_b_section: z.string().optional(),
});

export const OverlapResultSchema = z.object({
  overlap_score: z.number().int().min(0).max(100),
  overlapping_topics: z.array(OverlappingTopicSchema),
  recommendation: z.string(),
});

export type OverlapResult = z.infer<typeof OverlapResultSchema>;

// ─── ナレッジテキスト生成 ─────────────────────────────────────────────────────

export const KnowledgeGenSchema = z.object({
  knowledge_text: z.string().min(1),
});

export type KnowledgeGen = z.infer<typeof KnowledgeGenSchema>;

// ─── 詳細ナレッジテキスト生成 ─────────────────────────────────────────────────

export const DetailedKnowledgeGenSchema = z.object({
  detailed_knowledge_text: z.string().min(1),
});

export type DetailedKnowledgeGen = z.infer<typeof DetailedKnowledgeGenSchema>;
