import { API_BASE_URL } from "../api";

export type UserRole = "admin" | "specialist" | "customer";

export interface AdminUserRecord {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  budget: number;
  melliCode?: string;
  city?: string;
  state?: string;
  type?: string;
  authorized?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchStates = async (token: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/states`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchCities = async (token: string, state: string): Promise<string[]> => {
  if (!state) return [];

  const response = await fetch(
    `${API_BASE_URL}/v1/cities?state=${encodeURIComponent(state)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAdminUsers = async (token: string): Promise<AdminUserRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.users || [];
};

export const createAdminUser = async (
  token: string,
  userData: {
    name: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
    role: UserRole;
    budget: number;
    melliCode: string;
    city: string;
    state: string;
    type: string;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const responseText = await response.text();

  return {
    ok: response.status === 201 || response.ok,
    status: response.status,
    responseText,
  };
};

export const updateAdminUser = async (
  token: string,
  id: number,
  userData: {
    name: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    role: UserRole;
    budget: number;
    melliCode: string;
    city: string;
    state: string;
    type: string;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/user/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const responseText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    responseText,
  };
};

export const deleteAdminUser = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/user/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseText = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    responseText,
  };
};
