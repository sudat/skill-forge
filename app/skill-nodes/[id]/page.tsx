import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailedKnowledgeView } from "./DetailedKnowledgeView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SkillNodeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: node, error } = await supabase
    .from("skill_nodes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !node) {
    notFound();
  }

  return <DetailedKnowledgeView node={node} goalId={node.goal_id} />;
}
