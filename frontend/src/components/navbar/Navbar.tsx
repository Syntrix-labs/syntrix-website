export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 md:px-10">
      <a href="/" className="text-2xl font-bold">SYNTRIX</a>
      <div className="hidden md:flex gap-8 text-gray-300">
        <a href="/" className="hover:text-white">Home</a>
        <a href="/services" className="hover:text-white">Services</a>
        <a href="/about" className="hover:text-white">About</a>
        <a href="/#portfolio" className="hover:text-white">Portfolio</a>
        <a href="/contact" className="hover:text-white">Contact</a>
      </div>
      <a href="/schedule" className="bg-blue-500 px-5 py-2 rounded-xl hover:bg-blue-600 transition">Schedule</a>
    </nav>
  );
}
