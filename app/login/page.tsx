import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fos_dark.svg"
        alt="Future OS"
        width={264}
        height={49}
        className="rise absolute left-5 top-6 h-6 w-auto sm:left-7 sm:top-7"
      />

      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-24">
        <header className="rise mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan">
            Admin Access
          </span>
          <h1 className="mt-3 font-display text-[2.5rem] font-bold uppercase italic leading-[0.92] tracking-tight text-ink">
            Sign in
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-brand" />
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            For the office admin. Staff don&apos;t need to sign in to report
            items.
          </p>
        </header>

        <div className="rise" style={{ animationDelay: "120ms" }}>
          <div className="rounded-[28px] bg-gradient-brand p-px shadow-[0_36px_90px_-50px_rgba(124,58,237,0.55)]">
            <div className="rounded-[27px] bg-surface p-6 sm:p-7">
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
