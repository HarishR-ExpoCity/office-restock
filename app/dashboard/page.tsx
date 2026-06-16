import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Item, RequestWithItem, RequestStatus } from "@/lib/types";
import {
  resolveRequest,
  reopenRequest,
  addItem,
  toggleItem,
  signOut,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_META: Record<RequestStatus, { label: string; accent: string }> = {
  low: { label: "Running low", accent: "var(--color-cyan)" },
  out: { label: "Out", accent: "var(--color-pink)" },
  new_item: { label: "New item", accent: "var(--color-magenta)" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showResolved = view === "resolved";
  const supabase = await createClient();

  // Defense-in-depth: don't rely on the proxy matcher alone for authorization.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: requestData }, { data: itemData }] = await Promise.all([
    supabase
      .from("requests")
      .select("*, items(name, category)")
      .eq("resolved", showResolved)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("items")
      .select("id, name, category, active, created_at")
      .order("name", { ascending: true }),
  ]);

  const requests = (requestData ?? []) as RequestWithItem[];
  const items = (itemData ?? []) as Item[];

  return (
    <main className="relative min-h-dvh">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fos_dark.svg"
        alt="Future OS"
        width={264}
        height={49}
        className="absolute left-5 top-6 h-6 w-auto sm:left-7 sm:top-7"
      />
      <form action={signOut} className="absolute right-5 top-5 sm:right-7 sm:top-6">
        <button
          className="rounded-xl border px-3.5 py-2 text-sm text-ink-soft transition hover:bg-white/5 hover:text-ink"
          style={{ borderColor: "var(--color-line)" }}
        >
          Sign out
        </button>
      </form>

      <div className="mx-auto max-w-3xl px-5 pb-16 pt-24">
        <header className="mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan">
            Office Restock
          </span>
          <h1 className="mt-2 font-display text-[2.2rem] font-bold uppercase italic leading-[0.95] tracking-tight text-ink">
            Dashboard
          </h1>
        </header>

        {/* View toggle */}
        <div
          className="mb-5 inline-flex rounded-xl border bg-surface-2 p-1 text-sm"
          style={{ borderColor: "var(--color-line)" }}
        >
          <Link
            href="/dashboard"
            className={`rounded-lg px-4 py-1.5 font-medium transition ${
              !showResolved
                ? "bg-gradient-brand text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Open
          </Link>
          <Link
            href="/dashboard?view=resolved"
            className={`rounded-lg px-4 py-1.5 font-medium transition ${
              showResolved
                ? "bg-gradient-brand text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Resolved
          </Link>
        </div>

        {/* Requests */}
        <section className="space-y-3">
          {requests.length === 0 ? (
            <p
              className="rounded-2xl border border-dashed bg-surface p-10 text-center text-sm text-ink-soft"
              style={{ borderColor: "var(--color-line)" }}
            >
              {showResolved ? "Nothing resolved yet." : "No open requests. 🎉"}
            </p>
          ) : (
            requests.map((r) => {
              const meta = STATUS_META[r.status];
              const name =
                r.items?.name ?? (r.status === "new_item" ? "New item" : "Item");
              return (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border bg-surface-2 p-4"
                  style={{ borderColor: "var(--color-line)" }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{name}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                        style={{
                          color: meta.accent,
                          backgroundColor: `color-mix(in srgb, ${meta.accent} 16%, transparent)`,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {r.note && (
                      <p className="mt-1.5 text-sm text-ink-soft">{r.note}</p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-faint">
                      {formatDate(r.created_at)}
                      {r.reporter ? ` · ${r.reporter}` : ""}
                    </p>
                  </div>
                  <form action={showResolved ? reopenRequest : resolveRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      className="whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm text-ink transition hover:bg-white/5"
                      style={{ borderColor: "var(--color-line)" }}
                    >
                      {showResolved ? "Reopen" : "Mark done"}
                    </button>
                  </form>
                </div>
              );
            })
          )}
        </section>

        {/* Item management */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold uppercase italic tracking-tight text-ink">
            Items in the dropdown
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Add items staff can choose from, or hide ones you no longer stock.
          </p>

          <form action={addItem} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              name="name"
              required
              placeholder="Item name"
              className="field flex-1 py-2.5 text-sm"
            />
            <input
              name="category"
              placeholder="Category (optional)"
              className="field py-2.5 text-sm sm:w-48"
            />
            <button className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
              Add
            </button>
          </form>

          <ul
            className="mt-4 overflow-hidden rounded-2xl border bg-surface-2"
            style={{ borderColor: "var(--color-line)" }}
          >
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b px-4 py-2.5 text-sm last:border-b-0"
                style={{ borderColor: "var(--color-line)" }}
              >
                <span
                  className={
                    item.active ? "text-ink" : "text-ink-faint line-through"
                  }
                >
                  {item.name}
                  {item.category && (
                    <span className="ml-2 text-xs text-ink-faint">
                      {item.category}
                    </span>
                  )}
                </span>
                <form action={toggleItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="active" value={String(item.active)} />
                  <button className="text-xs font-medium text-ink-soft transition hover:text-cyan">
                    {item.active ? "Hide" : "Show"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
