export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-6 md:px-10">
      <a
        href="/"
        aria-label="Syntrix Labs home"
        className="text-sm font-light tracking-[0.32em] text-white transition hover:opacity-80"
        style={{ textShadow: "0 0 18px rgba(120,210,160,0.5)" }}
      >
        SYNTRIX<span style={{ color: "#a9ba9d" }}>&nbsp;LABS</span>
      </a>
      <div className="hidden gap-8 text-sm tracking-wide text-emerald-50/80 md:flex">
        <a href="/" className="transition hover:text-white">Home</a>
        <a href="/#services" className="transition hover:text-white">Services</a>
        <a href="/about" className="transition hover:text-white">About</a>
        <a href="/#work" className="transition hover:text-white">Portfolio</a>
        <a href="/contact" className="transition hover:text-white">Contact</a>
      </div>
      <a
        href="/schedule"
        className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-5 py-2 text-sm tracking-wide text-emerald-50 backdrop-blur-sm transition hover:bg-emerald-500/40"
      >
        Schedule
      </a>
    </nav>
  );
}
