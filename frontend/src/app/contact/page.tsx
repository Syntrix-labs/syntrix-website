import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import ImmersiveScene from "@/components/ImmersiveScene";
import ParticleShape from "@/components/ParticleShape";

export const metadata: Metadata = {
  title: "Contact Syntrix Labs",
  description:
    "Contact Syntrix Labs to discuss website development, web apps, dashboards, booking systems, and digital business platforms.",
  alternates: {
    canonical: "https://syntrixlabs.in/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <ImmersiveScene />
      <main className="relative z-10 text-white">
        {/* Particle hero — message */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden pt-24 pb-8">
          <ParticleShape shape="message" />
          <div className="relative z-10 -mt-12 px-6 text-center">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>Contact</p>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-wide md:text-6xl" style={{ textShadow: "0 0 30px rgba(10,30,20,0.85)" }}>
              Let&apos;s talk about your next build.
            </h1>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <p className="mx-auto max-w-3xl text-center text-lg font-light leading-relaxed text-emerald-50/75">
            Share your project idea, book a discovery call, or contact us about websites, dashboards, booking systems, and business platforms.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            <a href="/schedule" className="rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40">
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "#a9ba9d" }}>Book a call</p>
              <h2 className="mt-4 text-2xl font-light">Schedule a Free Call</h2>
              <p className="mt-3 font-light text-emerald-50/70">Choose a time to discuss project scope, timeline, and next steps.</p>
            </a>
            <a href="mailto:hello@syntrixlabs.in" className="rounded-2xl border border-emerald-200/15 bg-emerald-950/20 p-7 backdrop-blur-sm transition hover:border-emerald-300/40">
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "#a9ba9d" }}>Email</p>
              <h2 className="mt-4 text-2xl font-light">hello@syntrixlabs.in</h2>
              <p className="mt-3 font-light text-emerald-50/70">Send us your project brief, reference links, and preferred timeline.</p>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
