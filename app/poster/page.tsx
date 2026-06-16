import QRCode from "qrcode";
import PrintButton from "./PrintButton";

export const metadata = {
  title: "Scan to Restock · Future OS",
};

export default async function PosterPage() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const target = `${base}/request`;
  const display = base.replace(/^https?:\/\//, "") + "/request";

  const qrSvg = await QRCode.toString(target, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });

  return (
    <main className="poster-print relative min-h-dvh">
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
            Office Supplies
          </span>
          <h1 className="mt-3 font-display text-[2.7rem] font-bold uppercase italic leading-[0.92] tracking-tight text-ink">
            Running low on something?
          </h1>
          <div className="mt-4 h-1 w-24 rounded-full bg-gradient-brand" />
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            Scan the code to tell the office admin. Takes 10 seconds — no app
            and no sign-in needed.
          </p>
        </header>

        <div className="rise" style={{ animationDelay: "160ms" }}>
          <div className="rounded-[28px] bg-gradient-brand p-px shadow-[0_36px_90px_-50px_rgba(124,58,237,0.55)]">
            <div className="flex flex-col items-center rounded-[27px] bg-surface p-6 sm:p-7">
              <span className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan">
                ↓ Scan me ↓
              </span>
              <div
                className="w-full max-w-[240px] rounded-2xl bg-white p-5 [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="mt-4 break-all text-center text-[13px] text-ink-faint">
                {display}
              </p>
            </div>
          </div>
        </div>

        <p
          className="rise mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-faint"
          style={{ animationDelay: "240ms" }}
        >
          Future OS
        </p>
      </div>

      <PrintButton />
    </main>
  );
}
