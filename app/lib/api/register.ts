import { API_BASE_URL } from "../api";

export const fetchStateOptions = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/states`);

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const fetchCityOptions = async (stateName: string): Promise<string[]> => {
  if (!stateName) return [];

  const response = await fetch(
    `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(stateName)}`,
  );

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const createUserAccount = async (userPayload: Record<string, any>) => {
  const response = await fetch(`${API_BASE_URL}/v1/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userPayload),
  });

  const responseText = await response.text();
  let parsed: any = responseText;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    parsed = responseText;
  }

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText,
    data: parsed,
  };
};

export const createLegalUserRecord = async (legalPayload: Record<string, any>) => {
  const response = await fetch(`${API_BASE_URL}/v1/legal-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(legalPayload),
  });

  const responseText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText,
  };
};
