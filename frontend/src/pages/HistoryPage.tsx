import { useEffect, useState } from "react";

import {
  fetchHistory,
  fetchMediaDetails,
  deleteMedia,
  downloadTranscript,
} from "../api/history";

import type {
  MediaHistoryItem,
  MediaDetails,
} from "../api/history";

/* -----------------------------
   Status color helper
----------------------------- */
const statusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "text-green-400";
    case "FAILED":
      return "text-red-400";
    default:
      return "text-yellow-400";
  }
};

export const HistoryPage = () => {
  const [items, setItems] = useState<MediaHistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------
     Load history list
  ----------------------------- */
  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  /* -----------------------------
     Expand / collapse item
  ----------------------------- */
  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetails(null);
      return;
    }

    setExpandedId(id);
    setLoadingDetails(true);
    setError(null);

    try {
      const data = await fetchMediaDetails(id);
      setDetails(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  /* -----------------------------
     Delete media
  ----------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await deleteMedia(id);

      setItems((prev) => prev.filter((item) => item.id !== id));

      if (expandedId === id) {
        setExpandedId(null);
        setDetails(null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* -----------------------------
     Download transcript
  ----------------------------- */
  const handleDownload = async (id: string) => {
    try {
      await downloadTranscript(id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">History</h1>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-slate-400">
          No history items yet.
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="border border-slate-800 rounded-xl p-4"
        >
          {/* -----------------------------
              Row
          ----------------------------- */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">
                {item.filename}
              </div>
              <div
                className={`text-sm ${statusColor(item.status)}`}
              >
                {item.status}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleExpand(item.id)}
                className="text-sm text-indigo-400 hover:underline"
              >
                {expandedId === item.id ? "Hide" : "View"}
              </button>

              <button
                onClick={() => handleDownload(item.id)}
                disabled={item.status !== "COMPLETED"}
                className={`text-sm ${
                  item.status === "COMPLETED"
                    ? "text-green-400 hover:underline"
                    : "text-slate-500 cursor-not-allowed"
                }`}
              >
                Download
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>

          {/* -----------------------------
              Expanded view
          ----------------------------- */}
          {expandedId === item.id && (
            <div className="mt-4 bg-slate-900 rounded-lg p-4 space-y-4">
              {loadingDetails && (
                <div className="text-slate-400 text-sm">
                  Loading details…
                </div>
              )}

              {details && (
                <>
                  <div className="text-sm text-slate-400">
                    Uploaded:{" "}
                    {new Date(
                      details.created_at
                    ).toLocaleString()}
                  </div>

                  {/* Summary */}
                  {details.summary && (
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">
                        Summary
                      </h4>
                      <p className="text-slate-300 text-sm">
                        {details.summary}
                      </p>
                    </div>
                  )}

                  {/* Transcript */}
                  {details.transcript ? (
                    <div>
                      <h4 className="font-semibold text-slate-200 mb-1">
                        Transcript
                      </h4>
                      <pre className="whitespace-pre-wrap text-slate-200 text-sm">
                        {details.transcript}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      Transcript not available yet.
                    </div>
                  )}

                  {/* Token usage */}
                  <div className="text-xs text-slate-500 pt-2">
                    Tokens used: {details.tokens}
                  </div>

                  {/* Status hints */}
                  {details.status === "PROCESSING" && (
                    <div className="text-yellow-400 text-sm">
                      Processing in progress…
                    </div>
                  )}

                  {details.status === "FAILED" && (
                    <div className="text-red-400 text-sm">
                      Transcript generation failed.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
