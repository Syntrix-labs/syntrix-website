type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-emerald-200/20 bg-emerald-500/15 px-6 py-3 font-medium tracking-wide text-emerald-50 backdrop-blur-sm transition-all duration-300 hover:border-emerald-300/50 hover:bg-emerald-500/30 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
