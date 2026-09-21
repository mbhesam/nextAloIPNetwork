"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment-jalaali";
import { API_BASE_URL } from "../../lib/api";

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

const shouldRequireSeniorTech = (request: SupportRequest) => {
  return Boolean(request.headTechRequired) || (request.retries ?? 0) >= 2;
};

interface Specialist {
  ID: number;
  userID: number;
  user?: {
    ID: number;
    name: string;
    lastName: string;
  };
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
  schedulable: "زمان‌بندی شده",
  shortStay: "کوتاه‌مدت",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
};

const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-500/20 text-red-200",
  "routing&switching": "bg-blue-500/20 text-blue-200",
  Sambal: "bg-purple-500/20 text-purple-200",
  security: "bg-green-500/20 text-green-200",
  cloud: "bg-cyan-500/20 text-cyan-200",
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
      <div className="flex items-center justify-center min-h-screen ">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-6 relative overflow-hidden">
      {/* پس‌زمینه متحرک */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg shadow-blue-500/5 flex flex-col flex-1 min-h-0 overflow-hidden mt-25">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white/90">
                🎫 درخواست‌های پشتیبانی
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده درخواست‌های پشتیبانی کاربران
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، مشتری، پلن، دسته‌بندی یا متخصص..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div className="sm:w-64">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  وضعیت
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <option
                    value="all"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    همه وضعیت‌ها
                  </option>
                  <option
                    value="created"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    ایجاد شده
                  </option>
                  <option
                    value="inProgress"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    در حال انجام
                  </option>
                  <option
                    value="resolved"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    حل شده
                  </option>
                  <option
                    value="cancelled"
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    لغو شده
                  </option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-white/70 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition border border-white/10"
                >
                  حذف فیلترها
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/40">
              {toPersianNumber(filteredRequests.length)} درخواست یافت شد
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      مشتری
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      پلن
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      دسته‌بندی
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      متخصص
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      تاریخ ایجاد
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.ID}
                      className="hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3 text-sm text-white/80">
                        #{request.ID}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white/90">
                        {getCustomerName(request)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {planLabels[request.plan] || request.plan}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${categoryColors[request.Category?.name ?? ""] || "bg-white/10 text-white/60"}`}
                        >
                          {request.Category?.name || "—"}
                        </span>
                        {shouldRequireSeniorTech(request) && (
                          <span className="mr-2 px-2 py-1 text-xs rounded-full bg-red-500/20 text-white border border-red-400/20">
                            نیازمند تکنسین ارشد
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
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
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatDate(request.CreatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(request)}
                            className="text-blue-300 hover:text-blue-200 px-2 py-1 rounded  transition"
                          >
                            مشاهده
                          </button>
                          {request.Status === "created" && (
                            <button
                              onClick={() => handleAssign(request)}
                              className="text-green-300 hover:text-green-200 px-2 py-1 rounded transition"
                            >
                              اختصاص
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(request)}
                            className="text-red-300 hover:text-red-200 px-2 py-1 rounded  transition"
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
                <div
                  key={request.ID}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/40">
                      ID: #{request.ID}
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
                    <div>پلن: {planLabels[request.plan] || request.plan}</div>
                    {shouldRequireSeniorTech(request) && (
                      <div className="col-span-2 text-red-300 font-medium">
                        این درخواست به بررسی تکنسین ارشد نیاز دارد.
                      </div>
                    )}
                    <div>دسته‌بندی: {request.Category?.name || "—"}</div>
                    <div>متخصص: {getSpecialistName(request)}</div>
                    <div>تاریخ: {formatDate(request.CreatedAt)}</div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(request)}
                      className="flex-1 text-blue-300 py-2 text-sm  rounded transition"
                    >
                      مشاهده
                    </button>
                    {request.Status === "created" && (
                      <button
                        onClick={() => handleAssign(request)}
                        className="flex-1 text-green-300 py-2 text-sm  rounded transition"
                      >
                        اختصاص
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(request)}
                      className="flex-1 text-red-300 py-2 text-sm  rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/50">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-blue-300 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition"
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
                  <label className="text-sm text-white/50">ID</label>
                  <p className="text-white/80">#{selectedRequest.ID}</p>
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
                  <p className="text-white/80">
                    {getCustomerName(selectedRequest)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">پلن</label>
                  <p className="text-white/80">
                    {planLabels[selectedRequest.plan] || selectedRequest.plan}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">دسته‌بندی</label>
                  <p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${categoryColors[selectedRequest.Category?.name ?? ""] || "bg-white/10 text-white/60"}`}
                    >
                      {selectedRequest.Category?.name || "—"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">متخصص</label>
                  <p className="text-white/80">
                    {getSpecialistName(selectedRequest)}
                  </p>
                </div>
                {shouldRequireSeniorTech(selectedRequest) && (
                  <div className="col-span-2 rounded-lg bg-red-500/20 border border-red-400/30 px-3 py-2 text-sm font-medium text-red-200">
                    این درخواست به بررسی تکنسین ارشد نیاز دارد.
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-sm text-white/50">تاریخ ایجاد</label>
                  <p className="text-white/80">
                    {formatDate(selectedRequest.CreatedAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-white/50">شرح درخواست</label>
                  <p className="bg-white/5 backdrop-blur-sm p-2 rounded border border-white/10 text-white/80">
                    {selectedRequest.description || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">اختصاص متخصص</h2>
              <button
                onClick={closeModal}
                className="text-white/40 text-2xl hover:text-white/80 transition"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  انتخاب متخصص
                </label>
                <select
                  value={selectedSpecialistId}
                  onChange={(e) =>
                    setSelectedSpecialistId(Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: "#4a4a4a", color: "white" }}
                  >
                    انتخاب کنید...
                  </option>
                  {specialists.map((spec) => (
                    <option
                      key={spec.ID}
                      value={spec.ID}
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      {spec.user?.name} {spec.user?.lastName} (ID: {spec.ID})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-yellow-500/10 backdrop-blur-sm rounded-lg p-3 border border-yellow-400/20">
                <p className="text-sm text-yellow-200/80">
                  ⚠️ پس از اختصاص، وضعیت درخواست به در حال انجام تغییر می‌کند
                </p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                انصراف
              </button>
              <button
                onClick={confirmAssign}
                className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-white border border-blue-400/20 rounded-lg transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30">
                  <svg
                    className="w-8 h-8 text-red-300"
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
              <h3 className="text-lg font-bold text-white/90 text-center mb-2">
                حذف درخواست
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف درخواست #{selectedRequest.ID} مطمئن هستید؟
                <br />
                <span className="text-sm text-red-300">
                  این عمل قابل بازگشت نیست.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 text-red-200 border border-red-400/30 rounded-lg transition"
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
