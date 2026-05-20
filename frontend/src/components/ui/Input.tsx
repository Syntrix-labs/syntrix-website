type InputProps = {
  type?: string;
  placeholder?: string;
};

export default function Input({
  type = "text",
  placeholder,
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-zinc-900 border border-white/10 focus:border-blue-500 outline-none rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 transition-all duration-300"
    />
  );
}