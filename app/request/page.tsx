import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import RequestForm from "./RequestForm";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, name, category, active, created_at")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const items = (data ?? []) as Item[];

  return (
    <main className="relative min-h-dvh">
      {/* Logo pinned to the true top-left of the page (light-on-dark variant). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fos_dark.svg"
        alt="Future OS"
        width={264}
        height={49}
        className="rise absolute left-5 top-6 h-6 w-auto sm:left-7 sm:top-7"
      />

      <div className="mx-auto flex max-w-md flex-col px-5 pb-12 pt-24">
        <header className="rise mb-8" style={{ animationDelay: "80ms" }}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan">
            Office Restock
          </span>
          <h1 className="mt-3 font-display text-[2.7rem] font-bold italic uppercase leading-[0.92] tracking-tight text-ink">
            What&apos;s running low?
          </h1>
          <div className="mt-4 h-1 w-24 rounded-full bg-gradient-brand" />
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            Spotted something we&apos;re short on? Let the office admin know in a
            few taps — no sign-in needed.
          </p>
        </header>

        <div className="rise" style={{ animationDelay: "160ms" }}>
          {error ? (
            <div
              className="rounded-3xl border bg-surface p-6 text-sm text-pink"
              style={{ borderColor: "var(--color-line)" }}
            >
              We couldn&apos;t load the item list right now. Please refresh in a
              moment.
            </div>
          ) : (
            <RequestForm items={items} />
          )}
        </div>

        <p
          className="rise mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-faint"
          style={{ animationDelay: "240ms" }}
        >
          Future OS
        </p>
      </div>
    </main>
  );
}
