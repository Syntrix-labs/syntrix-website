type InputProps = {
  type?: string;
  placeholder?: string;
};

export default function Input({ type = "text", placeholder }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-emerald-200/15 bg-emerald-950/30 px-5 py-4 text-white outline-none transition-all duration-300 placeholder:text-emerald-50/30 focus:border-emerald-400/60 focus:bg-emerald-950/50"
    />
  );
}
