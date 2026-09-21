// app/specialist/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import moment from "moment-jalaali";
import { API_BASE_URL } from "../lib/api";

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
  retries?: number;
  description: string;
  durationMinutes?: number;
  headTechRequired?: boolean;
  endRejectionReason?: string;
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
  specialistTeam?: "platformSubmitted" | "aloOperation";
  SpecialistTeam?: "platformSubmitted" | "aloOperation";
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

const statusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  created: {
    label: "ایجاد شده",
    color: "bg-yellow-500/20 text-white",
    icon: "🟡",
  },
  inProgress: {
    label: "در حال انجام",
    color: "bg-blue-500/20 text-white",
    icon: "🔄",
  },
  waitingApproval: {
    label: "در انتظار تأیید مشتری",
    color: "bg-orange-500/20 text-white",
    icon: "⏳",
  },
  done: {
    label: "تکمیل شده",
    color: "bg-green-500/20 text-white",
    icon: "✅",
  },
  resolved: {
    label: "حل شده",
    color: "bg-green-500/20 text-white",
    icon: "✅",
  },
  cancelled: {
    label: "لغو شده",
    color: "bg-red-500/20 text-white",
    icon: "❌",
  },
};

const planLabels: { [key: string]: string } = {
  instant: "فوری",
  schedulable: "قابل برنامه‌ریزی",
  shortStay: "اقامت کوتاه",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
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
  const [debugInfo, setDebugInfo] = useState<string>();
  const hasLoaded = useRef(false);
  const retryCount = useRef(0);

  const shouldRequireSeniorTech = (request: SupportRequest) => {
    return Boolean(request.headTechRequired) || (request.retries ?? 0) >= 2;
  };

  const fetchSpecialistInfo = async () => {
    const token = getAccessToken();
    if (!token) return null;

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

        const currentSpecialist = specialistsArray.find(
          (spec: Specialist) =>
            spec.userID === user?.ID || spec.UserID === user?.ID,
        );

        if (currentSpecialist) {
          setSpecialistInfo(currentSpecialist);
          setShifts(currentSpecialist.shifts || []);
          return currentSpecialist;
        }
        return null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching specialist:", error);
      return null;
    }
  };

  const fetchAssignedRequests = async (specialistId: number) => {
    const token = getAccessToken();
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

        const filtered = requestsArray.filter(
          (req: SupportRequest) =>
            req.Status === "inProgress" ||
            req.Status === "waitingApproval" ||
            req.Status === "resolved" ||
            req.Status === "done",
        );

        const sorted = [...filtered].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
        );

        setAssignedRequests(sorted);
        return sorted;
      }
      return [];
    } catch (error) {
      console.error("Error fetching assigned requests:", error);
      return [];
    }
  };

  const fetchAcceptableRequests = async (specialist: Specialist | null) => {
    const token = getAccessToken();
    if (!token) return;

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
              specialistTeam,
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
            return Array.isArray(data)
              ? data
              : data.data || data.requests || [];
          }),
      );
      const requestsArray = requestGroups.flat();

      const filtered = requestsArray.filter(
        (req: SupportRequest) =>
          req.Status === "created" && !req.AssignedSpecialistID,
      );

      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );

      setAcceptableRequests(sorted);
      return sorted;
    } catch (error) {
      console.error("Error fetching acceptable requests:", error);
      return [];
    }
  };

  const loadAllData = useCallback(
    async (isRetry = false) => {
      if (!user?.ID) {
        setDebugInfo("در انتظار اطلاعات کاربر...");
        return false;
      }

      setLoading(true);

      try {
        const specialist = await fetchSpecialistInfo();
        if (specialist) {
          await fetchAssignedRequests(specialist.ID);
        }
        await fetchAcceptableRequests(specialist);
        retryCount.current = 0;
        return true;
      } catch (error) {
        console.error("Error in loadAllData:", error);
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

  useEffect(() => {
    if (user?.ID && !hasLoaded.current) {
      hasLoaded.current = true;
      loadAllData(false);
    } else if (!user?.ID && retryCount.current < 5) {
      const timer = setTimeout(() => {
        retryCount.current++;
        if (user?.ID) {
          hasLoaded.current = true;
          loadAllData(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loadAllData]);

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
      }
      return false;
    } catch (error) {
      console.error("Error accepting request:", error);
      return false;
    }
  };

  const completeRequest = async (
    requestId: number,
    durationMinutes: number,
  ) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/support-requests/${requestId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            durationMinutes,
          }),
        },
      );

      if (response.ok) {
        await loadAllData(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error completing request:", error);
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
    if (shouldRequireSeniorTech(request)) {
      alert("این درخواست به بررسی تکنسین ارشد نیاز دارد");
      return;
    }
    if (confirm(`آیا از اتمام درخواست #${request.ID} مطمئن هستید؟`)) {
      const durationInput = prompt(
        "مدت زمان انجام درخواست را به دقیقه وارد کنید",
        "60",
      );
      const durationMinutes = Number(durationInput);
      if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) return;
      const success = await completeRequest(request.ID, durationMinutes);
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
    (r) => r.Status === "resolved" || r.Status === "done",
  ).length;
  const upcomingShiftsCount = shifts.length;
  const acceptableRequestsCount = acceptableRequests.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen  to-blue-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">در حال بارگذاری اطلاعات...</p>
          <p className="text-white/30 text-sm mt-2">{debugInfo}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen  p-4 md:p-6 relative overflow-hidden mt-30">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col ">
        {/* Header */}
        <div className=" flex flex-col justify-center items-center mb-5 w-full bg-amber-100/10 rounded-2xl p-5">
          <p className="text-2xl sm:text-3xl font-bold text-black mb-3">
            خوش اومدی {specialistInfo?.user?.name || user?.name || "متخصص"}
          </p>
          <p className="text-emerald-950 text-sm mt-1 ">
            پیشخوان مدیریت درخواست‌ها و شیفت‌های کاری
          </p>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-xs text-white/30">{debugInfo}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-600/20 backdrop-blur-md border border-blue/20 rounded-xl shadow-lg shadow-blue-500/5 p-4 border-r-4 border-blue-400/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/50 text-sm">
                  📋 درخواست‌های در حال انجام
                </p>
                <p className="text-2xl font-bold text-white mt-5">
                  {toPersianNumber(inProgressCount)}
                </p>
              </div>
              <div className=" bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/20">
                <span className="text-blue-300 text-xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-green-500/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 p-4 border-r-4 border-green-400/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/50 text-sm">✅ تکمیل شده</p>
                <p className="text-2xl font-bold text-white mt-5">
                  {toPersianNumber(completedCount)}
                </p>
              </div>
              <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-3 border border-green-400/20">
                <span className="text-green-300 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 p-4 border-r-4 border-purple-400/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/50 text-sm">⏰ شیفت‌های آینده</p>
                <p className="text-2xl font-bold text-white mt-5">
                  {toPersianNumber(upcomingShiftsCount)}
                </p>
              </div>
              <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-3 border border-purple-400/20">
                <span className="text-purple-300 text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-red-500/30 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 p-4 border-r-4 border-orange-400/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/50 text-sm">
                  🎯 درخواست‌های قابل پذیرش
                </p>
                <p className="text-2xl font-bold text-white mt-5">
                  {toPersianNumber(acceptableRequestsCount)}
                </p>
              </div>
              <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-3 border border-orange-400/20">
                <span className="text-orange-300 text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* درخواست‌های پشتیبانی محول شده */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white/90">
                📋 درخواست‌های پشتیبانی محول شده
              </h2>
              <p className="text-xs text-white/30 mt-5 mr-7">
                تعداد: {assignedRequests.length} درخواست
              </p>
            </div>
          </div>

          {assignedRequests.length === 0 && !loading && (
            <div className="text-center py-4 bg-yellow-500/10 backdrop-blur-sm">
              <p className="text-yellow-200/60 text-sm">
                ⚠️ هیچ درخواست محول شده‌ای یافت نشد
              </p>
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    شناسه
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    طرح
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assignedRequests.map((request) => (
                  <tr key={request.ID} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-sm text-white/80">
                      #{request.ID}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {planLabels[request.plan] || request.plan}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <span className="text-white/60">
                          {request.Category?.name || "—"} /{" "}
                          {request.Category?.subCategory?.join(", ") || "—"}
                        </span>
                        {shouldRequireSeniorTech(request) && (
                          <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-white border border-red-400/20">
                            نیازمند تکنسین ارشد
                          </span>
                        )}
                        {request.endRejectionReason &&
                          (request.retries ?? 0) > 0 && (
                            <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-orange-500/20 text-white border border-orange-400/20">
                              دلیل رد: {request.endRejectionReason}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white/90">
                      {getCustomerName(request)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
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
                          className="text-blue-300 hover:text-blue-200 px-3 py-1 rounded-md transition"
                        >
                          مشاهده
                        </button>
                        {request.Status === "inProgress" && (
                          <button
                            onClick={() => handleComplete(request)}
                            disabled={shouldRequireSeniorTech(request)}
                            className={`px-3 py-1 rounded-md transition ${
                              shouldRequireSeniorTech(request)
                                ? " text-red-300"
                                : "text-red-300 hover:text-red-400"
                            }`}
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
              <div
                key={request.ID}
                className="p-4 border-b border-white/5 hover:bg-white/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-white/40">
                    شناسه: #{request.ID}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                  >
                    {statusConfig[request.Status]?.icon}{" "}
                    {statusConfig[request.Status]?.label}
                  </span>
                </div>
                <div className="font-bold text-base text-white/90 mb-1">
                  {getCustomerName(request)}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-sm text-white/60">
                  <div>طرح: {planLabels[request.plan] || request.plan}</div>
                  <div>دسته‌بندی: {request.Category?.name || "—"}</div>
                  <div className="col-span-2">
                    تاریخ ایجاد: {formatDate(request.CreatedAt)}
                  </div>
                  {shouldRequireSeniorTech(request) && (
                    <div className="col-span-2 bg-red-600/20 border border-red-500 text-white font-medium text-xs mt-1 p-2 rounded-2xl">
                      ⚠️ نیازمند تکنسین ارشد
                    </div>
                  )}
                  {request.endRejectionReason && (request.retries ?? 0) > 0 && (
                    <div className="col-span-2 bg-orange-600/20 border border-orange-500 text-white font-medium text-xs mt-1 p-2 rounded-2xl">
                      دلیل رد: {request.endRejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => handleView(request)}
                    className="flex-1 text-blue-300 py-2 text-sm"
                  >
                    مشاهده
                  </button>
                  {request.Status === "inProgress" && (
                    <button
                      onClick={() => handleComplete(request)}
                      disabled={shouldRequireSeniorTech(request)}
                      className={`flex-1 py-2 text-sm ${
                        shouldRequireSeniorTech(request)
                          ? "cursor-not-allowed text-red-400"
                          : "text-red-600"
                      }`}
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
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white/90">
                🎯 درخواست‌های قابل پذیرش
              </h2>
              <p className="text-white/40 text-sm mt-3 mr-7">
                درخواست‌هایی که می‌توانید بپذیرید
              </p>
              <p className="text-xs text-white/30 mt-3 mr-7">
                تعداد: {acceptableRequests.length} درخواست
              </p>
            </div>
          </div>

          {shiftMessage && (
            <div className="border-b border-amber-400/20 bg-red-500 backdrop-blur-sm px-6 py-3 text-sm text-amber-200/80">
              {shiftMessage}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    شناسه
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    طرح
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    دسته‌بندی
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    مشتری
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    تاریخ ایجاد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {acceptableRequests.map((request) => (
                  <tr key={request.ID} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-sm text-white/80">
                      #{request.ID}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {planLabels[request.plan] || request.plan}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <span className="text-white/60">
                          {request.Category?.name || "—"} /{" "}
                          {request.Category?.subCategory?.join(", ") || "—"}
                        </span>
                        {shouldRequireSeniorTech(request) && (
                          <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-white border border-red-400/20">
                            نیازمند تکنسین ارشد
                          </span>
                        )}
                        {request.endRejectionReason &&
                          (request.retries ?? 0) > 0 && (
                            <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-orange-500/20 text-white border border-orange-400/20">
                              دلیل رد: {request.endRejectionReason}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-white/90">
                      {getCustomerName(request)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
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
                        className={`px-3 py-1 rounded-md text-sm transition ${
                          isBeforeScheduledStart(request)
                            ? "cursor-not-allowed bg-white/10 text-white/30"
                            : "bg-green-500/20 text-white border border-green-400/30 hover:bg-green-500/30"
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
              <div
                key={request.ID}
                className="p-4 border-b border-white/5 hover:bg-white/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-white/40">
                    شناسه: #{request.ID}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                  >
                    {statusConfig[request.Status]?.icon}{" "}
                    {statusConfig[request.Status]?.label}
                  </span>
                </div>
                <div className="font-bold text-base text-white/90 mb-1">
                  {getCustomerName(request)}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-white/60">
                  <div>طرح: {planLabels[request.plan] || request.plan}</div>
                  <div>دسته‌بندی: {request.Category?.name || "—"}</div>
                  <div className="col-span-2">
                    تاریخ ایجاد: {formatDate(request.CreatedAt)}
                  </div>
                  {shouldRequireSeniorTech(request) && (
                    <div className="col-span-2 text-white font-medium text-xs mt-1">
                      ⚠️ نیازمند تکنسین ارشد
                    </div>
                  )}
                  {request.endRejectionReason && (request.retries ?? 0) > 0 && (
                    <div className="col-span-2 bg-orange-600/20 border border-orange-500 text-white font-medium text-xs mt-1 p-2 rounded-2xl">
                      دلیل رد: {request.endRejectionReason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAccept(request)}
                  disabled={isBeforeScheduledStart(request)}
                  className={`w-full py-2 rounded-md text-sm transition ${
                    isBeforeScheduledStart(request)
                      ? "cursor-not-allowed bg-white/10 text-white/30"
                      : "bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">
                مشاهده درخواست
              </h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/50">شناسه</label>
                  <p className="font-medium text-white/90">
                    #{selectedRequest.ID}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">وضعیت</label>
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
                  <label className="text-sm text-white/50">مشتری</label>
                  <p className="text-white/90">
                    {getCustomerName(selectedRequest)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">طرح</label>
                  <p className="text-white/90">
                    {planLabels[selectedRequest.plan] || selectedRequest.plan}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">دسته‌بندی</label>
                  <p className="text-white/90">
                    {selectedRequest.Category?.name || "—"} /{" "}
                    {selectedRequest.Category?.subCategory?.join(", ") || "—"}
                  </p>
                  {shouldRequireSeniorTech(selectedRequest) && (
                    <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-red-500/20 text-white border border-red-400/20">
                      نیازمند تکنسین ارشد
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-white/50">تاریخ ایجاد</label>
                  <p className="text-white/90">
                    {formatDate(selectedRequest.CreatedAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-white/50">شرح درخواست</label>
                  <p className="bg-white/5 backdrop-blur-sm p-2 rounded border border-white/10 text-white/80">
                    {selectedRequest.description || "—"}
                  </p>
                </div>
                {selectedRequest.endRejectionReason &&
                  (selectedRequest.retries ?? 0) > 0 && (
                    <div className="col-span-2 rounded-lg bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 px-3 py-2">
                      <label className="text-sm text-orange-200/80">
                        دلیل رد پایان درخواست
                      </label>
                      <p className="text-orange-100 font-medium mt-1">
                        {selectedRequest.endRejectionReason}
                      </p>
                    </div>
                  )}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                بستن
              </button>
              {selectedRequest.Status === "inProgress" && (
                <button
                  onClick={() => {
                    handleComplete(selectedRequest);
                    closeModal();
                  }}
                  disabled={shouldRequireSeniorTech(selectedRequest)}
                  className={`px-4 py-2 rounded-lg transition ${
                    shouldRequireSeniorTech(selectedRequest)
                      ? "cursor-not-allowed bg-red-500 text-white"
                      : "bg-red-500 text-white border border-green-400/30 hover:bg-green-500/30"
                  }`}
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
                  className={`px-4 py-2 rounded-lg transition ${
                    isBeforeScheduledStart(selectedRequest)
                      ? "cursor-not-allowed bg-white/10 text-white/30"
                      : "bg-blue-500/20 text-blue-200 border border-blue-400/30 hover:bg-blue-500/30"
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
