"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import moment from "moment-jalaali";
import { API_BASE_URL } from "../../lib/api";

interface Payment {
  ID: number;
  UserID: number;
  Amount: number;
  Status: string;
  GatewayRef: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

const statusConfig: {
  [key: string]: { label: string; color: string; icon: string };
} = {
  success: {
    label: "موفق",
    color: "bg-green-500/20 text-green-200",
    icon: "✅",
  },
  pending: {
    label: "در انتظار",
    color: "bg-yellow-500/20 text-yellow-200",
    icon: "⏳",
  },
  failed: { label: "ناموفق", color: "bg-red-500/20 text-red-200", icon: "❌" },
  internal_charge: {
    label: "شارژ داخلی",
    color: "bg-blue-500/20 text-blue-200",
    icon: "🏦",
  },
};

type ModalType = "view" | "delete" | null;

export default function AdminPaymentsPage() {
  const { getAccessToken } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const statusOptions = [
    { value: "all", label: "همه وضعیت‌ها" },
    { value: "success", label: "موفق" },
    { value: "pending", label: "در انتظار" },
    { value: "failed", label: "ناموفق" },
    { value: "internal_charge", label: "شارژ داخلی" },
  ];

  const fetchPayments = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/v1/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const paymentsArray = Array.isArray(data)
          ? data
          : data.data || data.payments || [];
        setPayments(paymentsArray);
      } else {
        console.error("Error fetching payments:", response.status);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (id: number) => {
    const token = getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/v1/payments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchPayments();
        return true;
      } else {
        const error = await response.text();
        alert(`❌ خطا: ${error}`);
        return false;
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("❌ خطا در ارتباط با سرور");
      return false;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatAmount = (amount: number): string => {
    if (!amount && amount !== 0) return "۰";
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return moment(dateString).format("jYYYY/jMM/jDD");
  };

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter !== "all" && payment.Status !== statusFilter) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.ID.toString().includes(searchTerm) ||
      payment.UserID.toString().includes(searchTerm) ||
      payment.Amount.toString().includes(searchTerm) ||
      payment.GatewayRef?.toLowerCase().includes(searchLower)
    );
  });

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setModalType("view");
  };

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setModalType("delete");
  };

  const confirmDelete = async () => {
    if (selectedPayment) {
      const success = await deletePayment(selectedPayment.ID);
      if (success) {
        closeModal();
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedPayment(null);
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
      <div className="flex items-center justify-center min-h-screen">
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
                💳 پرداخت‌ها
              </h1>
              <p className="text-white/50 text-sm mt-1">
                مدیریت و مشاهده تراکنش‌های پرداخت کاربران
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
                  placeholder="جستجو بر اساس ID، User ID، مبلغ یا کد رهگیری..."
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
              {toPersianNumber(filteredPayments.length)} پرداخت یافت شد
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
                      User ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      مبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      کد رهگیری
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      تاریخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/50">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.ID}
                      className="hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3 text-sm text-white/80">
                        {payment.ID}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {payment.UserID}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/90 font-medium">
                        {formatAmount(payment.Amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${statusConfig[payment.Status]?.color}`}
                        >
                          {statusConfig[payment.Status]?.icon}{" "}
                          {statusConfig[payment.Status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60 font-mono">
                        {payment.GatewayRef || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatDate(payment.CreatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(payment)}
                            className="text-blue-300 hover:text-blue-200 px-2 py-1 rounded hover:bg-blue-500/10 transition"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleDeleteClick(payment)}
                            className="text-red-300 hover:text-red-200 px-2 py-1 rounded hover:bg-red-500/10 transition"
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
              {filteredPayments.map((payment) => (
                <div
                  key={payment.ID}
                  className="p-4 border-b border-white/5 hover:bg-white/5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-white/40">
                        ID: {payment.ID}
                      </span>
                      <span className="text-xs text-white/40 mx-2">|</span>
                      <span className="text-xs text-white/40">
                        User ID: {payment.UserID}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[payment.Status]?.color}`}
                    >
                      {statusConfig[payment.Status]?.icon}{" "}
                      {statusConfig[payment.Status]?.label}
                    </span>
                  </div>
                  <div className="text-base font-bold text-white/90 mb-2">
                    {formatAmount(payment.Amount)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <div>
                      <span className="text-xs text-white/40">کد رهگیری:</span>
                      <span className="font-mono text-xs text-white/60">
                        {payment.GatewayRef || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-white/40">تاریخ:</span>
                      <span className="text-white/60">
                        {formatDate(payment.CreatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleView(payment)}
                      className="flex-1 text-blue-300 py-2 text-sm  rounded transition"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleDeleteClick(payment)}
                      className="flex-1 text-red-300 py-2 text-sm  rounded transition"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
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
      {modalType === "view" && selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold text-white/90">مشاهده پرداخت</h2>
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
                  <p className="font-medium text-white/80">
                    {selectedPayment.ID}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">User ID</label>
                  <p className="text-white/80">{selectedPayment.UserID}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-white/50">مبلغ</label>
                  <p className="text-lg font-bold text-green-300">
                    {formatAmount(selectedPayment.Amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">وضعیت</label>
                  <p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${statusConfig[selectedPayment.Status]?.color}`}
                    >
                      {statusConfig[selectedPayment.Status]?.icon}{" "}
                      {statusConfig[selectedPayment.Status]?.label}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/50">تاریخ</label>
                  <p className="text-white/80">
                    {formatDate(selectedPayment.CreatedAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-white/50">کد رهگیری</label>
                  <p className="font-mono text-sm bg-white/5 backdrop-blur-sm p-2 rounded border border-white/10 text-white/80">
                    {selectedPayment.GatewayRef || "—"}
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

      {/* Delete Modal */}
      {modalType === "delete" && selectedPayment && (
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
                حذف پرداخت
              </h3>
              <p className="text-white/60 text-center mb-6">
                آیا از حذف پرداخت #{selectedPayment.ID} به مبلغ{" "}
                {formatAmount(selectedPayment.Amount)} مطمئن هستید؟
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
