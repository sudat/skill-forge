import { createClient } from "@/lib/supabase/server";
import { VideosContainer } from "@/components/videos/videos-container";

export default async function VideosPage() {
  const supabase = await createClient();

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  return <VideosContainer initialVideos={videos ?? []} />;
}
