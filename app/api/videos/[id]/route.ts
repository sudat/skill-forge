import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 削除前に影響を受けるノードIDを取得
  const { data: mappings } = await supabase
    .from("video_node_mappings")
    .select("node_id")
    .eq("video_id", id);

  const affectedNodeIds = [...new Set((mappings ?? []).map((m) => m.node_id))];

  // 動画削除（CASCADEでvideo_node_mappingsも削除される想定だが念のため先に削除）
  await supabase.from("video_node_mappings").delete().eq("video_id", id);
  await supabase.from("video_overlaps").delete().or(`video_a_id.eq.${id},video_b_id.eq.${id}`);

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 影響ノードのcoverage_scoreを再計算
  for (const nodeId of affectedNodeIds) {
    const { data: remaining } = await supabase
      .from("video_node_mappings")
      .select("relevance_score")
      .eq("node_id", nodeId);

    const newScore =
      remaining && remaining.length > 0
        ? Math.max(...remaining.map((m) => m.relevance_score))
        : 0;

    await supabase
      .from("skill_nodes")
      .update({ coverage_score: newScore })
      .eq("id", nodeId);
  }

  return NextResponse.json({ success: true });
}
