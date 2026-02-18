import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SettingsPayload = {
  llm_provider?: "zai" | "openai";
  openai_api_key?: string;
  openai_model?: string;
};

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["llm_provider", "openai_api_key", "openai_model"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  // API キーはマスクして返す（先頭8文字 + ***）
  if (settings["openai_api_key"] && settings["openai_api_key"].length > 8) {
    settings["openai_api_key_masked"] =
      settings["openai_api_key"].slice(0, 8) + "***";
    settings["openai_api_key"] = "";
  } else if (settings["openai_api_key"]) {
    settings["openai_api_key_masked"] = settings["openai_api_key"]
      ? "設定済み"
      : "";
    settings["openai_api_key"] = "";
  }

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body: SettingsPayload = await req.json();

  const updates: { key: string; value: string; updated_at: string }[] = [];
  const now = new Date().toISOString();

  if (body.llm_provider !== undefined) {
    updates.push({ key: "llm_provider", value: body.llm_provider, updated_at: now });
  }
  if (body.openai_model !== undefined) {
    updates.push({ key: "openai_model", value: body.openai_model, updated_at: now });
  }
  // API キーが空文字でなければ更新（空文字送信 = 変更なし）
  if (body.openai_api_key !== undefined && body.openai_api_key !== "") {
    updates.push({ key: "openai_api_key", value: body.openai_api_key, updated_at: now });
  }

  if (updates.length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
