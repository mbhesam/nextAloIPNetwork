import { API_BASE_URL } from "../api";

export interface AdminSupportRequestRecord {
  ID: number;
  CustomerID: number;
  Customer?: {
    ID: number;
    name: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  plan: string;
  CategoryID: number;
  Category?: {
    ID: number;
    name: string;
    subCategory: string[];
  };
  AssignedSpecialistID: number | null;
  AssignedSpecialist?: {
    ID: number;
    UserID: number;
    user?: {
      ID: number;
      name: string;
      lastName: string;
    };
  };
  Status: string;
  retries?: number;
  headTechRequired?: boolean;
  description: string;
  CreatedAt: string;
}

export const fetchAdminSupportRequests = async (
  token: string,
  options?: { limit?: number; offset?: number },
): Promise<AdminSupportRequestRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/support-requests/search`, {
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
  const requestsArray = Array.isArray(data)
    ? data
    : data.data || data.requests || [];

  return [...requestsArray].sort(
    (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
  );
};

export const assignAdminSpecialistToRequest = async (
  token: string,
  requestId: number,
  specialistId: number,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request/${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assignedSpecialistId: specialistId,
      status: "inProgress",
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const deleteAdminSupportRequest = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request/${id}`, {
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
