export default function Navbar() {
  return (
    <nav className="w-full h-20 bg-black/60 shadow-lg shadow-black/20 border-b border-gray-800 flex items-center justify-between px-10">
      
      <div className="text-2xl font-bold">
        SYNTRIX
      </div>

      <div className="flex gap-8">
        <a href="#">Home</a>
        <a href="#">Services</a>
        <a href="#">Portfolio</a>
        <a href="#">Contact</a>
      </div>

      <button className="bg-blue-500 px-5 py-2 rounded-xl">
        Book Call
      </button>

    </nav>
  );
}