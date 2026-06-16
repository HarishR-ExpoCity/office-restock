"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Authorize inside every Server Action — the Next.js docs warn not to rely on
// the proxy matcher alone, since Server Actions are POSTs that can be invoked
// from anywhere. getUser() revalidates against the Supabase Auth server.
async function requireUserClient(): Promise<SupabaseClient> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function resolveRequest(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await requireUserClient();
  await supabase
    .from("requests")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard");
}

export async function reopenRequest(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await requireUserClient();
  await supabase
    .from("requests")
    .update({ resolved: false, resolved_at: null })
    .eq("id", id);
  revalidatePath("/dashboard");
}

export async function addItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  if (!name) return;
  const supabase = await requireUserClient();
  await supabase.from("items").insert({ name, category });
  revalidatePath("/dashboard");
  revalidatePath("/request");
}

export async function toggleItem(formData: FormData) {
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const supabase = await requireUserClient();
  await supabase.from("items").update({ active: !active }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/request");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
