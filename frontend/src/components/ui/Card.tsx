type CardProps = {
  title: string;
  value: string;
};

export default function Card({
  title,
  value,
}: CardProps) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-300">

      <h2 className="text-2xl font-bold mb-4">
        {title}
      </h2>

      <p className="text-5xl font-bold text-blue-500">
        {value}
      </p>

    </div>
  );
}