export default function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: string;
}) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
            <i className={`ti ti-${icon}`} aria-hidden />
          </span>
        )}
        <p className="font-mono text-xs uppercase tracking-[0.4em]" style={{ color: "#a9ba9d" }}>{eyebrow}</p>
      </div>
      <h1 className="text-4xl font-light tracking-wide md:text-5xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>{title}</h1>
      <p className="mt-4 max-w-3xl font-light leading-relaxed text-emerald-50/65">{description}</p>
    </div>
  );
}
