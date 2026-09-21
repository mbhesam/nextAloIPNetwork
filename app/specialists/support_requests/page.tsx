// app/specialist/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment-jalaali";
import {
  acceptSpecialistSupportRequest,
  completeSpecialistSupportRequest,
  fetchSpecialistInfo,
  fetchSpecialistSupportRequests,
  planLabels,
  statusConfig,
  type SpecialistRecord,
  type SpecialistSupportRequest,
} from "../../lib/api/specialist-support-requests";

type SupportRequest = SpecialistSupportRequest;
type Specialist = SpecialistRecord;

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

  const [showDurationModal, setShowDurationModal] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");

  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    { value: "created", label: "ایجاد شده" },
    { value: "inProgress", label: "در حال انجام" },
    { value: "resolved", label: "حل شده" },
    { value: "cancelled", label: "لغو شده" },
  ];

  const fetchSpecialistData = async () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const specialist = await fetchSpecialistInfo(token, user?.ID);
      if (specialist) {
        setSpecialistInfo(specialist);
      }
      return specialist;
    } catch (error) {
      console.error("Error fetching specialist info:", error);
      return null;
    }
  };

  const fetchRequests = async (specialist: Specialist | null) => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { requests, shiftMessage: nextShiftMessage } =
        await fetchSpecialistSupportRequests(token, specialist);
      setRequests(requests);
      setShiftMessage(nextShiftMessage);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: number) => {
    const token = getAccessToken();
    if (!token || !specialistInfo) return false;

    try {
      const result = await acceptSpecialistSupportRequest(
        token,
        specialistInfo.ID,
        requestId,
      );

      if (result.ok) {
        await fetchRequests(specialistInfo);
        return true;
      } else {
        const error = result.responseText;
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("❌ خطا در ارتباط با سرور");
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
      const result = await completeSpecialistSupportRequest(
        token,
        requestId,
        durationMinutes,
      );

      if (result.ok) {
        await fetchRequests(specialistInfo);
        return true;
      } else {
        const error = result.responseText;
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
      const specialist = await fetchSpecialistData();
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
    if (request.AssignedSpecialistID === specialistInfo?.ID) {
      return "view";
    }
    if (
      request.AssignedSpecialistID &&
      request.AssignedSpecialistID !== specialistInfo?.ID
    ) {
      return "assigned";
    }
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

  const handleComplete = (request: SupportRequest) => {
    setSelectedRequest(request);
    setDurationMinutes("");
    setShowDurationModal(true);
  };

  const submitComplete = async () => {
    if (!selectedRequest) return;
    const minutes = parseInt(durationMinutes);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      alert("لطفاً مدت زمان معتبر (به دقیقه) وارد کنید");
      return;
    }

    const success = await completeRequest(selectedRequest.ID, minutes);
    if (success) {
      alert(`✅ درخواست #${selectedRequest.ID} با موفقیت تکمیل شد`);
      setShowDurationModal(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRequest(null);
    setShowDurationModal(false);
    setDurationMinutes("");
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col  p-4 md:p-6 relative overflow-hidden mt-30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white/90">
            📋 همه درخواست‌های پشتیبانی
          </h1>
          <p className="text-white/50 text-sm mt-1">
            مشاهده و مدیریت تمام درخواست‌های پشتیبانی
          </p>
        </div>

        {shiftMessage && (
          <div className="flex-shrink-0 mb-4 rounded-xl  bg-red-500 backdrop-blur-sm px-4 py-3 text-sm text-amber-200/80">
            {shiftMessage}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden shrink-0 mb-2">
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  placeholder="جستجو بر اساس ID، مشتری، طرح یا دسته‌بندی..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </div>
              <div className="sm:w-64">
                <label className="block text-sm font-medium text-white/80 mb-2">
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
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{ backgroundColor: "#4a4a4a", color: "white" }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-white/70 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition border border-white/10"
                >
                  حذف فیلترها
                </button>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-blue-500/30 text-white rounded-lg hover:bg-blue-500/40 transition border border-blue-400/20"
                >
                  به‌روزرسانی
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-white/50">
              {toPersianNumber(filteredRequests.length)} درخواست یافت شد
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto mt-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-blue-500/5 overflow-hidden h-auto">
            <div className="hidden md:block h-full overflow-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5 sticky top-0 z-10">
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
                  {filteredRequests.map((request) => {
                    const actionType = getActionType(request);
                    return (
                      <tr
                        key={request.ID}
                        className="hover:bg-white/5 transition"
                      >
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
                            {request.endRejectionReason &&
                              (request.retries ?? 0) > 0 && (
                                <span className="block mt-1 px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/20">
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
                          {actionType === "accept" ? (
                            <button
                              onClick={() => handleAccept(request)}
                              className="bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30 px-3 py-1 rounded-md text-sm transition"
                            >
                              ✅ پذیرش درخواست
                            </button>
                          ) : actionType === "assigned" ? (
                            <span className="text-xs text-white/30">
                              {getAssignedToText(request)}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleView(request)}
                              className="text-blue-300 hover:text-blue-200 px-3 py-1 rounded-md text-sm transition"
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

            <div className="md:hidden h-full overflow-auto">
              <div className="divide-y divide-white/10">
                {filteredRequests.map((request) => {
                  const actionType = getActionType(request);
                  return (
                    <div
                      key={request.ID}
                      className="p-4 hover:bg-white/5 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-white/40">
                          #{request.ID}
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
                        <div>
                          طرح: {planLabels[request.plan] || request.plan}
                        </div>
                        <div>
                          دسته‌بندی: {request.Category?.name || "—"} /{" "}
                          {request.Category?.subCategory?.join(", ") || "—"}
                        </div>
                        <div className="col-span-2">
                          تاریخ ایجاد: {formatDate(request.CreatedAt)}
                        </div>
                        {request.endRejectionReason &&
                          (request.retries ?? 0) > 0 && (
                            <div className="col-span-2 text-orange-300 font-medium text-xs mt-1">
                              دلیل رد: {request.endRejectionReason}
                            </div>
                          )}
                      </div>
                      <div className="mt-2">
                        {actionType === "accept" ? (
                          <button
                            onClick={() => handleAccept(request)}
                            className="w-full bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30 py-2 rounded-md text-sm transition"
                          >
                            ✅ پذیرش درخواست
                          </button>
                        ) : actionType === "assigned" ? (
                          <p className="text-xs text-white/30 text-center py-2">
                            {getAssignedToText(request)}
                          </p>
                        ) : (
                          <button
                            onClick={() => handleView(request)}
                            className="w-full text-blue-300 border border-blue-400/30 py-2 rounded-md text-sm hover:bg-blue-500/10 transition"
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
                      <label className="text-sm text-white">
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
              {selectedRequest.Status === "inProgress" &&
                selectedRequest.AssignedSpecialistID === specialistInfo?.ID && (
                  <button
                    onClick={() => handleComplete(selectedRequest)}
                    className="px-4 py-2 bg-green-500/20 text-green-200 border border-green-400/30 rounded-lg hover:bg-green-500/30 transition"
                  >
                    پایان پشتیبانی
                  </button>
                )}
              {getActionType(selectedRequest) === "accept" && (
                <button
                  onClick={() => handleAccept(selectedRequest)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition"
                >
                  پذیرش درخواست
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDurationModal && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white/90 mb-3">
              پایان پشتیبانی درخواست #{selectedRequest.ID}
            </h3>
            <p className="text-sm text-white/60 mb-4">
              لطفاً مدت زمان انجام درخواست را به دقیقه وارد کنید. این مقدار در
              دیتابیس ذخیره می‌شود و برای تأیید به مشتری نمایش داده می‌شود.
            </p>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="مثال: 60"
              className="w-full p-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              autoFocus
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setShowDurationModal(false);
                  setDurationMinutes("");
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition"
              >
                انصراف
              </button>
              <button
                onClick={submitComplete}
                className="px-4 py-2 bg-green-500/20 text-green-200 border border-green-400/30 rounded-lg hover:bg-green-500/30 transition"
              >
                ثبت پایان
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
