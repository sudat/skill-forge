import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  status: "active" | "archived";
};

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. ゴールがアーカイブ済みか確認
  const { data: goal, error: fetchError } = await supabase
    .from("goals")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.status !== "archived") {
    return NextResponse.json(
      { error: "Only archived goals can be deleted" },
      { status: 400 }
    );
  }

  // 2. 削除対象のskill_node IDsを取得
  const { data: skillNodes } = await supabase
    .from("skill_nodes")
    .select("id")
    .eq("goal_id", id);

  const nodeIds = skillNodes?.map((n) => n.id) ?? [];

  // 3. video_node_mappingsを削除
  if (nodeIds.length > 0) {
    const { error: mappingError } = await supabase
      .from("video_node_mappings")
      .delete()
      .in("node_id", nodeIds);

    if (mappingError) {
      return NextResponse.json(
        { error: `Failed to delete video_node_mappings: ${mappingError.message}` },
        { status: 500 }
      );
    }
  }

  // 4. skill_nodesを削除
  const { error: nodesError } = await supabase
    .from("skill_nodes")
    .delete()
    .eq("goal_id", id);

  if (nodesError) {
    return NextResponse.json(
      { error: `Failed to delete skill_nodes: ${nodesError.message}` },
      { status: 500 }
    );
  }

  // 5. goal_conversationsを削除
  const { error: conversationsError } = await supabase
    .from("goal_conversations")
    .delete()
    .eq("goal_id", id);

  if (conversationsError) {
    return NextResponse.json(
      { error: `Failed to delete goal_conversations: ${conversationsError.message}` },
      { status: 500 }
    );
  }

  // 6. goalsを削除
  const { error: goalError } = await supabase
    .from("goals")
    .delete()
    .eq("id", id);

  if (goalError) {
    return NextResponse.json(
      { error: `Failed to delete goal: ${goalError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: RequestBody = await req.json();
  const { status } = body;

  if (status !== "active" && status !== "archived") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createClient();

  if (status === "active") {
    // 既存のアクティブゴールを全てアーカイブ
    const { error: archiveError } = await supabase
      .from("goals")
      .update({ status: "archived" })
      .eq("status", "active")
      .neq("id", id);

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("goals")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ goal: data });
}
