import { API_BASE_URL } from "../api";

export interface AdminLegalUserRecord {
  ID: number;
  UserID: number;
  CompanyName: string;
  OfficialRegisterNumber: string;
  Address: string;
  Website: string;
  CompanyPhoneNumber: string;
  AgentName1: string;
  AgentPhoneNumber1: string;
  AgentName2: string;
  AgentPhoneNumber2: string;
  Active: boolean;
}

const normalizeLegalUsers = (usersArray: any[]): AdminLegalUserRecord[] =>
  usersArray.map((user: any) => ({
    ID: user.ID || user.id || 0,
    UserID: user.UserID || user.userID || user.userId || 0,
    CompanyName: user.CompanyName || user.companyName || "",
    OfficialRegisterNumber:
      user.OfficialRegisterNumber ||
      user.officialRegisterNumber ||
      user.registerNumber ||
      "",
    Address: user.Address || user.address || "",
    Website: user.Website || user.website || "",
    CompanyPhoneNumber:
      user.CompanyPhoneNumber ||
      user.companyPhoneNumber ||
      user.companyPhone ||
      "",
    AgentName1: user.AgentName1 || user.agentName1 || "",
    AgentPhoneNumber1:
      user.AgentPhoneNumber1 || user.agentPhoneNumber1 || user.agentPhone1 || "",
    AgentName2: user.AgentName2 || user.agentName2 || "",
    AgentPhoneNumber2:
      user.AgentPhoneNumber2 || user.agentPhoneNumber2 || user.agentPhone2 || "",
    Active: user.Active ?? user.active ?? true,
  }));

export const fetchAdminLegalUsers = async (
  token: string,
): Promise<AdminLegalUserRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/legal-users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  let usersArray: any[] = [];

  if (Array.isArray(data)) {
    usersArray = data;
  } else if (data.data && Array.isArray(data.data)) {
    usersArray = data.data;
  } else if (data.legalUsers && Array.isArray(data.legalUsers)) {
    usersArray = data.legalUsers;
  }

  return normalizeLegalUsers(usersArray);
};

export const createAdminLegalUser = async (
  token: string,
  userData: {
    UserID: number;
    CompanyName: string;
    OfficialRegisterNumber: string;
    Address?: string;
    Website?: string;
    CompanyPhoneNumber?: string;
    AgentName1?: string;
    AgentPhoneNumber1?: string;
    AgentName2?: string;
    AgentPhoneNumber2?: string;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/legal-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userData.UserID,
      companyName: userData.CompanyName,
      officialRegisterNumber: userData.OfficialRegisterNumber,
      address: userData.Address || "",
      website: userData.Website || "",
      companyPhoneNumber: userData.CompanyPhoneNumber || "",
      agentName1: userData.AgentName1 || "",
      agentPhoneNumber1: userData.AgentPhoneNumber1 || "",
      agentName2: userData.AgentName2 || "",
      agentPhoneNumber2: userData.AgentPhoneNumber2 || "",
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const updateAdminLegalUser = async (
  token: string,
  id: number,
  userData: {
    UserID: number;
    CompanyName: string;
    OfficialRegisterNumber: string;
    Address?: string;
    Website?: string;
    CompanyPhoneNumber?: string;
    AgentName1?: string;
    AgentPhoneNumber1?: string;
    AgentName2?: string;
    AgentPhoneNumber2?: string;
    Active?: boolean;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/legal-user/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userData.UserID,
      companyName: userData.CompanyName,
      officialRegisterNumber: userData.OfficialRegisterNumber,
      address: userData.Address || "",
      website: userData.Website || "",
      companyPhoneNumber: userData.CompanyPhoneNumber || "",
      agentName1: userData.AgentName1 || "",
      agentPhoneNumber1: userData.AgentPhoneNumber1 || "",
      agentName2: userData.AgentName2 || "",
      agentPhoneNumber2: userData.AgentPhoneNumber2 || "",
      active: userData.Active,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const deleteAdminLegalUser = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/legal-user/${id}`, {
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
