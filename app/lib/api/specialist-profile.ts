import { API_BASE_URL } from "../api";

export interface SpecialistProfileCategory {
  id?: number;
  ID?: number;
  name: string;
  subCategory: string[];
}

export const fetchSpecialistStates = async (token: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/states`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.states || [];
};

export const fetchSpecialistCategories = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.categories || [];
};

export const fetchAllUsers = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/users?limit=100&offset=0`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.users || [];
};

export const fetchAllSpecialists = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/specialists?limit=100&offset=0`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.specialists || [];
};

export const updateSpecialistRecord = async (
  token: string,
  specialistId: number,
  specialistData: Record<string, any>,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/specialist/${specialistId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(specialistData),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const createSpecialistRecord = async (
  token: string,
  specialistData: Record<string, any>,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/specialist`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(specialistData),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};
