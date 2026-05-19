export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-black/40">
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">

        {/* Logo */}
        <div className="text-2xl font-bold tracking-wide">
          SYNTRIX
        </div>

        {/* Center Menu */}
        <div className="flex items-center space-x-8 text-gray-300 text-sm font-medium">
          <a href="#" className="hover:text-white transition duration-300">
            Home
          </a>

          <a href="#" className="hover:text-white transition duration-300">
            Services
          </a>

          <a href="#" className="hover:text-white transition duration-300">
            Portfolio
          </a>

          <a href="#" className="hover:text-white transition duration-300">
            Contact
          </a>
        </div>

        {/* Button */}
        <button className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-xl transition">
          Let’s Talk
        </button>

      </div>
    </nav>
  );
}