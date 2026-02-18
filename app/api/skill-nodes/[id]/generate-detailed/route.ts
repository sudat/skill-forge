import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { DetailedKnowledgeGenSchema } from "@/lib/ai/schemas";
import { callAIWithRetry } from "@/lib/ai/retry";
import { zodResponseFormat } from "openai/helpers/zod";
import { buildDetailedKnowledgeGenPrompt } from "@/lib/ai/prompts";
import type { TasteSettings } from "@/lib/constants";
import { DEFAULT_TASTE_SETTINGS } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: nodeId } = await params;

  let tasteSettings: TasteSettings = DEFAULT_TASTE_SETTINGS;
  try {
    const body = await req.json() as Partial<TasteSettings>;
    if (body && typeof body === "object") {
      tasteSettings = {
        formality: body.formality ?? DEFAULT_TASTE_SETTINGS.formality,
        length: body.length ?? DEFAULT_TASTE_SETTINGS.length,
        depth: body.depth ?? DEFAULT_TASTE_SETTINGS.depth,
      };
    }
  } catch { /* body なし or 不正 JSON はデフォルトで続行 */ }

  const supabase = await createClient();

  const { data: node, error: nodeError } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("id", nodeId)
    .single();

  if (nodeError || !node) {
    return NextResponse.json({ error: "Skill node not found" }, { status: 404 });
  }

  const { data: goalData } = await supabase
    .from("goals")
    .select("title")
    .eq("id", node.goal_id)
    .single();

  const { data: allNodes } = await supabase
    .from("skill_nodes")
    .select("id, label, depth, parent_id, knowledge_text, detailed_knowledge_text")
    .eq("goal_id", node.goal_id)
    .order("depth")
    .order("sort_order");

  const nodeMap = new Map((allNodes ?? []).map((n) => [n.id, n]));

  // 祖先チェーン（親→祖父→...）を収集
  const ancestors: typeof allNodes = [];
  let cursor = nodeMap.get(node.parent_id ?? "");
  while (cursor) {
    ancestors.unshift(cursor);
    cursor = nodeMap.get(cursor.parent_id ?? "");
  }

  const treeStructure = (allNodes ?? [])
    .map((n) => {
      const indent = "  ".repeat(n.depth);
      const overview = n.knowledge_text ? `\n${indent}  概要: ${n.knowledge_text}` : "";
      return `${indent}- ${n.label}${overview}`;
    })
    .join("\n");

  const parentNode = ancestors[ancestors.length - 1];
  const siblings = allNodes?.filter(
    (n) => n.parent_id === node.parent_id && n.id !== nodeId
  ) ?? [];

  // 祖先の詳細テキストセクションを構築
  const ancestorDetailedSection = ancestors
    .filter((a) => a.detailed_knowledge_text)
    .map((a) => `### 【Lv${a.depth} 祖先ノード: ${a.label}】の詳細テキスト\n\n${a.detailed_knowledge_text}`)
    .join("\n\n---\n\n");

  const userPrompt = `以下のスキルノードに対して詳細学習テキストを生成してください。

## 学習ゴール
${goalData?.title ?? "（不明）"}

## 対象ノード
- ラベル: ${node.label}
- 深さ: ${node.depth}（ルート=0）
- 親ノード: ${parentNode?.label ?? "（なし）"}
- 兄弟ノード: ${siblings.map((s) => s.label).join(", ") || "（なし）"}
- 概要テキスト: ${node.knowledge_text ?? "（なし）"}

## スキルツリー全体構造
${treeStructure}
${
  ancestorDetailedSection
    ? `\n## 親・祖先ノードの詳細テキスト（内容に沿って整合性を保つこと）\n\n${ancestorDetailedSection}\n`
    : ""
}
上記の情報を踏まえ、「${node.label}」について6000字以上の詳細な学習テキストをMarkdown形式で生成してください。親・祖先ノードの詳細テキストがある場合は、その内容と矛盾せず、深掘りする形で作成してください。`;

  try {
    const { client, model, provider } = await getAIProvider(supabase);

    let result: z.infer<typeof DetailedKnowledgeGenSchema>;

    if (provider === "openai") {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: buildDetailedKnowledgeGenPrompt(tasteSettings) },
          { role: "user", content: userPrompt },
        ],
        response_format: zodResponseFormat(DetailedKnowledgeGenSchema, "detailed_knowledge_gen"),
        temperature: 0.7,
        max_tokens: 8192,
      });
      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      result = DetailedKnowledgeGenSchema.parse(JSON.parse(rawContent));
    } else {
      result = await callAIWithRetry(
        {
          model,
          messages: [
            { role: "system", content: buildDetailedKnowledgeGenPrompt(tasteSettings) },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8192,
        },
        DetailedKnowledgeGenSchema,
        client,
      );
    }

    const { error: updateError } = await supabase
      .from("skill_nodes")
      .update({ detailed_knowledge_text: result.detailed_knowledge_text })
      .eq("id", nodeId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      detailed_knowledge_text: result.detailed_knowledge_text,
    });
  } catch (error) {
    console.error("Detailed knowledge generation error:", error);
    const msg = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
