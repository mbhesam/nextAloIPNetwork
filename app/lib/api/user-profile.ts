import { API_BASE_URL } from "../api";

export interface UserProfileRecord {
  ID?: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  state: string;
  melliCode?: string;
  role?: string;
  budget?: number;
  type?: string;
  profilePicture?: string;
}

export const fetchUserStates = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/states`);

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const fetchUserCities = async (stateName: string): Promise<string[]> => {
  if (!stateName) return [];

  const response = await fetch(
    `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(stateName)}`,
  );

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const fetchUserProfileById = async (token: string, userId: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return null;

  return response.json();
};

export const updateUserProfileById = async (
  token: string,
  userId: number,
  payload: Record<string, any>,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/user/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText,
  };
};

export const changePassword = async (
  token: string,
  oldPassword: string,
  newPassword: string,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      oldPassword,
      newPassword,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};
