import { useState } from "react";
import { apiFetch } from "../api/client";

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");

  const upload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data.transcript);
  };

  return (
    <div className="flex flex-col gap-4">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button
        onClick={upload}
        className="px-4 py-2 rounded bg-indigo-600 text-white"
      >
        Upload
      </button>

      {result && <pre className="bg-gray-100 p-4 rounded">{result}</pre>}
    </div>
  );
};
