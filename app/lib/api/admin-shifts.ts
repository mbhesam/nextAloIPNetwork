import { API_BASE_URL } from "../api";

export interface AdminShiftRecord {
  ID: number;
  ShiftDate?: string;
  ShiftTime?: string;
  Specialists?: any[];
  id?: number;
  shiftDate?: string;
  shiftTime?: string;
  specialists?: any[];
}

export const fetchAdminShifts = async (
  token: string,
  options?: { limit?: number; offset?: number },
): Promise<AdminShiftRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/shifts/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.shifts || [];
};

export const createAdminShift = async (
  token: string,
  shiftData: {
    shiftDate: string;
    shiftTime: string;
    specialistIds: number[];
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/shift`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shiftData),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const updateAdminShift = async (
  token: string,
  id: number,
  shiftData: {
    shiftDate: string;
    shiftTime: string;
    specialistIds: number[];
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/shift/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shiftData),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const deleteAdminShift = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/shift/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};
