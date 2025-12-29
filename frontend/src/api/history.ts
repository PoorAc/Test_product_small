import keycloak from "../auth/keycloak";

const BASE_URL = "http://localhost:8000";

/* -----------------------------
   History list (lightweight)
----------------------------- */
export type MediaHistoryItem = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
};

/* -----------------------------
   Media details (expanded view)
----------------------------- */
export type MediaDetails = {
  id: string;
  filename: string;
  status: string;
  transcript: string | null;
  summary: string | null;
  tokens: number;
  created_at: string;
};

/* -----------------------------
   API calls
----------------------------- */
export async function fetchHistory(): Promise<MediaHistoryItem[]> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${BASE_URL}/history`, {
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }

  return res.json();
}

export async function fetchMediaDetails(
  fileId: string
): Promise<MediaDetails> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${BASE_URL}/media/${fileId}/results`, {
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch media details");
  }

  return res.json();
}

export async function deleteMedia(fileId: string): Promise<void> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${BASE_URL}/media/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete media");
  }
}

export async function downloadTranscript(fileId: string): Promise<void> {
  if (!keycloak.token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(
    `${BASE_URL}/media/${fileId}/transcript/download`,
    {
      headers: {
        Authorization: `Bearer ${keycloak.token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to download transcript");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = ""; // filename comes from Content-Disposition
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
}