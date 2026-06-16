import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/teams";
import type { RequestStatus } from "@/lib/types";

// Best-effort, in-memory rate limit (per IP). Resets on cold start — it's a
// light deterrent against accidental double-taps / spam, not hard security.
const RATE_LIMIT = 10; // requests
const WINDOW_MS = 60_000; // per minute
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

interface Body {
  status?: RequestStatus;
  itemId?: string;
  newItemName?: string;
  note?: string;
  reporter?: string;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { status, itemId, newItemName, note, reporter } = body;

  if (status !== "low" && status !== "out" && status !== "new_item") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (status === "new_item" && !newItemName?.trim()) {
    return NextResponse.json(
      { error: "Please describe the new item." },
      { status: 400 },
    );
  }
  if (status !== "new_item" && !itemId) {
    return NextResponse.json({ error: "Please choose an item." }, { status: 400 });
  }

  const supabase = await createClient();

  // Resolve the human-readable item name for the notification.
  let itemName = newItemName?.trim() ?? "Unknown item";
  if (status !== "new_item" && itemId) {
    const { data: item } = await supabase
      .from("items")
      .select("name")
      .eq("id", itemId)
      .single();
    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }
    itemName = item.name;
  }

  // For a new-item request, fold the typed name into the note so the admin
  // sees exactly what was asked for (item_id stays null).
  const storedNote =
    status === "new_item"
      ? [newItemName?.trim(), note?.trim()].filter(Boolean).join(" — ")
      : note?.trim() || null;

  const { error: insertError } = await supabase.from("requests").insert({
    item_id: status === "new_item" ? null : itemId,
    status,
    note: storedNote,
    reporter: reporter?.trim() || null,
  });

  if (insertError) {
    console.error("[requests] insert failed:", insertError.message);
    return NextResponse.json(
      { error: "Could not save your request." },
      { status: 500 },
    );
  }

  // Notify the admin in Teams. Don't fail the user's submission if the
  // notification hiccups — the request is already saved and visible in the
  // dashboard.
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL;
    await notifyAdmin({
      itemName,
      status,
      note: note?.trim(),
      reporter: reporter?.trim(),
      dashboardUrl: base ? `${base}/dashboard` : undefined,
    });
  } catch (err) {
    console.error("[requests] Teams notification failed:", err);
  }

  return NextResponse.json({ ok: true });
}
