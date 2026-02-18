import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { AIResponseSchema } from "@/lib/ai/schemas";
import { callAIWithRetry } from "@/lib/ai/retry";
import { zodResponseFormat } from "openai/helpers/zod";
import { GOAL_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { GoalConversation } from "@/types/database";

type RequestBody = {
  goal_id: string | null;
  message: string;
  goal_title?: string;
};

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const body: RequestBody = await req.json();
        const { message, goal_title } = body;
        let { goal_id } = body;

        const supabase = await createClient();

        // 新規ゴール作成
        if (!goal_id) {
          const title = goal_title || message.slice(0, 100);
          const { data: newGoal, error } = await supabase
            .from("goals")
            .insert({ title, status: "active" })
            .select()
            .single();

          if (error || !newGoal) {
            send({ type: "error", message: "ゴールの作成に失敗しました" });
            controller.close();
            return;
          }
          goal_id = newGoal.id;
          send({ type: "goal_created", goal_id });
        }

        // 過去の対話履歴を取得
        const { data: history } = await supabase
          .from("goal_conversations")
          .select("*")
          .eq("goal_id", goal_id)
          .order("created_at", { ascending: true });

        // ユーザーメッセージをDBに保存
        const { data: userConv } = await supabase
          .from("goal_conversations")
          .insert({ goal_id, role: "user", message })
          .select()
          .single();

        if (!userConv) {
          send({ type: "error", message: "メッセージの保存に失敗しました" });
          controller.close();
          return;
        }

        // メッセージ履歴を構築
        const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
          { role: "system", content: GOAL_CHAT_SYSTEM_PROMPT },
        ];

        if (history) {
          for (const conv of history as GoalConversation[]) {
            messages.push({
              role: conv.role as "user" | "assistant",
              content: conv.message,
            });
          }
        }
        messages.push({ role: "user", content: message });

        // プロバイダーを取得して AI に送信
        const { client, model, provider } = await getAIProvider(supabase);

        let aiResponse: z.infer<typeof AIResponseSchema>;

        if (provider === "openai") {
          // OpenAI: json_schema で構造保証
          const completion = await client.chat.completions.create({
            model,
            messages,
            response_format: zodResponseFormat(AIResponseSchema, "ai_response"),
            temperature: 0.7,
            max_tokens: 4096,
          });
          const rawContent = completion.choices[0]?.message?.content ?? "{}";
          aiResponse = AIResponseSchema.parse(JSON.parse(rawContent));
        } else {
          // Z.AI: json_object + Zod バリデーション + リトライ
          aiResponse = await callAIWithRetry(
            { model, messages, temperature: 0.7, max_tokens: 4096 },
            AIResponseSchema,
            client,
          );
        }

        if (aiResponse.type === "tree_generation") {
          // ツリー生成処理
          const { nodes } = aiResponse.tree;

          // AIメッセージをDBに保存
          const { data: aiConv } = await supabase
            .from("goal_conversations")
            .insert({
              goal_id,
              role: "assistant",
              message: aiResponse.message,
              triggered_tree_update: true,
            })
            .select()
            .single();

          // temp_id → DB UUID マッピング
          const tempIdToDbId: Record<string, string> = {};

          // ノードをdepthの昇順でソートして挿入（親が先に作られるように）
          const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth);

          for (const node of sortedNodes) {
            const parentId = node.parent_temp_id
              ? tempIdToDbId[node.parent_temp_id] ?? null
              : null;

            const status = node.depth === 0 ? "in_progress" : "available";

            const { data: dbNode, error: insertError } = await supabase
              .from("skill_nodes")
              .insert({
                goal_id,
                parent_id: parentId,
                label: node.label,
                knowledge_text: node.knowledge_text,
                depth: node.depth,
                sort_order: node.sort_order,
                status,
                coverage_score: 0,
              })
              .select()
              .single();

            if (!insertError && dbNode) {
              tempIdToDbId[node.temp_id] = dbNode.id;
            }
          }

          void aiConv;

          send({
            type: "tree_generated",
            goal_id,
            node_count: nodes.length,
            message: aiResponse.message,
          });
        } else {
          // 通常の対話
          await supabase
            .from("goal_conversations")
            .insert({
              goal_id,
              role: "assistant",
              message: aiResponse.message,
              triggered_tree_update: false,
            });

          send({ type: "chat_message", message: aiResponse.message });
        }

        send({ type: "done" });
        controller.close();
      } catch (error) {
        console.error("Chat API error:", error);
        const msg = error instanceof Error ? error.message : "不明なエラー";
        const encoder2 = new TextEncoder();
        controller.enqueue(
          encoder2.encode(
            `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
