import { API_BASE_URL } from "../api";

export interface DashboardUser {
  ID: number;
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  budget?: number;
  melliCode?: string;
  city?: string;
  state?: string;
  type?: string;
  authorized?: boolean;
  profilePicture?: string;
}

export interface DashboardSpecialist {
  ID: number;
  userID?: number;
  user?: DashboardUser;
}

export interface DashboardPayment {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef?: string;
  CreatedAt: string;
  user?: DashboardUser;
}

export interface DashboardSupportRequest {
  ID: number;
  CustomerID: number;
  plan?: string;
  Status: string;
  description?: string;
  CreatedAt: string;
  Customer?: DashboardUser;
}

export interface DashboardShift {
  ID: number;
  shiftDate?: string;
  shiftTime?: string;
  specialists?: string[];
}

const extractArray = (data: any, fallbackKey?: string): any[] => {
  if (Array.isArray(data)) return data;

  if (fallbackKey && data && Array.isArray(data[fallbackKey])) {
    return data[fallbackKey];
  }

  const candidates = ["data", "users", "specialists", "payments", "requests", "shifts"];

  for (const key of candidates) {
    if (data && Array.isArray(data[key])) return data[key];
  }

  return [];
};

export const fetchDashboardUsers = async (token: string): Promise<DashboardUser[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  const users = extractArray(data, "users");

  if (data && typeof data === "object" && "totalCount" in data && data.totalCount) {
    return users;
  }

  return users;
};

export const fetchDashboardSpecialists = async (
  token: string,
): Promise<DashboardSpecialist[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return extractArray(data, "specialists");
};

export const fetchDashboardPayments = async (
  token: string,
): Promise<DashboardPayment[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/payments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return extractArray(data, "payments");
};

export const fetchDashboardSupportRequests = async (
  token: string,
): Promise<DashboardSupportRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/support-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return extractArray(data, "requests");
};

export const fetchDashboardShifts = async (token: string): Promise<DashboardShift[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/shifts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return extractArray(data, "shifts");
};
