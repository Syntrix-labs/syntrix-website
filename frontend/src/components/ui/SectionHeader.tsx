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
    <div className="mb-6 md:mb-10">
      <div className="mb-2.5 flex items-center gap-3 md:mb-4">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200 md:h-9 md:w-9">
            <i className={`ti ti-${icon}`} aria-hidden />
          </span>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] md:text-xs md:tracking-[0.4em]" style={{ color: "#a9ba9d" }}>{eyebrow}</p>
      </div>
      <h1 className="text-[28px] font-light leading-tight tracking-wide md:text-5xl" style={{ textShadow: "0 0 30px rgba(40,80,55,0.6)" }}>{title}</h1>
      <p className="mt-2 max-w-3xl text-sm font-light leading-relaxed text-emerald-50/65 md:mt-4 md:text-base">{description}</p>
    </div>
  );
}
