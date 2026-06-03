import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Web Development Services",
  description:
    "Syntrix Labs offers custom website development, web apps, dashboards, APIs, booking systems, and launch support for startups and growing businesses.",
  alternates: {
    canonical: "https://syntrixlabs.in/services",
  },
};

const services = [
  {
    title: "Custom Website Development",
    text: "Fast, responsive, modern websites for startups, local businesses, agencies, creators, and service brands.",
  },
  {
    title: "Web Applications",
    text: "Client portals, dashboards, admin panels, booking flows, internal tools, and SaaS-style business platforms.",
  },
  {
    title: "Backend and API Systems",
    text: "Secure API logic for accounts, projects, uploads, meetings, payments, admin workflows, and business data.",
  },
  {
    title: "Booking and Meeting Workflows",
    text: "Google Meet, Zoom, schedule pages, meeting requests, admin approvals, and client dashboard updates.",
  },
  {
    title: "Automation and Operations",
    text: "Process dashboards, reminders, project tracking, client updates, document handling, and operational systems.",
  },
  {
    title: "Launch Support",
    text: "Deployment, performance tuning, SEO basics, analytics setup, domain configuration, and ongoing iteration.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black px-6 pt-32 text-white">
        <section className="mx-auto max-w-7xl pb-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-400">Services</p>
          <h1 className="max-w-5xl text-5xl font-bold leading-tight md:text-7xl">
            Website, app, and platform development for serious business ideas.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-relaxed text-gray-300">
            Syntrix Labs helps businesses move from rough idea to launch-ready digital product with clean design, reliable engineering, and practical business workflows.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="rounded-2xl border border-white/10 bg-zinc-950 p-7">
                <h2 className="text-2xl font-bold">{service.title}</h2>
                <p className="mt-4 leading-relaxed text-gray-400">{service.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-4 sm:flex-row">
            <a href="/schedule" className="rounded-2xl bg-blue-500 px-8 py-4 text-center font-semibold transition hover:bg-blue-600">
              Schedule a Free Call
            </a>
            <a href="/contact" className="rounded-2xl border border-white/10 px-8 py-4 text-center font-semibold transition hover:border-blue-500">
              Contact Syntrix Labs
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
