export default function Topbar() {
  return (
    <div className="mb-10">

      <button
        onClick={() => window.history.back()}
        className="border border-white/10 hover:border-blue-500 transition px-5 py-3 rounded-2xl"
      >
        ← Back
      </button>

    </div>
  );
}