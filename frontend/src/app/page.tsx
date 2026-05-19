"use client";

import Navbar from "@/components/navbar/Navbar";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white pt-5">
        <motion.section
        initial={{ opacity: 0, y: 40 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 1 }} 
        className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">

  {/* Background Glow */}
  <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full top-20"></div>

  <p className="text-blue-500 font-semibold tracking-[0.3em] uppercase mb-6 z-10">
    Syntrix Labs
  </p>

  <h1 className="text-6xl md:text-8xl font-bold leading-tight max-w-6xl z-10">
    Building Premium
    <span className="text-blue-500"> Web & App </span>
    Experiences
  </h1>

  <p className="text-gray-400 text-lg md:text-xl mt-8 max-w-3xl leading-relaxed z-10">
    We create scalable digital products, business platforms,
    custom websites, mobile applications, and modern software
    solutions tailored for ambitious businesses worldwide.
  </p>

  <div className="flex gap-5 mt-12 z-10">
    <button className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 px-8 py-4 rounded-2xl text-lg font-medium shadow-lg shadow-blue-500/30">
      Start Project
    </button>

    <button className="border border-gray-700 hover:border-gray-500 transition-all duration-300 px-8 py-4 rounded-2xl text-lg font-medium">
      Explore Services
    </button>
  </div>

</motion.section>

<section className="py-32 px-8 bg-black">

  <div className="max-w-7xl mx-auto">

    <div className="text-center mb-20">
      <p className="text-blue-500 uppercase tracking-[0.3em] font-semibold mb-4">
        Services
      </p>

      <h2 className="text-5xl font-bold">
        What We Build
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 transition-all duration-300">
        <h3 className="text-2xl font-bold mb-4">
          Business Websites
        </h3>

        <p className="text-gray-400 leading-relaxed">
          Premium company websites designed for modern brands,
          startups, agencies, and businesses worldwide.
        </p>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 transition-all duration-300">
        <h3 className="text-2xl font-bold mb-4">
          Web Applications
        </h3>

        <p className="text-gray-400 leading-relaxed">
          Custom dashboards, admin panels, portals, SaaS platforms,
          and scalable business systems.
        </p>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 transition-all duration-300">
        <h3 className="text-2xl font-bold mb-4">
          Mobile Apps
        </h3>

        <p className="text-gray-400 leading-relaxed">
          Android and iOS applications with premium UI,
          smooth performance, and scalable backend systems.
        </p>
      </div>

    </div>

  </div>

</section>

<section className="py-28 px-8 bg-zinc-950 border-t border-white/5 border-b border-white/5">

  <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        10+
      </h3>

      <p className="text-gray-400 mt-3">
        Modern Technologies
      </p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        24/7
      </h3>

      <p className="text-gray-400 mt-3">
        Client Support
      </p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        100%
      </h3>

      <p className="text-gray-400 mt-3">
        Custom Solutions
      </p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        Global
      </h3>

      <p className="text-gray-400 mt-3">
        Service Availability
      </p>
    </div>

  </div>

</section>
      </main>
    </>
  );
}