import { API_BASE_URL } from "../api";

export interface CostSettingRecord {
  ID: number;
  Plan: string;
  CostPerHour: number | null;
  FixedPrice: number | null;
}

export const fetchCostSettings = async (token: string): Promise<CostSettingRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/cost-settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const createCostSetting = async (
  token: string,
  payload: {
    Plan: string;
    CostPerHour: number | null;
    FixedPrice: number | null;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/cost-settings`, {
    method: "POST",
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
    responseText,
  };
};

export const updateCostSetting = async (
  token: string,
  id: number,
  payload: {
    Plan: string;
    CostPerHour: number | null;
    FixedPrice: number | null;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/cost-settings/${id}`, {
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
    responseText,
  };
};

export const deleteCostSetting = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/cost-settings/${id}`, {
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
