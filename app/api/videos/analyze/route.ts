import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { AnalysisResultSchema, OverlapResultSchema } from "@/lib/ai/schemas";
import { callAIWithRetry } from "@/lib/ai/retry";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  VIDEO_ANALYSIS_SYSTEM_PROMPT,
  VIDEO_OVERLAP_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import type { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  let videoId: string | null = null;

  try {
    const body = (await req.json()) as { video_id: string };
    videoId = body.video_id ?? null;

    if (!videoId) {
      return NextResponse.json({ error: "video_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 動画データを取得
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // analyzing状態に更新
    await supabase
      .from("videos")
      .update({ analysis_status: "analyzing" })
      .eq("id", videoId);

    // アクティブゴールのスキルノードを取得
    const { data: goals } = await supabase
      .from("goals")
      .select("id")
      .eq("status", "active")
      .limit(1);

    const activeGoalId = goals?.[0]?.id ?? null;

    let skillNodesInfo = "（スキルツリーが設定されていません）";
    if (activeGoalId) {
      const { data: nodes } = await supabase
        .from("skill_nodes")
        .select("id, label, depth")
        .eq("goal_id", activeGoalId)
        .order("depth")
        .order("sort_order");

      if (nodes && nodes.length > 0) {
        skillNodesInfo = nodes
          .map((n) => `${"  ".repeat(n.depth)}- [${n.id}] ${n.label}`)
          .join("\n");
      }
    }

    const userPrompt = `以下の動画を解析してください。

## 動画タイトル
${video.title}

## 文字起こし
${video.transcript.slice(0, 8000)}

## 現在のスキルツリー（ノードID付き）
${skillNodesInfo}

スキルツリーの各ノードに対して、この動画がどの程度カバーしているかを分析し、関連度30以上のノードについてマッピング情報を生成してください。`;

    // プロバイダーを取得して AI 解析
    const { client, model, provider } = await getAIProvider(supabase);

    let result: z.infer<typeof AnalysisResultSchema>;

    if (provider === "openai") {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: VIDEO_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: zodResponseFormat(AnalysisResultSchema, "analysis_result"),
        temperature: 0.7,
        max_tokens: 4096,
      });
      const rawContent = completion.choices[0]?.message?.content ?? "";
      if (!rawContent.trim()) throw new Error("AI returned empty response");
      result = AnalysisResultSchema.parse(JSON.parse(rawContent));
    } else {
      result = await callAIWithRetry(
        {
          model,
          messages: [
            { role: "system", content: VIDEO_ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        },
        AnalysisResultSchema,
        client,
      );
    }

    // videosテーブルを更新
    await supabase
      .from("videos")
      .update({
        summary: result.summary ?? null,
        key_points: result.key_points as unknown as Json,
        analysis_status: "completed",
      })
      .eq("id", videoId)
      .eq("analysis_status", "analyzing");

    // video_node_mappingsをinsert
    if (result.node_mappings && result.node_mappings.length > 0) {
      const mappingsToInsert = result.node_mappings.map((m) => ({
        video_id: videoId!,
        node_id: m.node_id,
        relevance_score: m.relevance_score,
        coverage_detail: m.coverage_detail ?? null,
        timestamp_start: m.timestamp_start ?? null,
        timestamp_end: m.timestamp_end ?? null,
      }));

      await supabase.from("video_node_mappings").insert(mappingsToInsert);

      // coverage_scoreを更新
      const nodeIds = [...new Set(result.node_mappings.map((m) => m.node_id))];
      for (const nodeId of nodeIds) {
        const { data: mappings } = await supabase
          .from("video_node_mappings")
          .select("relevance_score")
          .eq("node_id", nodeId);

        if (mappings && mappings.length > 0) {
          const maxScore = Math.max(
            ...mappings.map((m) => (m as { relevance_score: number }).relevance_score),
          );
          await supabase
            .from("skill_nodes")
            .update({ coverage_score: maxScore })
            .eq("id", nodeId);
        }
      }
    }

    // 既存動画との重複チェック
    const { data: existingVideos } = await supabase
      .from("videos")
      .select("id, title, key_points")
      .eq("analysis_status", "completed")
      .neq("id", videoId);

    if (existingVideos && existingVideos.length > 0 && result.key_points) {
      for (const existingVideo of existingVideos) {
        if (!existingVideo.key_points) continue;

        const [videoAId, videoBId] =
          videoId < existingVideo.id
            ? [videoId, existingVideo.id]
            : [existingVideo.id, videoId];

        const { data: existingOverlap } = await supabase
          .from("video_overlaps")
          .select("id")
          .eq("video_a_id", videoAId)
          .eq("video_b_id", videoBId)
          .single();

        if (existingOverlap) continue;

        const overlapPrompt = `以下の2本の動画のキーポイントを比較して重複度を分析してください。

## 動画A: ${video.title}
${JSON.stringify(result.key_points, null, 2)}

## 動画B: ${existingVideo.title}
${JSON.stringify(existingVideo.key_points, null, 2)}`;

        let overlapResult: z.infer<typeof OverlapResultSchema>;

        if (provider === "openai") {
          const overlapCompletion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: VIDEO_OVERLAP_SYSTEM_PROMPT },
              { role: "user", content: overlapPrompt },
            ],
            response_format: zodResponseFormat(OverlapResultSchema, "overlap_result"),
            temperature: 0.7,
            max_tokens: 1024,
          });
          const raw = overlapCompletion.choices[0]?.message?.content ?? "{}";
          overlapResult = OverlapResultSchema.parse(JSON.parse(raw));
        } else {
          overlapResult = await callAIWithRetry(
            {
              model,
              messages: [
                { role: "system", content: VIDEO_OVERLAP_SYSTEM_PROMPT },
                { role: "user", content: overlapPrompt },
              ],
              temperature: 0.7,
              max_tokens: 1024,
            },
            OverlapResultSchema,
            client,
          );
        }

        await supabase.from("video_overlaps").insert({
          video_a_id: videoAId,
          video_b_id: videoBId,
          overlap_score: overlapResult.overlap_score,
          overlapping_topics: overlapResult.overlapping_topics as unknown as Json,
          recommendation: overlapResult.recommendation ?? null,
        });
      }
    }

    return NextResponse.json({ success: true, video_id: videoId });
  } catch (error) {
    console.error("Video analysis error:", error);

    if (videoId) {
      try {
        const supabase = await createClient();
        await supabase
          .from("videos")
          .update({ analysis_status: "failed" })
          .eq("id", videoId)
          .eq("analysis_status", "analyzing");
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
