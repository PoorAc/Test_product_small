import keycloak from "../auth/keycloak";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = keycloak.token;

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
