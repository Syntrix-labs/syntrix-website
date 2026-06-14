import Button from "@/components/ui/Button";

type TopbarProps = {
  showBack?: boolean;
  showLogout?: boolean;
};

export default function Topbar({
  showBack = true,
  showLogout = false,
}: TopbarProps) {
  return (
    <div className="mb-10 flex items-center justify-between">
      <div>
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="rounded-full border border-emerald-200/20 px-5 py-3 text-sm tracking-wide text-emerald-50/80 transition hover:border-emerald-300/50 hover:text-white"
          >
            ← Back
          </button>
        )}
      </div>

      <div>
        {showLogout && (
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
          >
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
