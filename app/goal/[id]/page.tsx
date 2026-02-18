import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoalDetailClient } from "./GoalDetailClient";

export default async function GoalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .single();

  if (!goal) notFound();

  const { data: nodes } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("goal_id", id)
    .order("sort_order");

  const { data: history } = await supabase
    .from("goal_conversations")
    .select("*")
    .eq("goal_id", id)
    .order("created_at", { ascending: true });

  const defaultTab = tab === "chat" ? "chat" : "document";

  return (
    <GoalDetailClient
      goal={goal}
      nodes={nodes ?? []}
      history={history ?? []}
      defaultTab={defaultTab}
    />
  );
}
