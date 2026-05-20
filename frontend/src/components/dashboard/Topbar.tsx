type TopbarProps = {
  showBack?: boolean;
  showLogout?: boolean;
};

export default function Topbar({
  showBack = true,
  showLogout = false,
}: TopbarProps) {
  return (
    <div className="flex justify-between items-center mb-10">

      {/* Back Button */}
      <div>
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="border border-white/10 hover:border-blue-500 transition px-5 py-3 rounded-2xl"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Logout Button */}
      <div>
        {showLogout && (
          <button
            onClick={() => window.location.href = "/"}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-6 py-3 rounded-2xl text-white font-medium transition-all duration-300"
          >
            Logout
          </button>
        )}
      </div>

    </div>
  );
}