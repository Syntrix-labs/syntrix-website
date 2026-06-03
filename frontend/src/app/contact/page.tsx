import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";

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
      <main className="min-h-screen bg-black px-6 pt-32 text-white">
        <section className="mx-auto max-w-5xl pb-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-400">Contact</p>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
            Talk to Syntrix Labs about your next website or app.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-gray-300">
            Share your project idea, book a discovery call, or contact us about websites, dashboards, booking systems, and business platforms.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            <a href="/schedule" className="rounded-2xl border border-white/10 bg-zinc-950 p-7 transition hover:border-blue-500">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Book a call</p>
              <h2 className="mt-4 text-2xl font-bold">Schedule a Free Call</h2>
              <p className="mt-3 text-gray-400">Choose a time to discuss project scope, timeline, and next steps.</p>
            </a>
            <a href="mailto:hello@syntrixlabs.in" className="rounded-2xl border border-white/10 bg-zinc-950 p-7 transition hover:border-blue-500">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Email</p>
              <h2 className="mt-4 text-2xl font-bold">hello@syntrixlabs.in</h2>
              <p className="mt-3 text-gray-400">Send us your project brief, reference links, and preferred timeline.</p>
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
