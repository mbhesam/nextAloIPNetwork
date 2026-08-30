import { API_BASE_URL } from "../api";

export interface SpecialistCategory {
  id?: number;
  ID?: number;
  name: string;
  subCategory: string[];
}

export interface SpecialistRecord {
  ID: number;
  userID: number;
  UserID?: number;
  skills: string;
  specialistTeam?: "platformSubmitted" | "aloOperation";
  SpecialistTeam?: "platformSubmitted" | "aloOperation";
  team?: "platformSubmitted" | "aloOperation";
  Team?: "platformSubmitted" | "aloOperation";
  Categories?: SpecialistCategory[];
  categories?: SpecialistCategory[];
}

export interface SpecialistSupportRequestCustomer {
  ID: number;
  name: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

export interface SpecialistSupportRequest {
  ID: number;
  CustomerID: number;
  Customer?: SpecialistSupportRequestCustomer;
  plan: string;
  CategoryID: number;
  Category?: {
    ID: number;
    name: string;
    subCategory: string[];
  };
  AssignedSpecialistID: number | null;
  AssignedSpecialist?: {
    UserID: number;
    user?: {
      ID: number;
      name: string;
      lastName: string;
    };
  };
  Status: string;
  retries?: number;
  description: string;
  durationMinutes?: number;
  headTechRequired?: boolean;
  CreatedAt: string;
}

export const statusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  created: {
    label: "ایجاد شده",
    color: "bg-yellow-100 text-yellow-800",
    icon: "🟡",
  },
  inProgress: {
    label: "در حال انجام",
    color: "bg-blue-100 text-blue-800",
    icon: "🔄",
  },
  resolved: {
    label: "حل شده",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  },
  cancelled: { label: "لغو شده", color: "bg-red-100 text-red-800", icon: "❌" },
};

export const planLabels: { [key: string]: string } = {
  instant: "فوری",
  schedulable: "قابل برنامه‌ریزی",
  shortStay: "اقامت کوتاه",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
};

export const fetchSpecialistInfo = async (
  token: string,
  userId?: number,
): Promise<SpecialistRecord | null> => {
  const response = await fetch(
    `${API_BASE_URL}/v1/specialists?limit=100&offset=0`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  const specialistsArray = Array.isArray(data)
    ? data
    : data.data || data.specialists || [];

  return (
    specialistsArray.find(
      (spec: SpecialistRecord) =>
        spec.userID === userId || spec.UserID === userId,
    ) ?? null
  );
};

export const fetchSpecialistSupportRequests = async (
  token: string,
  specialist: SpecialistRecord | null,
): Promise<{ requests: SpecialistSupportRequest[]; shiftMessage: string | null }> => {
  if (!specialist) {
    return {
      requests: [],
      shiftMessage: "برای این متخصص دسته‌بندی‌ای ثبت نشده است.",
    };
  }

  const specialistCategoryIds = [
    ...(specialist?.categories ?? []),
    ...(specialist?.Categories ?? []),
  ]
    .map((category) => category.id ?? category.ID)
    .filter((categoryId): categoryId is number => categoryId !== undefined)
    .filter(
      (categoryId, index, categoryIds) =>
        categoryIds.indexOf(categoryId) === index,
    );

  const specialistTeam =
    specialist?.specialistTeam ??
    specialist?.SpecialistTeam ??
    specialist?.team ??
    specialist?.Team ??
    "aloOperation";

  if (specialistCategoryIds.length === 0) {
    return {
      requests: [],
      shiftMessage: "برای این متخصص دسته‌بندی‌ای ثبت نشده است.",
    };
  }

  try {
    const responses = await Promise.all(
      specialistCategoryIds.map((categoryId) =>
        fetch(`${API_BASE_URL}/v1/support-requests/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId,
            status: "created",
            specialistTeam,
            ...(specialistTeam === "aloOperation" && {
              eligibleSpecialistId: specialist.ID,
            }),
          }),
        }),
      ),
    );

    if (responses.some((response) => response.status === 403)) {
      return {
        requests: [],
        shiftMessage:
          "در حال حاضر خارج از زمان شیفت خود هستید و درخواست‌های قابل پذیرش نمایش داده نمی‌شوند.",
      };
    }

    const requestGroups = await Promise.all(
      responses
        .filter((response) => response.ok)
        .map(async (response) => {
          const data = await response.json();
          return Array.isArray(data) ? data : data.data || data.requests || [];
        }),
    );

    const requestsArray = requestGroups.flat();

    return {
      requests: [...requestsArray].sort(
        (a, b) =>
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      ),
      shiftMessage: null,
    };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return {
      requests: [],
      shiftMessage: null,
    };
  }
};

export const acceptSpecialistSupportRequest = async (
  token: string,
  specialistId: number,
  requestId: number,
) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/support-requests/${requestId}/complete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignedSpecialistId: specialistId,
        status: "inProgress",
      }),
    },
  );

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};

export const completeSpecialistSupportRequest = async (
  token: string,
  requestId: number,
) => {
  const response = await fetch(`${API_BASE_URL}/v1/support-request/${requestId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      durationMinutes: 60,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    response,
    responseText: await response.text(),
  };
};
