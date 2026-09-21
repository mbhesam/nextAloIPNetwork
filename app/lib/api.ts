const resolveApiBaseUrl = (): string => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!configuredUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL=http://apialoipnetwork.hesamhelperdomain.ir",
    );
  }

  return configuredUrl.replace(/\/+$/, "");
};

export const API_BASE_URL = resolveApiBaseUrl();

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

