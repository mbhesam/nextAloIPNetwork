export const DEFAULT_BACKEND_BASE_URL =
  "http://apialoipnetwork.hesamhelperdomain.ir";

const normalizeBackendBaseUrl = (baseUrl: string) => {
  if (!baseUrl) return DEFAULT_BACKEND_BASE_URL;
  return baseUrl.replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeBackendBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_BACKEND_BASE_URL,
);

export const BACKEND_BASE_URL = API_BASE_URL;

export const buildBackendUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export const buildApiUrl = buildBackendUrl;

export const apiConfig = {
  baseUrl: API_BASE_URL,
  backendBaseUrl: BACKEND_BASE_URL,
  buildUrl: buildBackendUrl,
};

