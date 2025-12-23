import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const TopNav = () => {
  const { keycloak } = useAuth();
  const location = useLocation();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg transition ${
      location.pathname === path
        ? "bg-white/20"
        : "hover:bg-white/10"
    }`;

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
      <div className="font-semibold text-lg tracking-wide">
        Transcription App
      </div>

      <div className="flex items-center gap-4">
        <Link to="/upload" className={linkClass("/upload")}>
          Upload
        </Link>

        <Link to="/history" className={linkClass("/history")}>
          History
        </Link>

        <button
          onClick={() =>
            keycloak.logout({
              redirectUri: window.location.origin,
            })
          }
          className="ml-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
