import { API_BASE_URL } from "../api";

export interface CategoryRecord {
  id: number;
  name: string;
  subCategory: string[];
}

const normalizeCategories = (data: any): CategoryRecord[] => {
  const categoriesArray = Array.isArray(data)
    ? data
    : data?.data && Array.isArray(data.data)
      ? data.data
      : data?.categories && Array.isArray(data.categories)
        ? data.categories
        : [];

  return categoriesArray.map((cat: any) => ({
    id: cat.id ?? cat.ID ?? 0,
    name: cat.name ?? cat.Name ?? "",
    subCategory: cat.subCategory ?? cat.SubCategory ?? [],
  }));
};

export const fetchCategories = async (token: string): Promise<CategoryRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/v1/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return normalizeCategories(data);
};

export const createCategory = async (
  token: string,
  categoryData: { name: string; subCategory: string[] },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/category`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: categoryData.name,
      subCategory: categoryData.subCategory,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const updateCategory = async (
  token: string,
  id: number,
  categoryData: { name: string; subCategory: string[] },
) => {
  const response = await fetch(`${API_BASE_URL}/v1/category/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: categoryData.name,
      subCategory: categoryData.subCategory,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const deleteCategory = async (token: string, id: number) => {
  const response = await fetch(`${API_BASE_URL}/v1/category/${id}`, {
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
