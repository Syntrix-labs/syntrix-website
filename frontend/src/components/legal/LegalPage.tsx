import type { ReactNode } from "react";
import Navbar from "@/components/navbar/Navbar";
import ImmersiveScene from "@/components/ImmersiveScene";

export const CONTACT_EMAIL = "syntrix.official.in@gmail.com";

/** Shared layout for Privacy Policy / Terms: readable prose on the brand background. */
export default function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <ImmersiveScene />
      <main className="relative z-10 text-white">
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-32">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>{eyebrow}</p>
          <h1 className="text-4xl font-light tracking-wide md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-emerald-50/50">Last updated: {updated}</p>
          <div className="mt-10 space-y-8 rounded-3xl border border-emerald-200/12 bg-emerald-950/30 p-7 font-light leading-relaxed text-emerald-50/80 backdrop-blur-sm md:p-10 [&_a]:text-emerald-300 [&_a:hover]:text-emerald-200 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-normal [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
            {children}
          </div>
        </article>
      </main>
    </>
  );
}
