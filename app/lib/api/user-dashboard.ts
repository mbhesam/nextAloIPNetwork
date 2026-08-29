import { API_BASE_URL } from "../api";

export type DashboardStatus =
  | "created"
  | "inProgress"
  | "resolved"
  | "cancelled";

export const extractBudget = (data: any): number | null => {
  if (data === null || data === undefined) return null;

  if (typeof data === "number" || typeof data === "string") {
    return Number(String(data).replace(/,/g, "").replace(/٬/g, "").replace(/٫/g, "."));
  }

  const keys = [
    "budget",
    "Budget",
    "walletBalance",
    "WalletBalance",
    "balance",
    "Balance",
    "amount",
    "Amount",
    "remainingBudget",
    "RemainingBudget",
    "userBudget",
    "UserBudget",
  ];

  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
      const value = Number(
        String(data[key]).replace(/,/g, "").replace(/٬/g, "").replace(/٫/g, "."),
      );

      if (!Number.isNaN(value)) return value;
    }
  }

  const nestedKeys = [
    "data",
    "Data",
    "user",
    "User",
    "result",
    "Result",
    "information",
    "Information",
  ];

  for (const key of nestedKeys) {
    if (data[key]) {
      const result = extractBudget(data[key]);
      if (result !== null) return result;
    }
  }

  return null;
};

export const fetchUserBudget = async (token: string, userId: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/users-information/budget-info`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: userId }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return extractBudget(data);
};

export const fetchSupportRequests = async (token: string, customerId: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-requests/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customer_id: customerId }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const requestsArray = Array.isArray(data) ? data : data.data || data.requests || [];

  return [...requestsArray].sort(
    (a, b) => Number(b.ID ?? b.id) - Number(a.ID ?? a.id),
  );
};

export const createSupportRequest = async (
  token: string,
  userId: number,
  payload: Record<string, any>,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: userId,
      ...payload,
    }),
  });

  const responseText = await response.text();

  return {
    ok: response.status === 201 || response.ok,
    response,
    responseText,
  };
};

export const fetchSupportRequestById = async (token: string, requestId: number | string) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request/${requestId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  return response.json();
};

export const fetchCostSettings = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/cost-settings?limit=100&offset=0`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error("Cost settings error:", response.status);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const fetchCategories = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/v1/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};
