import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "About Syntrix Labs",
  description:
    "Syntrix Labs is built by Soham and Tahir to help startups and growing businesses launch websites, apps, dashboards, and digital platforms.",
  alternates: {
    canonical: "https://syntrixlabs.in/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black px-6 pt-32 text-white">
        <section className="mx-auto max-w-6xl pb-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-400">About Syntrix Labs</p>
          <h1 className="max-w-5xl text-5xl font-bold leading-tight md:text-7xl">
            A web development studio built by Soham and Tahir.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-gray-300">
            Syntrix Labs builds custom websites, web apps, dashboards, APIs, booking workflows, and business platforms for startups and growing businesses.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="text-2xl font-bold">What we do</h2>
              <p className="mt-4 leading-relaxed text-gray-400">
                We turn business ideas into polished digital products: marketing websites, client portals, admin systems, booking flows, payment workflows, and launch-ready platforms.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="text-2xl font-bold">How we work</h2>
              <p className="mt-4 leading-relaxed text-gray-400">
                We start with a discovery call, understand the business goal, map the scope, build the product, and help clients launch with a clean handoff.
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-2xl border border-white/10 bg-zinc-950 p-7">
            <h2 className="text-2xl font-bold">Why Syntrix Labs exists</h2>
            <p className="mt-4 leading-relaxed text-gray-400">
              Many businesses need more than a basic website. They need a digital system that can collect leads, schedule meetings, manage clients, display work, and support growth. Syntrix Labs focuses on building those practical systems with modern web technology.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
