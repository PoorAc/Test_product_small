import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const LandingPage = () => {
  const { keycloak, authenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate("/upload", { replace: true });
    }
  }, [authenticated, navigate]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-32 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Audio & Video Transcription
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
          Upload audio or video files and get accurate, fast, AI-powered
          transcripts — securely authenticated.
        </p>

        {!authenticated ? (
          <button
            onClick={() => keycloak.login()}
            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg hover:scale-105"
          >
            Get Started
          </button>
        ) : (
          <button
            onClick={() => navigate("/upload")}
            className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg hover:scale-105"
          >
            Go to App
          </button>
        )}
      </div>

      {/* Feature cards */}
      <div className="max-w-6xl mx-auto px-6 pb-32 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Secure by Design",
            desc: "Authenticated with enterprise-grade identity management.",
          },
          {
            title: "Fast Processing",
            desc: "Optimized backend pipeline for quick turnaround.",
          },
          {
            title: "History Tracking",
            desc: "View and manage previous transcriptions.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur hover:bg-white/10 transition cursor-pointer"
          >
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-300 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
