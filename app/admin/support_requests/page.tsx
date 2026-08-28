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

interface Specialist {
  ID: number;
  userID: number;
  user?: {
    ID: number;
    name: string;
    lastName: string;
  };
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
  waitingApproval: {
    label: "در انتظار تأیید مشتری",
    color: "bg-orange-100 text-orange-800",
    icon: "⏳",
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
  schedulable: "زمان‌بندی شده",
  shortStay: "کوتاه‌مدت",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
};

const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-100 text-red-800",
  "routing&switching": "bg-blue-100 text-blue-800",
  Sambal: "bg-purple-100 text-purple-800",
  security: "bg-green-100 text-green-800",
  cloud: "bg-cyan-100 text-cyan-800",
};

type ModalType = "view" | "assign" | "delete" | null;

export default function AdminSupportRequestsPage() {
  const { getAccessToken } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
    null,
  );
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number | "">(
    "",
  );

  // دریافت لیست متخصصان
  const fetchSpecialists = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/specialists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const specialistsArray = Array.isArray(data)
          ? data
          : data.data || data.specialists || [];
        setSpecialists(specialistsArray);
      }
    } catch (error) {
      console.error("Error fetching specialists:", error);
    }
  };

  // دریافت لیست درخواست‌ها (با مرتب‌سازی جدیدترین اول)
  const fetchRequests = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/support-requests/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ limit: 100, offset: 0 }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const requestsArray = Array.isArray(data)
          ? data
          : data.data || data.requests || [];

        // مرتب‌سازی: جدیدترین درخواست‌ها اول نمایش داده شوند
        const sortedRequests = [...requestsArray].sort(
          (a, b) =>
            new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
        );

        setRequests(sortedRequests);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // اختصاص متخصص به درخواست
  const assignSpecialist = async (requestId: number, specialistId: number) => {
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
            assignedSpecialistId: specialistId,
            status: "inProgress",
          }),
        },
      );

      if (response.ok) {
        await fetchRequests();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error assigning specialist:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  // حذف درخواست
  const deleteRequest = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/support-request/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchRequests();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchSpecialists();
  }, []);

  const getCustomerName = (request: SupportRequest) => {
    if (request.Customer) {
      return `${request.Customer.name} ${request.Customer.lastName}`;
    }
    return `کاربر ${request.CustomerID}`;
  };

  const getSpecialistName = (request: SupportRequest) => {
    if (request.AssignedSpecialist?.user) {
      return `${request.AssignedSpecialist.user.name} ${request.AssignedSpecialist.user.lastName}`;
    }
    if (request.AssignedSpecialistID) {
      return `متخصص ${request.AssignedSpecialistID}`;
    }
    return "تعیین نشده";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return moment(dateString).format("jYYYY/jMM/jDD");
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.Status !== statusFilter) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const customerName = getCustomerName(request).toLowerCase();
    return (
      request.ID.toString().includes(searchTerm) ||
      customerName.includes(searchLower) ||
      request.plan?.toLowerCase().includes(searchLower) ||
      request.Category?.name?.toLowerCase().includes(searchLower) ||
      getSpecialistName(request).toLowerCase().includes(searchLower)
    );
  });

  const handleView = (request: SupportRequest) => {
    setSelectedRequest(request);
    setModalType("view");
  };

  const handleAssign = (request: SupportRequest) => {
    setSelectedRequest(request);
    setSelectedSpecialistId(request.AssignedSpecialistID || "");
    setModalType("assign");
  };

  const handleDeleteClick = (request: SupportRequest) => {
    setSelectedRequest(request);
    setModalType("delete");
  };

  const confirmAssign = async () => {
    if (selectedRequest && selectedSpecialistId) {
      const success = await assignSpecialist(
        selectedRequest.ID,
        Number(selectedSpecialistId),
      );
      if (success) {
        closeModal();
      }
    } else {
      alert("لطفاً متخصص را انتخاب کنید");
    }
  };

  const confirmDelete = async () => {
    if (selectedRequest) {
      const success = await deleteRequest(selectedRequest.ID);
      if (success) {
        closeModal();
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRequest(null);
    setSelectedSpecialistId("");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
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
    <div className="flex flex-col bg-gray-100">
      <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                🎫 درخواست‌های پشتیبانی
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت و مشاهده درخواست‌های پشتیبانی کاربران
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، مشتری، پلن، دسته‌بندی یا متخصص..."
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
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="created">ایجاد شده</option>
                  <option value="inProgress">در حال انجام</option>
                  <option value="resolved">حل شده</option>
                  <option value="cancelled">لغو شده</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  حذف فیلترها
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {toPersianNumber(filteredRequests.length)} درخواست یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      مشتری
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      پلن
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      دسته‌بندی
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      متخصص
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      تاریخ ایجاد
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.ID} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        #{request.ID}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getCustomerName(request)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {planLabels[request.plan] || request.plan}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
				className={`py-1 text-xs rounded-full ${categoryColors[request.Category?.name ?? ''] || "bg-gray-100 text-gray-600"}`}
                        >
                          {request.Category?.name || "—"}
                        </span>
                        {request.headTechRequired && (
                          <span className="mr-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            نیازمند تکنسین ارشد
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getSpecialistName(request)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${statusConfig[request.Status]?.color}`}
                        >
                          {statusConfig[request.Status]?.icon}{" "}
                          {statusConfig[request.Status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(request.CreatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(request)}
                            className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                          >
                            مشاهده
                          </button>
                          {request.Status === "created" && (
                            <button
                              onClick={() => handleAssign(request)}
                              className="text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                            >
                              اختصاص
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(request)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {filteredRequests.map((request) => (
                <div key={request.ID} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">
                      ID: #{request.ID}
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
                      <span className="text-xs text-gray-500">پلن:</span>{" "}
                      {planLabels[request.plan] || request.plan}
                    </div>
                        {request.headTechRequired && (
                          <div className="col-span-2 text-red-700 font-medium">
                            این درخواست به بررسی تکنسین ارشد نیاز دارد.
                          </div>
                        )}
                    <div>
                      <span className="text-xs text-gray-500">دسته‌بندی:</span>{" "}
                      {request.Category?.name || "—"}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">متخصص:</span>{" "}
                      {getSpecialistName(request)}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">تاریخ:</span>{" "}
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
                    {request.Status === "created" && (
                      <button
                        onClick={() => handleAssign(request)}
                        className="flex-1 text-green-600 py-2 text-sm"
                      >
                        اختصاص
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(request)}
                      className="flex-1 text-red-600 py-2 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
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
                  <label className="text-sm text-gray-500">ID</label>
                  <p>#{selectedRequest.ID}</p>
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
                  <label className="text-sm text-gray-500">پلن</label>
                  <p>
                    {planLabels[selectedRequest.plan] || selectedRequest.plan}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">دسته‌بندی</label>
                  <p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${categoryColors[selectedRequest.Category?.name ?? ""] || "bg-gray-100"}`}
                    >
                      {selectedRequest.Category?.name || "—"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">متخصص</label>
                  <p>{getSpecialistName(selectedRequest)}</p>
                </div>
                {selectedRequest.headTechRequired && (
                  <div className="col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    این درخواست به بررسی تکنسین ارشد نیاز دارد.
                  </div>
                )}
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
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Specialist Modal */}
      {modalType === "assign" && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">اختصاص متخصص</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  انتخاب متخصص
                </label>
                <select
                  value={selectedSpecialistId}
                  onChange={(e) =>
                    setSelectedSpecialistId(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {specialists.map((spec) => (
                    <option key={spec.ID} value={spec.ID}>
                      {spec.user?.name} {spec.user?.lastName} (ID: {spec.ID})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ پس از اختصاص، وضعیت درخواست به در حال انجام تغییر می‌کند
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={confirmAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                اختصاص
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalType === "delete" && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">
                حذف درخواست
              </h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف درخواست #{selectedRequest.ID} مطمئن هستید؟
                <br />
                <span className="text-sm text-red-500">
                  این عمل قابل بازگشت نیست.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
