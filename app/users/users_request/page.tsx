"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  cancelSupportRequest,
  fetchUserSupportRequests,
  finishSupportRequest,
  type SupportRequestListItem,
} from "../../lib/api/user-requests";

type SupportRequest = SupportRequestListItem;

const statusConfig: {
  [key: string]: {
    label: string;
    color: string;
    icon: string;
  };
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
  done: {
    label: "تکمیل شده",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  },
  resolved: {
    label: "حل شده",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  },
  cancelled: {
    label: "لغو شده",
    color: "bg-red-100 text-red-800",
    icon: "❌",
  },
};

const planLabels: { [key: string]: string } = {
  instant: "فوری",
  shortStay: "کوتاه‌مدت",
  schedulable: "زمان‌بندی شده",
  inPerson: "حضوری",
  platformPublished: "پلتفرم",
};

const planIcons: { [key: string]: string } = {
  instant: "⚡",
  shortStay: "🏨",
  schedulable: "📅",
  inPerson: "🏢",
  platformPublished: "🌐",
};

const categoryColors: { [key: string]: string } = {
  firewall: "bg-red-100 text-red-800",
  routing: "bg-blue-100 text-blue-800",
  "routing&switching": "bg-blue-100 text-blue-800",
  sambal: "bg-purple-100 text-purple-800",
  security: "bg-green-100 text-green-800",
  cloud: "bg-cyan-100 text-cyan-800",
};

export default function UserRequestsPage() {
  const { user, getAccessToken } = useAuth();

  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
    null,
  );

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // =========================
  // دریافت درخواست‌ها
  // =========================

  const fetchRequests = useCallback(async () => {
    const token = getAccessToken();

    if (!token || !user?.ID) return;

    setLoading(true);

    try {
      const sortedRequests = await fetchUserSupportRequests(token, user.ID);
      setRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.ID, getAccessToken]);

  useEffect(() => {
    if (user?.ID) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // =========================
  // فرمت تاریخ
  // =========================

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  // =========================
  // نام فارسی پلن
  // =========================

  const getPlanLabel = (plan: string) => {
    return planLabels[plan] || plan;
  };

  // =========================
  // آیکون پلن
  // =========================

  const getPlanIcon = (plan: string) => {
    return planIcons[plan] || "📋";
  };

  // =========================
  // فیلتر درخواست‌ها
  // =========================

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return "bg-gray-100 text-gray-700";
    return categoryColors[categoryName.toLowerCase()] || "bg-gray-100 text-gray-700";
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter !== "all" && request.Status !== statusFilter) {
      return false;
    }

    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    return (
      request.ID.toString().includes(searchTerm) ||
      request.plan?.toLowerCase().includes(searchLower) ||
      request.Category?.name?.toLowerCase().includes(searchLower)
    );
  });

  // =========================
  // مشاهده
  // =========================

  const handleView = (request: SupportRequest) => {
    setSelectedRequest(request);
  };

  // =========================
  // لغو
  // =========================

  const handleCancel = (request: SupportRequest) => {
    setSelectedRequest(request);
    setShowCancelModal(true);
  };

  const handleFinish = (request: SupportRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowFinishModal(true);
  };

  const submitFinish = async (endApproved: boolean) => {
    if (!selectedRequest) return;
    if (!endApproved && (selectedRequest.retries ?? 0) >= 3) {
      alert("حداکثر تعداد رد درخواست تکمیل شده است");
      return;
    }
    if (!endApproved && !rejectionReason.trim()) {
      alert("لطفاً دلیل رد پایان درخواست را وارد کنید");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    try {
      const result = await finishSupportRequest(
        token,
        selectedRequest.ID,
        endApproved,
        rejectionReason,
      );

      if (result.ok) {
        await fetchRequests();
        setShowFinishModal(false);
        setSelectedRequest(null);
        alert(endApproved ? "پایان درخواست تأیید شد" : "درخواست برای بررسی مجدد بازگشت داده شد");
      } else {
        alert(`❌ خطا: ${result.responseText}`);
      }
    } catch (error) {
      console.error("Error finishing request:", error);
      alert("❌ خطا در ارتباط با سرور");
    }
  };

  // =========================
  // تأیید لغو
  // =========================

  const confirmCancel = async () => {
    if (!selectedRequest) return;

    const token = getAccessToken();

    if (!token) return;

    try {
      const result = await cancelSupportRequest(token, selectedRequest.ID);

      if (result.ok) {
        alert(`✅ درخواست #${selectedRequest.ID} با موفقیت لغو شد`);

        await fetchRequests();

        setShowCancelModal(false);
        setSelectedRequest(null);
      } else {
        alert("❌ خطا در لغو درخواست");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("❌ خطا در ارتباط با سرور");
    }
  };

  // =========================
  // بستن مودال
  // =========================

  const closeModal = () => {
    setSelectedRequest(null);
    setShowCancelModal(false);
    setShowFinishModal(false);
  };

  // =========================
  // ریست فیلتر
  // =========================

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // =========================
  // وضعیت‌ها
  // =========================

  const statusOptions = [
    {
      value: "all",
      label: "همه وضعیت‌ها",
    },
    {
      value: "created",
      label: "ایجاد شده",
    },
    {
      value: "inProgress",
      label: "در حال انجام",
    },
    {
      value: "waitingApproval",
      label: "در انتظار تأیید مشتری",
    },
    {
      value: "done",
      label: "تکمیل شده",
    },
    {
      value: "cancelled",
      label: "لغو شده",
    },
    {
      value: "resolved",
      label: "حل شده",
    },
  ];

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex items-center justify-center min-h-screen bg-gray-100"
      >
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-30">
        {/* =========================
            Header
        ========================= */}

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📋 درخواست‌های پشتیبانی من
          </h1>

          <p className="text-gray-600 text-sm mt-1">
            پیگیری و مدیریت درخواست‌های پشتیبانی شما
          </p>
        </div>

        {/* =========================
            Actions
        ========================= */}

        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search */}

            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                placeholder="جستجو بر اساس شناسه، طرح یا دسته‌بندی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <svg
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Status Filter */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Reset */}

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              حذف فیلترها
            </button>
          </div>
        </div>

        {/* =========================
            Desktop Table
        ========================= */}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="hidden md:block overflow-auto max-h-[49vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    شناسه
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    طرح
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    دسته‌بندی
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    وضعیت
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    تاریخ ایجاد
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.ID}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      #{request.ID}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1">
                        {getPlanIcon(request.plan)}

                        {getPlanLabel(request.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
                            request.Category?.name,
                          )}`}
                        >
                          {request.Category?.name || "—"}
                        </span>
                        {request.headTechRequired && (
                          <span className="text-xs font-medium text-red-700">
                            نیازمند تکنسین ارشد
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          statusConfig[request.Status]?.color ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusConfig[request.Status]?.icon}{" "}
                        {statusConfig[request.Status]?.label || request.Status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(request.CreatedAt)}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(request)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          مشاهده
                        </button>

                        {(request.Status === "created" ||
                          request.Status === "inProgress") && (
                          <button
                            onClick={() => handleCancel(request)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            لغو
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =========================
              Mobile
          ========================= */}

          <div className="md:hidden divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.ID} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">#{request.ID}</span>

                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      statusConfig[request.Status]?.color ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusConfig[request.Status]?.icon}{" "}
                    {statusConfig[request.Status]?.label || request.Status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {getPlanIcon(request.plan)} {getPlanLabel(request.plan)}
                  </span>

                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(
                      request.Category?.name,
                    )}`}
                  >
                    {request.Category?.name || "—"}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  تاریخ: {formatDate(request.CreatedAt)}
                </div>
                {request.headTechRequired && (
                  <div className="text-sm font-medium text-red-700 mb-3">
                    نیازمند تکنسین ارشد
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(request)}
                    className="flex-1 text-indigo-600 border border-indigo-200 py-2 rounded-lg text-sm hover:bg-indigo-50"
                  >
                    مشاهده
                  </button>

                  {(request.Status === "created" ||
                    request.Status === "inProgress") && (
                    <button
                      onClick={() => handleCancel(request)}
                      className="flex-1 text-red-600 border border-red-200 py-2 rounded-lg text-sm hover:bg-red-50"
                    >
                      لغو
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty */}

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

      {/* =========================
          View Modal
      ========================= */}

      {selectedRequest && !showCancelModal && !showFinishModal && (
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
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        statusConfig[selectedRequest.Status]?.color ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusConfig[selectedRequest.Status]?.icon}{" "}
                      {statusConfig[selectedRequest.Status]?.label ||
                        selectedRequest.Status}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">طرح</label>

                  <p>
                    {getPlanIcon(selectedRequest.plan)}{" "}
                    {getPlanLabel(selectedRequest.plan)}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-500">دسته‌بندی</label>

                  <p>{selectedRequest.Category?.name || "—"}</p>
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
              {selectedRequest.Status === "waitingApproval" && (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleFinish(selectedRequest)}
                    disabled={(selectedRequest.retries ?? 0) >= 3}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    رد پایان
                  </button>
                  <button
                    onClick={() => submitFinish(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    تأیید پایان
                  </button>
                </div>
              )}
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

      {showFinishModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">رد پایان درخواست</h3>
            <p className="text-sm text-gray-600 mb-3">
              رد اول و دوم، درخواست را دوباره به وضعیت در حال انجام برمی‌گرداند. رد سوم نیاز به تکنسین ارشد دارد.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="دلیل رد پایان را وارد کنید"
              className="w-full min-h-24 border rounded-lg p-3"
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded-lg">
                انصراف
              </button>
              <button onClick={() => submitFinish(false)} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                ثبت رد پایان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          Cancel Modal
      ========================= */}

      {showCancelModal && selectedRequest && (
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
                لغو درخواست
              </h3>

              <p className="text-gray-600 text-center mb-6">
                آیا از لغو درخواست #{selectedRequest.ID} مطمئن هستید؟
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
                  onClick={confirmCancel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  لغو درخواست
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
