import { useRef, useState } from "react";
import { processMedia } from "../api/processMedia";

const isValidMediaFile = (file: File) =>
  file.type.startsWith("audio/") || file.type.startsWith("video/");

export const FileUploader = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    {
      file_id: string;
      filename: string;
      workflow_id: string;
      status: string;
    }[]
  >([]);


  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const valid = Array.from(incoming).filter(isValidMediaFile);

    if (valid.length === 0) {
      setError("Only audio and video files are allowed.");
      return;
    }

    setError(null);
    setFiles((prev) => [...prev, ...valid]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const onUpload = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await processMedia(files);
      setResults(response.items);
      setFiles([]);
    } catch (err: any) {
      setError(err.message ?? "Failed to process media");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-indigo-500/40 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 transition"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*,video/*"
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />

        <p className="text-lg font-semibold mb-2">
          Drag & drop audio or video files
        </p>
        <p className="text-sm text-slate-400">
          or click to browse (multiple files supported)
        </p>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4">
          <h4 className="font-semibold mb-3">
            Selected files ({files.length})
          </h4>
          <ul className="text-sm text-slate-300 space-y-1">
            {files.map((file, i) => (
              <li key={i}>
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={onUpload}
        disabled={files.length === 0 || loading}
        className={`px-6 py-3 rounded-xl font-semibold transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white"
        }`}
      >
        {loading
          ? "Uploading…"
          : `Upload ${files.length || ""} file${
              files.length === 1 ? "" : "s"
            }`}
      </button>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-white">
            Processing started ({results.length} files)
          </h4>

          {results.map((r) => (
            <div
              key={r.file_id}
              className="border border-slate-700 rounded-lg p-3"
            >
              <div className="font-medium text-slate-200">
                {r.filename}
              </div>

              <div className="text-sm text-slate-400">
                Status:{" "}
                <span className="text-yellow-400">
                  {r.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 break-all">
                Workflow ID: {r.workflow_id}
              </div>
            </div>
          ))}

          <p className="text-sm text-slate-400 pt-2">
            Files are being processed in the background.
            You can view progress and results on the History page.
          </p>
        </div>
      )}
    </div>
  );
};
