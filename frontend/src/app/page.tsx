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
  <motion.div
  animate={{
    y: [0, -20, 0],
  }}
  transition={{
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut",
  }}
  className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full top-20"
/>

  <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-blue-500 font-semibold tracking-[0.3em] uppercase mb-6 z-10">
    Syntrix Labs
  </motion.p>

  <motion.h1
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 1 }} className="text-5xl sm:text-6xl md:text-8xl font-bold leading-tight max-w-6xl z-10">
    Building Premium
    <span className="text-blue-500"> Web & App </span>
    Experiences
  </motion.h1>

  <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 text-lg md:text-xl mt-8 max-w-3xl leading-relaxed z-10">
    We create scalable digital products, business platforms,
    custom websites, mobile applications, and modern software
    solutions tailored for ambitious businesses worldwide.
  </motion.p>

  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.8, duration: 1 }}
  className="flex flex-col sm:flex-row gap-5 mt-12 z-10"
>
    <button className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl text-lg font-medium shadow-lg shadow-blue-500/30">
      View Our Work
    </button>

    <button className="border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-105 px-8 py-4 rounded-2xl text-lg font-medium">
      Learn More
    </button>
  </motion.div>

</motion.section>

<section className="py-32 px-8 bg-black">

  <div className="max-w-7xl mx-auto">

    <div className="text-center mb-20">
      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-blue-500 uppercase tracking-[0.3em] font-semibold mb-4">
        Services
      </motion.p>

      <h2 className="text-5xl font-bold">
        What We Build
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
        <h3 className="text-2xl font-bold mb-4">
          Business Websites
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed">
          Premium company websites designed for modern brands,
          startups, agencies, and businesses worldwide.
        </motion.p>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
        <h3 className="text-2xl font-bold mb-4">
          Web Applications
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed">
          Custom dashboards, admin panels, portals, SaaS platforms,
          and scalable business systems.
        </motion.p>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
        <h3 className="text-2xl font-bold mb-4">
          Mobile Apps
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed">
          Android and iOS applications with premium UI,
          smooth performance, and scalable backend systems.
        </motion.p>
      </div>

    </div>

  </div>

  {/*stats section*/}

</section>

<section className="py-28 px-8 bg-zinc-950 border-t border-white/5 border-b border-white/5">

  <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        10+
      </h3>

      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 mt-3">
        Modern Technologies
      </motion.p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        24/7
      </h3>

      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 mt-3">
        Client Support
      </motion.p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        100%
      </h3>

      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 mt-3">
        Custom Solutions
      </motion.p>
    </div>

    <div>
      <h3 className="text-5xl font-bold text-blue-500">
        Global
      </h3>

      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 mt-3">
        Service Availability
      </motion.p>
    </div>

  </div>

</section>

{/*project section*/}

<section className="py-32 px-8 bg-black">

  <div className="max-w-7xl mx-auto">

    <div className="text-center mb-20">
      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-blue-500 uppercase tracking-[0.3em] font-semibold mb-4">
        Portfolio
      </motion.p>

      <h2 className="text-5xl font-bold">
        Featured Projects
      </h2>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">

        <div className="h-72 bg-gradient-to-br from-blue-500/20 to-black flex items-center justify-center text-4xl font-bold text-blue-500">
          SaaS Dashboard
        </div>

        <div className="p-8">
          <h3 className="text-3xl font-bold mb-4">
            Business Management Platform
          </h3>

          <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed">
            A scalable dashboard system designed for business analytics,
            management operations, reports, and team collaboration.
          </motion.p>
        </div>

      </div>

      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">

        <div className="h-72 bg-gradient-to-br from-cyan-500/20 to-black flex items-center justify-center text-4xl font-bold text-cyan-400">
          Mobile App
        </div>

        <div className="p-8">
          <h3 className="text-3xl font-bold mb-4">
            Modern Service Application
          </h3>

          <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed">
            Premium mobile application experience with clean UI,
            authentication systems, payment integration, and modern UX.
          </motion.p>
        </div>

      </div>

    </div>

  </div>
 

</section>

{/*why choose us section*/}

<section className="py-32 px-8 bg-zinc-950">

  <div className="max-w-7xl mx-auto">

    <div className="text-center mb-20">
      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-blue-500 uppercase tracking-[0.3em] font-semibold mb-4">
        Why Choose Us
      </motion.p>

      <h2 className="text-5xl font-bold">
        Built For Modern Businesses
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

      <div className="bg-black border border-white/10 rounded-3xl p-10">
        <h3 className="text-3xl font-bold mb-5">
          Premium Design Experience
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed text-lg">
          We focus on building visually modern, smooth,
          responsive, and user-friendly digital experiences
          that help businesses stand out online.
        </motion.p>
      </div>

      <div className="bg-black border border-white/10 rounded-3xl p-10">
        <h3 className="text-3xl font-bold mb-5">
          Fully Custom Development
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed text-lg">
          Every project is tailored according to client needs,
          business goals, workflows, and future scalability.
        </motion.p>
      </div>

      <div className="bg-black border border-white/10 rounded-3xl p-10">
        <h3 className="text-3xl font-bold mb-5">
          Modern Technology Stack
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed text-lg">
          Using modern frameworks and scalable architectures,
          we create high-performance digital products built
          for long-term growth.
        </motion.p>
      </div>

      <div className="bg-black border border-white/10 rounded-3xl p-10">
        <h3 className="text-3xl font-bold mb-5">
          Business Focused Solutions
        </h3>

        <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 leading-relaxed text-lg">
          We don't just build software -
          we build solutions that improve business efficiency,
          branding, and customer experience.
        </motion.p>
      </div>

    </div>

  </div>

</section>

{/*lets work together*/}

<section className="py-40 px-8 bg-black relative overflow-hidden">

  {/* Glow Effect */}
  <div className="absolute w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full top-0 left-1/2 -translate-x-1/2"></div>

  <div className="max-w-5xl mx-auto text-center relative z-10">

    <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-blue-500 uppercase tracking-[0.3em] font-semibold mb-6">
      Let's Build Together
    </motion.p>

    <h2 className="text-6xl md:text-7xl font-bold leading-tight">
      Ready To Build Your
      <span className="text-blue-500"> Next Digital Product?</span>
    </h2>

    <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-400 text-xl leading-relaxed mt-8 max-w-3xl mx-auto">
      From modern websites to scalable business platforms,
      Syntrix helps businesses transform ideas into premium
      digital experiences with modern technology and clean execution.
    </motion.p>

    <div className="flex flex-col md:flex-row gap-6 justify-center mt-14">

      <button className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 hover:scale-105 px-10 py-5 rounded-2xl text-lg font-semibold shadow-2xl shadow-blue-500/40">
        Start Your Project
      </button>

      <button className="border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-105 px-10 py-5 rounded-2xl text-lg font-semibold">
        Schedule Consultation
      </button>

    </div>

  </div>

</section>

<footer className="border-t border-white/10 bg-zinc-950 py-12 px-8">

  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

    <div>
      <h3 className="text-2xl font-bold">
        SYNTRIX
      </h3>

      <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-500 mt-2">
        Modern Web & App Solutions
      </motion.p>
    </div>

    <div className="flex gap-8 text-gray-400">
      <a href="#" className="hover:text-white transition-all duration-300 hover:-translate-y-1">
        Home
      </a>

      <a href="#" className="hover:text-white transition-all duration-300 hover:-translate-y-1">
        Services
      </a>

      <a href="#" className="hover:text-white transition-all duration-300 hover:-translate-y-1">
        Portfolio
      </a>

      <a href="#" className="hover:text-white transition-all duration-300 hover:-translate-y-1">
        Contact
      </a>
    </div>

    <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 1 }}
  className="text-gray-500 text-sm">
      Copyright 2026 Syntrix Labs. All rights reserved.
    </motion.p>

  </div>

</footer>

      </main>
    </>
  );
}
