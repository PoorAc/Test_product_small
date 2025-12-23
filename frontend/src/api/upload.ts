import keycloak from "../auth/keycloak";

export type UploadResponse = {
  filename: string;
  transcript: string;
};

export async function uploadFiles(
  files: File[]
): Promise<UploadResponse[]> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch("http://localhost:8000/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return res.json();
}
