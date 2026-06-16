"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Item, RequestStatus } from "@/lib/types";

const NEW_ITEM = "__new__";

export default function RequestForm({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<RequestStatus>("low");
  const [newItemName, setNewItemName] = useState("");
  const [note, setNote] = useState("");
  const [reporter, setReporter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupByCategory(items), [items]);
  const isNew = selected === NEW_ITEM;

  const canSubmit =
    !submitting &&
    selected !== "" &&
    (!isNew || newItemName.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const body = isNew
      ? {
          status: "new_item" as const,
          newItemName: newItemName.trim(),
          note: note.trim() || undefined,
          reporter: reporter.trim() || undefined,
        }
      : {
          status,
          itemId: selected,
          note: note.trim() || undefined,
          reporter: reporter.trim() || undefined,
        };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }
      const label = isNew
        ? newItemName.trim()
        : items.find((i) => i.id === selected)?.name ?? "Your request";
      setDone(label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSelected("");
    setStatus("low");
    setNewItemName("");
    setNote("");
    setDone(null);
    setError(null);
  }

  if (done) {
    return (
      <GradientCard className="rise text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-surface">
            <Check className="text-cyan" size={26} stroke={2.2} />
          </span>
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold uppercase italic tracking-tight text-ink">
          Request received
        </h2>
        <p className="mx-auto mt-2 max-w-[18rem] text-[15px] leading-relaxed text-ink-soft">
          We&apos;ve logged{" "}
          <span className="font-semibold text-ink">{done}</span> and notified the
          office admin.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border bg-surface-2 py-3.5 text-sm font-medium text-ink transition hover:bg-white/5"
          style={{ borderColor: "var(--color-line)" }}
        >
          Report something else
        </button>
      </GradientCard>
    );
  }

  return (
    <GradientCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item picker */}
        <div>
          <span className="label" id="item-label">
            What needs restocking?
          </span>
          <ItemSelect
            groups={grouped}
            items={items}
            value={selected}
            onChange={setSelected}
            labelledBy="item-label"
          />
        </div>

        {/* New item free-text */}
        {isNew && (
          <div className="fade-in">
            <label htmlFor="newItem" className="label">
              What do you need?
            </label>
            <input
              id="newItem"
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Standing desk mats"
              className="field"
              autoFocus
            />
          </div>
        )}

        {/* Status (existing items only) */}
        {selected && !isNew && (
          <div className="fade-in">
            <span className="label">How urgent is it?</span>
            <div className="grid grid-cols-2 gap-3">
              <StatusButton
                active={status === "low"}
                onClick={() => setStatus("low")}
                label="Running low"
                hint="Still some left"
                accent="var(--color-cyan)"
              />
              <StatusButton
                active={status === "out"}
                onClick={() => setStatus("out")}
                label="Out of stock"
                hint="None at all"
                accent="var(--color-pink)"
              />
            </div>
          </div>
        )}

        {/* Note */}
        <div>
          <label htmlFor="note" className="label">
            Note <span className="font-normal text-ink-faint">— optional</span>
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Brand, quantity, where it's kept…"
            className="field resize-none"
          />
        </div>

        {/* Reporter */}
        <div>
          <label htmlFor="reporter" className="label">
            Your name <span className="font-normal text-ink-faint">— optional</span>
          </label>
          <input
            id="reporter"
            type="text"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            placeholder="So the admin can follow up"
            className="field"
          />
        </div>

        {error && (
          <p
            className="fade-in rounded-2xl px-4 py-3 text-sm text-pink"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-pink) 12%, transparent)",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-4 text-[15px] font-semibold tracking-wide text-white shadow-[0_18px_44px_-14px_rgba(124,58,237,0.75)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? (
            "Sending…"
          ) : (
            <>
              Send request
              <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </GradientCard>
  );
}

/* A surface card wrapped in a 1px brand-gradient border. */
function GradientCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-[28px] bg-gradient-brand p-px shadow-[0_36px_90px_-50px_rgba(124,58,237,0.55)]">
      <div className={`rounded-[27px] bg-surface p-6 sm:p-7 ${className}`}>
        {children}
      </div>
    </div>
  );
}

function ItemSelect({
  groups,
  items,
  value,
  onChange,
  labelledBy,
}: {
  groups: [string, Item[]][];
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  labelledBy: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedLabel =
    value === NEW_ITEM
      ? "Something else (new item)"
      : items.find((i) => i.id === value)?.name ?? null;

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        className="field flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={selectedLabel ? "text-ink" : "text-ink-faint"}>
          {selectedLabel ?? "Choose an item…"}
        </span>
        <Chevron
          className={`shrink-0 text-ink-soft transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby={labelledBy}
          className="fade-in absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border bg-surface-2 p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
          style={{ borderColor: "var(--color-line)" }}
        >
          {groups.map(([category, group]) => (
            <div key={category} className="pb-1">
              <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {category}
              </p>
              {group.map((item) => (
                <Option
                  key={item.id}
                  label={item.name}
                  selected={value === item.id}
                  onClick={() => choose(item.id)}
                />
              ))}
            </div>
          ))}
          <div
            className="mx-2 my-1 border-t"
            style={{ borderColor: "var(--color-line)" }}
          />
          <Option
            label="Something else (new item)"
            selected={value === NEW_ITEM}
            onClick={() => choose(NEW_ITEM)}
            leading="+"
          />
        </div>
      )}
    </div>
  );
}

function Option({
  label,
  selected,
  onClick,
  leading,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  leading?: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-left text-[15px] transition ${
        selected ? "text-ink" : "text-ink hover:bg-white/5"
      }`}
      style={
        selected
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--color-blue) 18%, transparent)",
            }
          : undefined
      }
    >
      <span className="flex items-center gap-2">
        {leading && (
          <span className="text-base font-semibold text-cyan">{leading}</span>
        )}
        {label}
      </span>
      {selected && <Check className="shrink-0 text-cyan" />}
    </button>
  );
}

function StatusButton({
  active,
  onClick,
  label,
  hint,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-col items-start gap-1 rounded-2xl border px-4 py-3.5 text-left transition ${
        active ? "text-ink" : "bg-surface-2 text-ink-soft hover:border-white/20"
      }`}
      style={
        active
          ? {
              borderColor: accent,
              backgroundColor: `color-mix(in srgb, ${accent} 14%, var(--color-surface))`,
            }
          : { borderColor: "var(--color-line)" }
      }
    >
      <span className="text-sm font-semibold leading-tight text-ink">{label}</span>
      <span className="text-xs leading-tight text-ink-soft">{hint}</span>
      {active && (
        <span
          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
        />
      )}
    </button>
  );
}

function Check({
  className,
  size = 16,
  stroke = 2.4,
}: {
  className?: string;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12.5l4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function groupByCategory(items: Item[]): [string, Item[]][] {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.category?.trim() || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()];
}
