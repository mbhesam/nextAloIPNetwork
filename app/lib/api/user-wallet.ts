import { API_BASE_URL } from "../api";

export interface UserWalletPayment {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef: string;
  CreatedAt: string;
}

export const fetchUserBudgetInfo = async (token: string, userId: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/users-information/budget-info`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: userId }),
  });

  if (!response.ok) return null;

  return response.json();
};

export const fetchUserPayments = async (token: string): Promise<UserWalletPayment[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/payments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const createUserPayment = async (
  token: string,
  userId: number,
  amount: number,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/payments/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      amount,
    }),
  });

  if (!response.ok) return null;

  return response.json();
};
