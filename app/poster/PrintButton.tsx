"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-14px_rgba(124,58,237,0.8)] transition hover:brightness-110 print:hidden"
    >
      Print poster
    </button>
  );
}
