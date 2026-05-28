"use client";

import Navbar from "@/components/navbar/Navbar";
import { motion } from "framer-motion";

const services = [
  ["Custom Websites", "Fast, premium business websites for startups, local companies, agencies, creators, and service brands."],
  ["Web Applications", "Client portals, dashboards, booking flows, admin panels, SaaS tools, and internal business platforms."],
  ["Mobile App Experiences", "Modern app interfaces, product flows, authentication screens, and API-ready mobile foundations."],
  ["Backend & API Systems", "Secure API logic for users, projects, uploads, meetings, payments, and admin operations."],
  ["Automation & Operations", "Tracking stages, reminders, client updates, document workflows, and business process dashboards."],
  ["Launch & Growth Support", "Deployment guidance, performance tuning, portfolio presentation, and ongoing product iteration."],
];

const portfolio = [
  { title: "Startup Website", type: "Landing page", image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80" },
  { title: "Client Dashboard", type: "Business portal", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80" },
  { title: "Admin Panel", type: "Operations control", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80" },
  { title: "Booking System", type: "Meeting workflow", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80" },
  { title: "Mobile App UI", type: "Product design", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80" },
  { title: "Payment Flow", type: "Client billing", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80" },
];

const scheduleHref = "/schedule";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black text-white pt-20">
        <section
          id="home"
          className="relative min-h-[82vh] px-6 flex items-center overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85')" }}
        >
          <div className="absolute inset-0 bg-black/75" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08),#000)]" />
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-7xl mx-auto w-full">
            <p className="text-blue-400 font-semibold uppercase mb-5">Syntrix Labs</p>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-5xl">
              Custom websites, apps, and business platforms for serious startups.
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mt-7 max-w-3xl leading-relaxed">
              We help clients turn ideas into polished digital products: public websites, client dashboards, admin systems, APIs, booking flows, payments, and launch-ready platforms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <a href={scheduleHref} className="bg-blue-500 hover:bg-blue-600 transition px-7 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/25">Schedule a Free Call</a>
              <a href="#portfolio" className="border border-white/20 hover:border-blue-400 transition px-7 py-4 rounded-2xl text-lg font-semibold">View Work</a>
            </div>
          </motion.div>
        </section>

        <section id="services" className="py-24 px-6 bg-black scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-12">
              <p className="text-blue-500 uppercase font-semibold mb-4">Services</p>
              <h2 className="text-4xl md:text-5xl font-bold">Everything a client needs to start online and scale.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map(([title, text]) => (
                <div key={title} className="bg-zinc-950 border border-white/10 rounded-2xl p-7 hover:border-blue-500/60 transition">
                  <h3 className="text-2xl font-bold mb-4">{title}</h3>
                  <p className="text-gray-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-zinc-950 border-y border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[["10+", "Frontend concepts"], ["24/7", "Client-first support"], ["100%", "Custom builds"], ["Global", "Remote ready"]].map(([number, label]) => (
              <div key={label} className="border border-white/10 rounded-2xl p-6 bg-black">
                <h3 className="text-4xl font-bold text-blue-500">{number}</h3>
                <p className="text-gray-400 mt-3">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="portfolio" className="py-24 px-6 bg-black scroll-mt-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-blue-500 uppercase font-semibold mb-4">Portfolio</p>
                <h2 className="text-4xl md:text-5xl font-bold">Work directions we can ship for clients.</h2>
              </div>
              <a href={scheduleHref} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-6 py-4 font-semibold">Schedule a Call</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {portfolio.map((item) => (
                <a key={item.title} href={scheduleHref} className="group overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl hover:border-blue-500/60 transition">
                  <div className="aspect-video overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <p className="text-blue-300 text-sm mb-2">{item.type}</p>
                    <h3 className="font-bold text-2xl">{item.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 px-6 bg-zinc-950 scroll-mt-24">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-blue-500 uppercase font-semibold mb-4">Contact</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to build your next digital product?</h2>
            <p className="text-gray-400 text-lg mb-10">Book a discovery call and we will map the project scope, timeline, platform needs, and next steps before you commit to a build.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={scheduleHref} className="bg-blue-500 hover:bg-blue-600 rounded-2xl px-8 py-4 font-semibold">Schedule a Free Call</a>
              <a href="/login" className="border border-white/10 hover:border-blue-500 rounded-2xl px-8 py-4 font-semibold">Client Login</a>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-black border border-white/10 rounded-2xl p-5">
                <p className="text-gray-500 text-sm">Discovery Call</p>
                <a href={scheduleHref} className="text-blue-300">Choose a Google Meet or Zoom slot</a>
              </div>
              <div className="bg-black border border-white/10 rounded-2xl p-5">
                <p className="text-gray-500 text-sm">Client Dashboard</p>
                <a href="/login" className="text-blue-300">Access active projects and updates</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
