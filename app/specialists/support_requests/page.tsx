// app/specialist/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
    UserID: number;
    user?: {
      ID: number;
      name: string;
      lastName: string;
    };
  };
  Status: string;
  description: string;
  durationMinutes?: number;
  headTechRequired?: boolean;
  CreatedAt: string;
}

interface Specialist {
  ID: number;
  userID: number;
  UserID?: number;
  skills: string;
  team?: "platformSubmitted" | "aloOperation";
  Team?: "platformSubmitted" | "aloOperation";
  Categories?: Category[];
  categories?: Category[];
}

interface Category {
  id: number;
  ID?: number;
  name: string;
  subCategory: string[];
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
  platformPublished: "پلتفرم",
};

type ModalType = "view" | null;

export default function SpecialistRequestsPage() {
  const { getAccessToken, user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [specialistInfo, setSpecialistInfo] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [shiftMessage, setShiftMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
    null,
  );

  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    { value: "created", label: "ایجاد شده" },
    { value: "inProgress", label: "در حال انجام" },
    { value: "resolved", label: "حل شده" },
    { value: "cancelled", label: "لغو شده" },
  ];

  // دریافت اطلاعات متخصص فعلی
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

        // پیدا کردن متخصص مربوط به کاربر فعلی
        const currentSpecialist = specialistsArray.find(
          (spec: Specialist) =>
            spec.userID === user?.ID || spec.UserID === user?.ID,
        );

        if (currentSpecialist) {
          setSpecialistInfo(currentSpecialist);
          return currentSpecialist;
        }
      }
    } catch (error) {
      console.error("Error fetching specialist info:", error);
    }
    return null;
  };

  // دریافت لیست درخواست‌ها
  const fetchRequests = async (specialist: Specialist | null) => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const specialistCategoryIds = [
      ...(specialist?.categories ?? []),
      ...(specialist?.Categories ?? []),
    ]
      .map((category) => category.id ?? category.ID)
      .filter((categoryId): categoryId is number => categoryId !== undefined)
      .filter((categoryId, index, categoryIds) => categoryIds.indexOf(categoryId) === index);
    const specialistTeam = specialist?.team ?? specialist?.Team ?? "aloOperation";

    if (!specialist || specialistCategoryIds.length === 0) {
      setRequests([]);
      setShiftMessage("برای این متخصص دسته‌بندی‌ای ثبت نشده است.");
      setLoading(false);
      return;
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
        setRequests([]);
        setShiftMessage(
          "در حال حاضر خارج از زمان شیفت خود هستید و درخواست‌های قابل پذیرش نمایش داده نمی‌شوند.",
        );
        return;
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

      // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
      const sorted = [...requestsArray].sort(
        (a, b) =>
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );

      setRequests(sorted);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // پذیرش درخواست
  const acceptRequest = async (requestId: number) => {
    const token = getAccessToken();
    if (!token || !specialistInfo) return false;

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
            assignedSpecialistId: specialistInfo.ID,
            status: "inProgress",
          }),
        },
      );

      if (response.ok) {
        await fetchRequests(specialistInfo);
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
            durationMinutes: 60,
          }),
        },
      );

      if (response.ok) {
        await fetchRequests(specialistInfo);
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const specialist = await fetchSpecialistInfo();
      await fetchRequests(specialist);
      setLoading(false);
    };

    loadData();
  }, [user]);

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

  const getActionType = (
    request: SupportRequest,
  ): "accept" | "view" | "assigned" => {
    // اگر درخواست به متخصص فعلی اختصاص داده شده باشد
    if (request.AssignedSpecialistID === specialistInfo?.ID) {
      return "view";
    }
    // اگر درخواست به متخصص دیگری اختصاص داده شده باشد
    if (
      request.AssignedSpecialistID &&
      request.AssignedSpecialistID !== specialistInfo?.ID
    ) {
      return "assigned";
    }
    // اگر درخواست ایجاد شده و بدون متخصص باشد
    if (request.Status === "created" && !request.AssignedSpecialistID) {
      return "accept";
    }
    return "view";
  };

  const getAssignedToText = (request: SupportRequest): string => {
    if (request.AssignedSpecialist?.user) {
      return `به ${request.AssignedSpecialist.user.name} ${request.AssignedSpecialist.user.lastName} اختصاص یافته`;
    }
    return `به متخصص دیگر اختصاص یافته`;
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.Status !== statusFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const customerName = getCustomerName(request).toLowerCase();
    return (
      request.ID.toString().includes(searchTerm) ||
      customerName.includes(searchLower) ||
      request.plan?.toLowerCase().includes(searchLower) ||
      request.Category?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleView = (request: SupportRequest) => {
    setSelectedRequest(request);
    setModalType("view");
  };

  const handleAccept = async (request: SupportRequest) => {
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchRequests(specialistInfo);
    setLoading(false);
  };

  const toPersianNumber = (num: number): string => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num
      .toString()
      .split("")
      .map((d) => persianDigits[parseInt(d)])
      .join("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📋 همه درخواست‌های پشتیبانی
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            مشاهده و مدیریت تمام درخواست‌های پشتیبانی
          </p>
        </div>

        {shiftMessage && (
          <div
            role="alert"
            className="flex-shrink-0 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {shiftMessage}
          </div>
        )}

        {/* Filters - Fixed */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden shrink-0 mb-2">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، مشتری، طرح یا دسته‌بندی..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وضعیت
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  حذف فیلترها
                </button>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  به‌روزرسانی
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {toPersianNumber(filteredRequests.length)} درخواست یافت شد
            </div>
          </div>
        </div>

        {/* Scrollable Table Section */}
        <div className="flex-1 min-h-0 overflow-auto mt-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden h-auto">
            {/* Desktop Table */}
            <div className="hidden md:block h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
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
                  {filteredRequests.map((request) => {
                    const actionType = getActionType(request);
                    return (
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
                          {actionType === "accept" ? (
                            <button
                              onClick={() => handleAccept(request)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                            >
                              ✅ پذیرش درخواست
                            </button>
                          ) : actionType === "assigned" ? (
                            <span className="text-xs text-gray-400">
                              {getAssignedToText(request)}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleView(request)}
                              className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-md text-sm"
                            >
                              مشاهده
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden h-full overflow-auto">
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const actionType = getActionType(request);
                  return (
                    <div key={request.ID} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500">
                          #{request.ID}
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
                          <span className="text-xs text-gray-500">
                            دسته‌بندی:
                          </span>{" "}
                          {request.Category?.name || "—"} /{" "}
                          {request.Category?.subCategory?.join(", ") || "—"}
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500">
                            تاریخ ایجاد:
                          </span>{" "}
                          {formatDate(request.CreatedAt)}
                        </div>
                      </div>
                      <div className="mt-2">
                        {actionType === "accept" ? (
                          <button
                            onClick={() => handleAccept(request)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm"
                          >
                            ✅ پذیرش درخواست
                          </button>
                        ) : actionType === "assigned" ? (
                          <p className="text-xs text-gray-400 text-center py-2">
                            {getAssignedToText(request)}
                          </p>
                        ) : (
                          <button
                            onClick={() => handleView(request)}
                            className="w-full text-indigo-600 border border-indigo-200 py-2 rounded-md text-sm hover:bg-indigo-50"
                          >
                            مشاهده جزئیات
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                >
                  حذف فیلترها
                </button>
              </div>
            )}
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
              {selectedRequest.Status === "inProgress" &&
                selectedRequest.AssignedSpecialistID === specialistInfo?.ID && (
                  <button
                    onClick={() => handleComplete(selectedRequest)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    پایان پشتیبانی
                  </button>
                )}
              {getActionType(selectedRequest) === "accept" && (
                <button
                  onClick={() => handleAccept(selectedRequest)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  پذیرش درخواست
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
