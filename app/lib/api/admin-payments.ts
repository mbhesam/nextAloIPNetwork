import { API_BASE_URL } from "../api";

export interface AdminPaymentRecord {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

export const fetchAdminPayments = async (
  token: string,
): Promise<AdminPaymentRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.payments || [];
};

export const deleteAdminPayment = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/payments/${id}`, {
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
