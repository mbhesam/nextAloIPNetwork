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
  success: { label: "موفق", color: "bg-green-100 text-green-800", icon: "✅" },
  pending: {
    label: "در انتظار",
    color: "bg-yellow-100 text-yellow-800",
    icon: "⏳",
  },
  failed: { label: "ناموفق", color: "bg-red-100 text-red-800", icon: "❌" },
  internal_charge: {
    label: "شارژ داخلی",
    color: "bg-blue-100 text-blue-800",
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

  // دریافت لیست پرداخت‌ها
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

  // حذف پرداخت
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
                💳 پرداخت‌ها
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                مدیریت و مشاهده تراکنش‌های پرداخت کاربران
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
                  placeholder="جستجو بر اساس ID، User ID، مبلغ یا کد رهگیری..."
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
              {toPersianNumber(filteredPayments.length)} پرداخت یافت شد
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
                      User ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      مبلغ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      کد رهگیری
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      تاریخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.ID} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.ID}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.UserID}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
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
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {payment.GatewayRef || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(payment.CreatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(payment)}
                            className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                          >
                            مشاهده
                          </button>
                          <button
                            onClick={() => handleDeleteClick(payment)}
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
              {filteredPayments.map((payment) => (
                <div key={payment.ID} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-500">
                        ID: {payment.ID}
                      </span>
                      <span className="text-xs text-gray-500 mx-2">|</span>
                      <span className="text-xs text-gray-500">
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
                  <div className="text-base font-bold text-gray-900 mb-2">
                    {formatAmount(payment.Amount)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-500">کد رهگیری:</span>{" "}
                      <span className="font-mono text-xs">
                        {payment.GatewayRef || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">تاریخ:</span>{" "}
                      {formatDate(payment.CreatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleView(payment)}
                      className="flex-1 text-indigo-600 py-2 text-sm"
                    >
                      مشاهده
                    </button>
                    <button
                      onClick={() => handleDeleteClick(payment)}
                      className="flex-1 text-red-600 py-2 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">نتیجه‌ای یافت نشد</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="text-xl font-bold">مشاهده پرداخت</h2>
              <button onClick={closeModal} className="text-gray-400 text-2xl">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500">ID</label>
                  <p className="font-medium">{selectedPayment.ID}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User ID</label>
                  <p>{selectedPayment.UserID}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">مبلغ</label>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(selectedPayment.Amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">وضعیت</label>
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
                  <label className="text-sm text-gray-500">تاریخ</label>
                  <p>{formatDate(selectedPayment.CreatedAt)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">کد رهگیری</label>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {selectedPayment.GatewayRef || "—"}
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

      {/* Delete Modal */}
      {modalType === "delete" && selectedPayment && (
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
              <h3 className="text-lg font-bold text-center mb-2">حذف پرداخت</h3>
              <p className="text-gray-600 text-center mb-6">
                آیا از حذف پرداخت #{selectedPayment.ID} به مبلغ{" "}
                {formatAmount(selectedPayment.Amount)} مطمئن هستید؟
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
