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
    <div className="flex justify-between items-center mb-10">
      <div>
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="border border-white/10 hover:border-blue-500 transition px-5 py-3 rounded-2xl"
          >
            Back
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
