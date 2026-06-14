import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import ImmersiveScene from "@/components/ImmersiveScene";
import ParticleShape from "@/components/ParticleShape";

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
      <ImmersiveScene />
      <main className="relative z-10 text-white">
        {/* Particle hero — the team */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden pt-24 pb-8">
          <ParticleShape shape="team" />
          <div className="relative z-10 -mt-12 px-6 text-center">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>About Syntrix Labs</p>
            <h1 className="max-w-4xl text-4xl font-light leading-tight tracking-wide md:text-6xl" style={{ textShadow: "0 0 30px rgba(10,30,20,0.85)" }}>
              A studio built by Soham &amp; Tahir.
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <p className="mx-auto max-w-3xl text-center text-lg font-light leading-relaxed text-emerald-50/75">
            Syntrix Labs builds custom websites, web apps, dashboards, APIs, booking workflows, and business platforms for startups and growing businesses.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40">
              <h2 className="text-2xl font-light">What we do</h2>
              <p className="mt-4 font-light leading-relaxed text-emerald-50/70">
                We turn business ideas into polished digital products: marketing websites, client portals, admin systems, booking flows, payment workflows, and launch-ready platforms.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40">
              <h2 className="text-2xl font-light">How we work</h2>
              <p className="mt-4 font-light leading-relaxed text-emerald-50/70">
                We start with a discovery call, understand the business goal, map the scope, build the product, and help clients launch with a clean handoff.
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40">
            <h2 className="text-2xl font-light">Why Syntrix Labs exists</h2>
            <p className="mt-4 font-light leading-relaxed text-emerald-50/70">
              Many businesses need more than a basic website. They need a digital system that can collect leads, schedule meetings, manage clients, display work, and support growth. Syntrix Labs focuses on building those practical systems with modern web technology.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
