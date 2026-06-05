import BrandLogo from "@/components/brand/BrandLogo";

const schedulingUrl = process.env.NEXT_PUBLIC_SCHEDULING_URL || "";
const fallbackMailto =
  "mailto:hello@syntrixlabs.in?subject=Schedule%20a%20Syntrix%20Labs%20call";

const isExternalSchedulingUrl = /^https?:\/\//.test(schedulingUrl);
const bookingHref = isExternalSchedulingUrl ? schedulingUrl : fallbackMailto;

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col justify-center gap-10">
        <BrandLogo markClassName="h-12 w-12" />

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-400">
              Discovery Call
            </p>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
              Schedule your Syntrix Labs project call.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-gray-300">
              Pick a time to discuss your website, app, dashboard, automation, or launch plan. We can meet through Google Meet or Zoom depending on the scheduler you connect.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href={bookingHref}
                target={isExternalSchedulingUrl ? "_blank" : undefined}
                rel={isExternalSchedulingUrl ? "noreferrer" : undefined}
                className="rounded-2xl bg-blue-500 px-8 py-4 text-center font-semibold shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
              >
                Choose a Meeting Time
              </a>
              <a
                href="/"
                className="rounded-2xl border border-white/10 px-8 py-4 text-center font-semibold transition hover:border-blue-500"
              >
                Back to Home
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            {isExternalSchedulingUrl ? (
              <iframe
                src={schedulingUrl}
                title="Syntrix Labs scheduling"
                className="h-[680px] w-full rounded-2xl border-0 bg-white"
              />
            ) : (
              <div className="flex min-h-[420px] flex-col justify-center rounded-2xl border border-white/10 bg-black p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-400">
                  Meeting Request
                </p>
                <h2 className="mt-4 text-3xl font-bold">Tell us what you want to build.</h2>
                <p className="mt-4 leading-relaxed text-gray-400">
                  Send a short note with your preferred time, project type, and whether you prefer Google Meet or Zoom.
                </p>
                <a
                  href={fallbackMailto}
                  className="mt-8 rounded-2xl bg-blue-500 px-6 py-4 text-center font-semibold transition hover:bg-blue-600"
                >
                  Email Meeting Request
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
