import Navbar from "@/components/navbar/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white pt-28">
        <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <p className="text-blue-500 font-medium mb-4">
            SYNTRIX LABS
          </p>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-5xl">
            Modern Web & App Solutions
            for Businesses Worldwide
          </h1>

          <p className="text-gray-400 text-lg mt-6 max-w-2xl">
            Building scalable websites, web applications, dashboards,
            and digital platforms tailored for modern businesses
            and organizations.
          </p>

          <div className="flex gap-4 mt-10">
            <button className="bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-xl font-medium">
              Get Started
            </button>

            <button className="border border-gray-700 hover:border-gray-500 transition px-6 py-3 rounded-xl font-medium">
              View Services
            </button>
          </div>
        </section>
      </main>
    </>
  );
}