import { API_BASE_URL } from "../api";

export type SupportRequestStatus =
  | "created"
  | "inProgress"
  | "waitingApproval"
  | "done"
  | "resolved"
  | "cancelled";

export interface SupportRequestListItem {
  ID: number;
  plan: string;
  Category?: { name: string };
  categoryID?: number;
  Status: string;
  retries?: number;
  headTechRequired?: boolean;
  AssignedSpecialist?: { User?: { name: string } };
  CreatedAt: string;
  description?: string;
  CustomerID: number;
}

export const fetchUserSupportRequests = async (
  token: string,
  customerId: number,
): Promise<SupportRequestListItem[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/support-requests/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_id: customerId,
    }),
  });

  if (!response.ok) return [];

  const data = await response.json();
  const requestsArray = Array.isArray(data) ? data : data.data || data.requests || [];

  return [...requestsArray].sort((a, b) => Number(b.ID ?? b.id) - Number(a.ID ?? a.id));
};

export const finishSupportRequest = async (
  token: string,
  requestId: number,
  endApproved: boolean,
  rejectionReason?: string,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-requests/${requestId}/finish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      endApproved
        ? { endApproved: true }
        : {
            endApproved: false,
            endRejectionReason: rejectionReason?.trim(),
          },
    ),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const cancelSupportRequest = async (token: string, requestId: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request/${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "cancelled",
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};
