import ImmersiveScene from "@/components/ImmersiveScene";
import ParticleShape from "@/components/ParticleShape";

const schedulingUrl = process.env.NEXT_PUBLIC_SCHEDULING_URL || "";
const fallbackMailto =
  "mailto:hello@syntrixlabs.in?subject=Schedule%20a%20Syntrix%20Labs%20call";

const isExternalSchedulingUrl = /^https?:\/\//.test(schedulingUrl);
const bookingHref = isExternalSchedulingUrl ? schedulingUrl : fallbackMailto;

export default function SchedulePage() {
  return (
    <>
      <ImmersiveScene />
      <main className="relative z-10 text-white">
        {/* Particle hero — clock */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden pt-24 pb-8">
          <ParticleShape shape="clock" />
          <div className="relative z-10 -mt-12 px-6 text-center">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>Schedule</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-wide md:text-6xl" style={{ textShadow: "0 0 30px rgba(10,30,20,0.85)" }}>
              Pick a time that works for you.
            </h1>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20">
          <a
            href="/"
            aria-label="Syntrix Labs home"
            className="text-base font-light tracking-[0.32em] text-white"
            style={{ textShadow: "0 0 18px rgba(120,210,160,0.5)" }}
          >
            SYNTRIX<span style={{ color: "#a9ba9d" }}>&nbsp;LABS</span>
          </a>

          <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>
                Discovery Call
              </p>
              <h2 className="max-w-3xl text-4xl font-light leading-tight tracking-wide md:text-6xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>
                Schedule your Syntrix Labs project call.
              </h2>
              <p className="mt-7 max-w-2xl text-lg font-light leading-relaxed text-emerald-50/75">
                Pick a time to discuss your website, app, dashboard, automation, or launch plan. We can meet through Google Meet or Zoom depending on the scheduler you connect.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href={bookingHref}
                  target={isExternalSchedulingUrl ? "_blank" : undefined}
                  rel={isExternalSchedulingUrl ? "noreferrer" : undefined}
                  className="rounded-full bg-emerald-500/90 px-8 py-4 text-center font-medium tracking-wide shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                >
                  Choose a Meeting Time
                </a>
                <a
                  href="/"
                  className="rounded-full border border-emerald-200/25 px-8 py-4 text-center font-medium tracking-wide transition hover:border-emerald-200/60"
                >
                  Back to Home
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200/15 bg-emerald-950/20 p-6 backdrop-blur-sm">
              {isExternalSchedulingUrl ? (
                <iframe
                  src={schedulingUrl}
                  title="Syntrix Labs scheduling"
                  className="h-[680px] w-full rounded-2xl border-0 bg-white"
                />
              ) : (
                <div className="flex min-h-[420px] flex-col justify-center rounded-2xl border border-emerald-200/15 bg-emerald-950/30 p-8">
                  <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: "#a9ba9d" }}>
                    Meeting Request
                  </p>
                  <h2 className="mt-4 text-3xl font-light">Tell us what you want to build.</h2>
                  <p className="mt-4 font-light leading-relaxed text-emerald-50/70">
                    Send a short note with your preferred time, project type, and whether you prefer Google Meet or Zoom.
                  </p>
                  <a
                    href={fallbackMailto}
                    className="mt-8 rounded-full bg-emerald-500/90 px-6 py-4 text-center font-medium transition hover:bg-emerald-400"
                  >
                    Email Meeting Request
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
