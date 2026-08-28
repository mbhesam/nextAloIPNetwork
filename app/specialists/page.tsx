// app/specialist/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import moment from "moment-jalaali";

interface SupportRequest {
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
  description: string;
  scheduledStart?: string;
  ScheduledStart?: string;
  scheduled_start?: string;
  CreatedAt: string;
}

interface Specialist {
  ID: number;
  userID: number;
  UserID?: number;
  skills: string;
  team?: "platformSubmitted" | "aloOperation";
  Team?: "platformSubmitted" | "aloOperation";
  categories?: Category[];
  Categories?: Category[];
  shifts?: Shift[];
  user?: {
    ID: number;
    name: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

interface Category {
  id: number;
  ID?: number;
  name: string;
  subCategory: string[];
}

interface Shift {
  id: number;
  shiftDate: string;
  shiftTime: "morning" | "evening" | "night";
}

const API_BASE_URL = "http://apialoipnetwork.hesamhelperdomain.ir";

const statusConfig: {
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

const planLabels: { [key: string]: string } = {
  instant: "فوری",
  schedulable: "قابل برنامه‌ریزی",
  shortStay: "اقامت کوتاه",
  inPerson: "حضوری",
};

type ModalType = "view" | null;

export default function SpecialistDashboardPage() {
  const { getAccessToken, user } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState<SupportRequest[]>(
    [],
  );
  const [acceptableRequests, setAcceptableRequests] = useState<
    SupportRequest[]
  >([]);
  const [specialistInfo, setSpecialistInfo] = useState<Specialist | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [shiftMessage, setShiftMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
    null,
  );
  const [debugInfo, setDebugInfo] = useState<string>("در حال آماده‌سازی...");
  const hasLoaded = useRef(false);
  const retryCount = useRef(0);

  // دریافت اطلاعات متخصص فعلی
  const fetchSpecialistInfo = async () => {
    const token = getAccessToken();
    console.log("🔍 [1] fetchSpecialistInfo - Token exists:", !!token);
    console.log("🔍 [1] fetchSpecialistInfo - user:", user);

    if (!token) {
      console.log("❌ [1] No token found");
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/specialists?limit=100&offset=0`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];

        console.log(
          `✅ [1] Found ${specialistsArray.length} specialists total`,
        );
        console.log("🔍 [1] Looking for userID:", user?.ID);

        const currentSpecialist = specialistsArray.find(
          (spec: Specialist) =>
            (spec.userID === user?.ID || spec.UserID === user?.ID),
        );

        if (currentSpecialist) {
          console.log("✅ [1] Specialist found! ID:", currentSpecialist.ID);
          console.log("✅ [1] Specialist skills:", currentSpecialist.skills);
          setSpecialistInfo(currentSpecialist);
          setShifts(currentSpecialist.shifts || []);
          return currentSpecialist;
        } else {
          console.log("❌ [1] No specialist found for user ID:", user?.ID);
          console.log(
            "📋 [1] Available specialist userIDs:",
            specialistsArray.map((s: Specialist) => s.userID),
          );
          return null;
        }
      } else {
        console.log("❌ [1] Response not OK:", response.status);
        return null;
      }
    } catch (error) {
      console.error("❌ [1] Error fetching specialist:", error);
      return null;
    }
  };

  // دریافت درخواست‌های محول شده
  const fetchAssignedRequests = async (specialistId: number) => {
    const token = getAccessToken();
    console.log(`🔍 [2] fetchAssignedRequests - specialistId: ${specialistId}`);
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/support-requests/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specialist_id: specialistId,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const requestsArray = Array.isArray(data)
          ? data
          : data.data || data.requests || [];

        console.log(`✅ [2] Total requests returned: ${requestsArray.length}`);

        const filtered = requestsArray.filter(
          (req: SupportRequest) =>
            req.Status === "inProgress" || req.Status === "resolved",
        );

        console.log(
          `✅ [2] Filtered (inProgress/resolved): ${filtered.length}`,
        );
        if (filtered.length > 0) {
          console.log("📋 [2] First request status:", filtered[0].Status);
          console.log("📋 [2] First request ID:", filtered[0].ID);
        }

        const sorted = [...filtered].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
        );

        setAssignedRequests(sorted);
        return sorted;
      } else {
        console.log("❌ [2] Response not OK:", response.status);
        return [];
      }
    } catch (error) {
      console.error("❌ [2] Error fetching assigned requests:", error);
      return [];
    }
  };

  // دریافت درخواست‌های قابل پذیرش
  const fetchAcceptableRequests = async (specialist: Specialist | null) => {
    const token = getAccessToken();
    console.log("🔍 [3] fetchAcceptableRequests - Token exists:", !!token);
    if (!token) return;

    const specialistCategoryIds = [
      ...(specialist?.categories ?? []),
      ...(specialist?.Categories ?? []),
    ]
      .map((category) => category.id ?? category.ID)
      .filter((categoryId): categoryId is number => categoryId !== undefined)
      .filter((categoryId, index, categoryIds) => categoryIds.indexOf(categoryId) === index);
    const specialistTeam = specialist?.team ?? specialist?.Team ?? "aloOperation";

    if (!specialist || specialistCategoryIds.length === 0) {
      setAcceptableRequests([]);
      return [];
    }

    try {
      setShiftMessage(null);
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
              team: specialistTeam,
              ...(specialistTeam === "aloOperation" && {
                eligibleSpecialistId: specialist.ID,
              }),
            }),
          }),
        ),
      );

      if (responses.some((response) => response.status === 403)) {
        setAcceptableRequests([]);
        setShiftMessage("شیفت شما نیست در حال حاضر");
        return [];
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

      console.log(`✅ [3] Total requests returned: ${requestsArray.length}`);

      const filtered = requestsArray.filter(
        (req: SupportRequest) =>
          req.Status === "created" && !req.AssignedSpecialistID,
      );

      console.log(
        `✅ [3] Filtered (created & no specialist): ${filtered.length}`,
      );

      const sorted = [...filtered].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );

      setAcceptableRequests(sorted);
      return sorted;
    } catch (error) {
      console.error("❌ [3] Error fetching acceptable requests:", error);
      return [];
    }
  };

  // تابع اصلی بارگذاری داده‌ها
  const loadAllData = useCallback(
    async (isRetry = false) => {
      console.log(`\n🚀 ===== loadAllData START (retry: ${isRetry}) =====`);
      console.log("🚀 user:", user);
      console.log("🚀 user?.ID:", user?.ID);

      if (!user?.ID) {
        console.log("⚠️ loadAllData - No user ID, waiting...");
        setDebugInfo("در انتظار اطلاعات کاربر...");
        return false;
      }

      setLoading(true);
      setDebugInfo("در حال بارگذاری اطلاعات...");

      try {
        console.log("📡 Step 1: Getting specialist info...");
        const specialist = await fetchSpecialistInfo();

        if (specialist) {
          console.log(
            `📡 Step 2: Getting assigned requests for specialist ${specialist.ID}...`,
          );
          const assigned = await fetchAssignedRequests(specialist.ID);
          console.log(
            `📡 Step 2: Got ${assigned?.length || 0} assigned requests`,
          );
        } else {
          console.log("⚠️ No specialist found, skipping assigned requests");
        }

        console.log("📡 Step 3: Getting acceptable requests...");
        const acceptable = await fetchAcceptableRequests(specialist);
        console.log(
          `📡 Step 3: Got ${acceptable?.length || 0} acceptable requests`,
        );

        console.log("✅ All data loaded successfully");
        setDebugInfo(
          `بارگذاری کامل شد - ${assignedRequests.length} درخواست محول شده, ${acceptableRequests.length} درخواست قابل پذیرش`,
        );
        retryCount.current = 0;
        return true;
      } catch (error) {
        console.error("❌ Error in loadAllData:", error);
        setDebugInfo("خطا در بارگذاری اطلاعات");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.ID],
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // بارگذاری اولیه - با بررسی کامل user
  useEffect(() => {
    console.log(`\n🔄 useEffect triggered - user:`, user);
    console.log(`🔄 hasLoaded.current: ${hasLoaded.current}`);
    console.log(`🔄 retryCount.current: ${retryCount.current}`);

    if (user?.ID && !hasLoaded.current) {
      console.log(`✅ Starting initial load for user ID: ${user.ID}`);
      hasLoaded.current = true;
      loadAllData(false);
    } else if (user?.ID && hasLoaded.current) {
      console.log("⏭️ Already loaded, skipping...");
    } else if (!user?.ID && retryCount.current < 5) {
      console.log(`⏳ Waiting for user... retry ${retryCount.current + 1}/5`);
      setDebugInfo(
        `در حال انتظار برای ورود کاربر... (تلاش ${retryCount.current + 1}/5)`,
      );

      const timer = setTimeout(() => {
        retryCount.current++;
        console.log(`🔄 Retry ${retryCount.current} - checking for user again`);
        if (user?.ID) {
          hasLoaded.current = true;
          loadAllData(false);
        } else if (retryCount.current >= 5) {
          setDebugInfo(
            "خطا: اطلاعات کاربر دریافت نشد. لطفاً صفحه را رفرش کنید.",
          );
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, loadAllData]);

  // پذیرش درخواست
  const acceptRequest = async (requestId: number) => {
    const token = getAccessToken();
    if (!token || !specialistInfo) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/support-request/${requestId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedSpecialistId: specialistInfo.ID,
            status: "inProgress",
          }),
        },
      );

      if (response.ok) {
        await loadAllData(true);
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // تکمیل درخواست
  const completeRequest = async (requestId: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/support-request/${requestId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "resolved",
          }),
        },
      );

      if (response.ok) {
        await loadAllData(true);
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error completing request:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  const getCustomerName = (request: SupportRequest) => {
    if (request.Customer) {
      return `${request.Customer.name} ${request.Customer.lastName}`;
    }
    return `کاربر ${request.CustomerID}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return moment(dateString).format("jYYYY/jMM/jDD HH:mm");
  };

  const handleView = (request: SupportRequest) => {
    setSelectedRequest(request);
    setModalType("view");
  };

  const isBeforeScheduledStart = (request: SupportRequest): boolean => {
    const scheduledStartValue =
      request.scheduledStart ??
      request.ScheduledStart ??
      request.scheduled_start;
    if (!scheduledStartValue) return false;
    const scheduledStart = new Date(scheduledStartValue).getTime();
    return Number.isFinite(scheduledStart) && scheduledStart > currentTime;
  };

  const handleAccept = async (request: SupportRequest) => {
    if (isBeforeScheduledStart(request)) {
      alert("زمان شروع درخواست هنوز نرسیده است");
      return;
    }

    if (confirm(`آیا از پذیرش درخواست #${request.ID} مطمئن هستید؟`)) {
      const success = await acceptRequest(request.ID);
      if (success) {
        alert(`✅ درخواست #${request.ID} با موفقیت پذیرفته شد`);
      }
    }
  };

  const handleComplete = async (request: SupportRequest) => {
    if (confirm(`آیا از اتمام درخواست #${request.ID} مطمئن هستید؟`)) {
      const success = await completeRequest(request.ID);
      if (success) {
        alert(`✅ درخواست #${request.ID} با موفقیت تکمیل شد`);
        closeModal();
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRequest(null);
  };

  const manualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    hasLoaded.current = false;
    retryCount.current = 0;
    loadAllData(true);
  };

  const toPersianNumber = (num: number): string => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num
      .toString()
      .split("")
      .map((d) => persianDigits[parseInt(d)])
      .join("");
  };

  const inProgressCount = assignedRequests.filter(
    (r) => r.Status === "inProgress",
  ).length;
  const completedCount = assignedRequests.filter(
    (r) => r.Status === "resolved",
  ).length;
  const upcomingShiftsCount = shifts.length;
  const acceptableRequestsCount = acceptableRequests.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">در حال بارگذاری اطلاعات...</p>
          <p className="text-gray-400 text-sm mt-2">{debugInfo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen mt-30">
      <div className="flex-1 flex flex-col p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            خوش آمدید، {specialistInfo?.user?.name || user?.name || "متخصص"}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            پیشخوان مدیریت درخواست‌ها و شیفت‌های کاری
          </p>
          {specialistInfo?.skills && (
            <p className="text-sm text-gray-500 mt-2">
              مهارت‌ها: {specialistInfo.skills}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={manualRefresh}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              🔄 به‌روزرسانی دستی
            </button>
            <p className="text-xs text-gray-400">{debugInfo}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">
                  📋 درخواست‌های در حال انجام
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {toPersianNumber(inProgressCount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">در حال انجام</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 text-xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">✅ تکمیل شده</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {toPersianNumber(completedCount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">کل درخواست‌ها</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">⏰ شیفت‌های آینده</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {toPersianNumber(upcomingShiftsCount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">شیفت ثبت شده</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-purple-600 text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-r-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">
                  🎯 درخواست‌های قابل پذیرش
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {toPersianNumber(acceptableRequestsCount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">آماده اختصاص</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <span className="text-orange-600 text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* درخواست‌های پشتیبانی محول شده */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                📋 درخواست‌های پشتیبانی محول شده
              </h2>
              <p className="text-gray-500 text-sm">
                لیست درخواست‌هایی که به شما اختصاص داده شده است
              </p>
              <p className="text-xs text-gray-400 mt-1">
                تعداد: {assignedRequests.length} درخواست
              </p>
            </div>
            <button
              onClick={() => {
                if (specialistInfo) {
                  fetchAssignedRequests(specialistInfo.ID);
                } else {
                  manualRefresh();
                }
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              به‌روزرسانی
            </button>
          </div>

          {assignedRequests.length === 0 && !loading && (
            <div className="text-center py-4 bg-yellow-50">
              <p className="text-yellow-600 text-sm">
                ⚠️ هیچ درخواست محول شده‌ای یافت نشد
                {specialistInfo
                  ? ` (شناسه متخصص: ${specialistInfo.ID})`
                  : " (اطلاعات متخصص یافت نشد)"}
              </p>
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    شناسه
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    طرح
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignedRequests.map((request) => (
                  <tr key={request.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      #{request.ID}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {planLabels[request.plan] || request.plan}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.Category?.name || "—"} /{" "}
                      {request.Category?.subCategory?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {getCustomerName(request)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(request.CreatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                      >
                        {statusConfig[request.Status]?.icon}{" "}
                        {statusConfig[request.Status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(request)}
                          className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md"
                        >
                          مشاهده
                        </button>
                        {request.Status === "inProgress" && (
                          <button
                            onClick={() => handleComplete(request)}
                            className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-md"
                          >
                            پایان
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {assignedRequests.map((request) => (
              <div key={request.ID} className="p-4 border-b hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    شناسه: #{request.ID}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                  >
                    {statusConfig[request.Status]?.icon}{" "}
                    {statusConfig[request.Status]?.label}
                  </span>
                </div>
                <div className="font-bold text-base mb-1">
                  {getCustomerName(request)}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">طرح:</span>{" "}
                    {planLabels[request.plan] || request.plan}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">دسته‌بندی:</span>{" "}
                    {request.Category?.name || "—"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">تاریخ ایجاد:</span>{" "}
                    {formatDate(request.CreatedAt)}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleView(request)}
                    className="flex-1 text-indigo-600 py-2 text-sm"
                  >
                    مشاهده
                  </button>
                  {request.Status === "inProgress" && (
                    <button
                      onClick={() => handleComplete(request)}
                      className="flex-1 text-green-600 py-2 text-sm"
                    >
                      پایان
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* درخواست‌های قابل پذیرش */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                🎯 درخواست‌های قابل پذیرش
              </h2>
              <p className="text-gray-500 text-sm">
                درخواست‌هایی که می‌توانید بپذیرید
              </p>
              <p className="text-xs text-gray-400 mt-1">
                تعداد: {acceptableRequests.length} درخواست
              </p>
            </div>
            <button
              onClick={() => fetchAcceptableRequests(specialistInfo)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              به‌روزرسانی
            </button>
          </div>

          {shiftMessage && (
            <div
              role="alert"
              className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800"
            >
              {shiftMessage}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    شناسه
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    طرح
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {acceptableRequests.map((request) => (
                  <tr key={request.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      #{request.ID}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {planLabels[request.plan] || request.plan}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {request.Category?.name || "—"} /{" "}
                      {request.Category?.subCategory?.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {getCustomerName(request)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(request.CreatedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                      >
                        {statusConfig[request.Status]?.icon}{" "}
                        {statusConfig[request.Status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleAccept(request)}
                        disabled={isBeforeScheduledStart(request)}
                        title={
                          isBeforeScheduledStart(request)
                            ? "زمان شروع درخواست هنوز نرسیده است"
                            : undefined
                        }
                        className={`text-white px-3 py-1 rounded-md text-sm ${
                          isBeforeScheduledStart(request)
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        پذیرش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {acceptableRequests.map((request) => (
              <div key={request.ID} className="p-4 border-b hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    شناسه: #{request.ID}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                  >
                    {statusConfig[request.Status]?.icon}{" "}
                    {statusConfig[request.Status]?.label}
                  </span>
                </div>
                <div className="font-bold text-base mb-1">
                  {getCustomerName(request)}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">طرح:</span>{" "}
                    {planLabels[request.plan] || request.plan}
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">دسته‌بندی:</span>{" "}
                    {request.Category?.name || "—"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">تاریخ ایجاد:</span>{" "}
                    {formatDate(request.CreatedAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleAccept(request)}
                  disabled={isBeforeScheduledStart(request)}
                  title={
                    isBeforeScheduledStart(request)
                      ? "زمان شروع درخواست هنوز نرسیده است"
                      : undefined
                  }
                  className={`w-full text-white py-2 rounded-md text-sm ${
                    isBeforeScheduledStart(request)
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  پذیرش درخواست
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {modalType === "view" && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده درخواست</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500">شناسه</label>
                  <p className="font-medium">#{selectedRequest.ID}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">وضعیت</label>
                  <p>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[selectedRequest.Status]?.color}`}
                    >
                      {statusConfig[selectedRequest.Status]?.icon}{" "}
                      {statusConfig[selectedRequest.Status]?.label}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">مشتری</label>
                  <p>{getCustomerName(selectedRequest)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">طرح</label>
                  <p>
                    {planLabels[selectedRequest.plan] || selectedRequest.plan}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">دسته‌بندی</label>
                  <p>
                    {selectedRequest.Category?.name || "—"} /{" "}
                    {selectedRequest.Category?.subCategory?.join(", ") || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">تاریخ ایجاد</label>
                  <p>{formatDate(selectedRequest.CreatedAt)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">شرح درخواست</label>
                  <p className="bg-gray-50 p-2 rounded">
                    {selectedRequest.description || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                بستن
              </button>
              {selectedRequest.Status === "inProgress" && (
                <button
                  onClick={() => {
                    handleComplete(selectedRequest);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  پایان پشتیبانی
                </button>
              )}
              {selectedRequest.Status === "created" && (
                <button
                  onClick={() => {
                    handleAccept(selectedRequest);
                    closeModal();
                  }}
                  disabled={isBeforeScheduledStart(selectedRequest)}
                  title={
                    isBeforeScheduledStart(selectedRequest)
                      ? "زمان شروع درخواست هنوز نرسیده است"
                      : undefined
                  }
                  className={`px-4 py-2 text-white rounded-lg ${
                    isBeforeScheduledStart(selectedRequest)
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isBeforeScheduledStart(selectedRequest)
                    ? "انتظار تا زمان شروع"
                    : "پذیرش درخواست"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
