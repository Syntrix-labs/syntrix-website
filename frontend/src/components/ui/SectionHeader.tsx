export default function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-10">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>{eyebrow}</p>
      <h1 className="text-4xl font-light tracking-wide md:text-5xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>{title}</h1>
      <p className="mt-4 max-w-3xl font-light leading-relaxed text-emerald-50/65">{description}</p>
    </div>
  );
}
