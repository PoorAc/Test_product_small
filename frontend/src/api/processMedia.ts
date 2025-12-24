import keycloak from "../auth/keycloak";

export type ProcessedItem = {
  file_id: string;
  filename: string;
  workflow_id: string;
  status: string;
};

export type ProcessMediaResponse = {
  count: number;
  items: ProcessedItem[];
};

export async function processMedia(
  files: File[]
): Promise<ProcessMediaResponse> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file); // PLURAL – matches backend
  });

  const res = await fetch("http://localhost:8000/process-media", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to start media processing");
  }

  return res.json();
}
