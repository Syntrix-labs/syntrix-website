type CardProps = {
  title: string;
  value: string;
};

export default function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-3xl border border-emerald-200/12 bg-emerald-950/25 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/40">
      <h2 className="mb-4 text-lg font-light tracking-wide text-emerald-50/70">{title}</h2>
      <p
        className="text-5xl font-extralight text-white"
        style={{ textShadow: "0 0 26px rgba(120,210,160,0.4)" }}
      >
        {value}
      </p>
    </div>
  );
}
