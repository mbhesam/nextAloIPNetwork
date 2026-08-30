import { API_BASE_URL } from "../api";

export interface SpecialistCategory {
  ID: number;
  id?: number;
  name: string;
  subCategory: string[];
}

export interface AdminSpecialistRecord {
  ID: number;
  UserID: number;
  Skills: string;
  Categories: SpecialistCategory[];
  specialistTeam?: string;
  SpecialistTeam?: string;
  team?: string;
  user?: {
    ID: number;
    name: string;
    lastName: string;
  };
}

export const fetchAdminSpecialists = async (
  token: string,
): Promise<AdminSpecialistRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return Array.isArray(data) ? data : data.data || data.specialists || [];
};

export const createAdminSpecialist = async (
  token: string,
  specialistData: {
    userId: number;
    skills: string;
    categoryIds: number[];
    specialistTeam: "aloOperation" | "platformSubmitted";
  },
) => {
  const formData = new FormData();
  formData.append("userId", String(specialistData.userId));
  formData.append("skills", specialistData.skills);

  specialistData.categoryIds.forEach((categoryId: number) => {
    formData.append("categoryIds", String(categoryId));
  });

  formData.append("specialistTeam", specialistData.specialistTeam);
  formData.append("skillAuthorized", "true");
  formData.append("active", "true");

  const response = await fetch(`${API_BASE_URL}/v1/specialist`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const updateAdminSpecialist = async (
  token: string,
  id: number,
  specialistData: any,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/specialist/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(specialistData),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const deleteAdminSpecialist = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/specialist/${id}`, {
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
