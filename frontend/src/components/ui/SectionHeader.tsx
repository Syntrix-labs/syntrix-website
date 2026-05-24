export default function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-10">
      <p className="text-blue-500 uppercase tracking-[0.3em] text-sm mb-4">{eyebrow}</p>
      <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
      <p className="text-gray-400 mt-4 max-w-3xl">{description}</p>
    </div>
  );
}
